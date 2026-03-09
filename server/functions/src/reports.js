import { onRequest } from 'firebase-functions/v2/https';
import PDFDocument from 'pdfkit';
import { corsHandler } from './config.js';
import { generateRandomCode, authenticateRequest, fetchReportData } from './reportHelpers.js';

/**
 * Generate and download college report in JSON format
 */
export const downloadReportJson = onRequest({ invoker: 'public' }, async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      console.log('=== downloadReportJson called ===');

      const auth = await authenticateRequest(req, res, 'json');
      if (!auth) return;
      const { userId, userData } = auth;

      const result = await fetchReportData(userData, userId);
      if (!result) {
        res.status(403).json({ error: 'Only admin and management can generate reports' });
        return;
      }

      const { reportData } = result;

      // Generate filename
      const randomCode = generateRandomCode();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `HOAS-Report-${randomCode}-${timestamp}.json`;
      console.log('Generated JSON report with filename:', filename);
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    // Send the JSON data
    res.status(200).json(reportData);
    } catch (error) {
      console.error('Error generating JSON report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

/**
 * Generate and download college report in PDF format
 */
export const downloadReportPdf = onRequest({ invoker: 'public' }, async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      console.log('=== downloadReportPdf called ===');

      const auth = await authenticateRequest(req, res, 'text');
      if (!auth) return;
      const { userId, userData } = auth;

      if (userData.role !== 'admin' && userData.role !== 'management') {
        res.status(403).send('Only admin and management can generate reports');
        return;
      }

      const result = await fetchReportData(userData, userId);
      if (!result) {
        res.status(403).send('Only admin and management can generate reports');
        return;
      }

      const { reportTitle, reportData } = result;

    // Generate random code for filename
    const randomCode = generateRandomCode();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `HOAS-Report-${randomCode}-${timestamp}.pdf`;
    
    console.log('Generated PDF report with filename:', filename);
    
    // Set headers for download BEFORE creating PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    // NOW create PDF with proper settings AFTER all data is ready
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Define colors
    const primaryColor = '#4F46E5'; // Indigo
    const secondaryColor = '#6366F1';
    const textColor = '#1F2937';
    const grayColor = '#6B7280';
    
    // Add HOAS logo/header
    doc.fontSize(28)
       .fillColor(primaryColor)
       .text('HOAS', { align: 'center' });
    doc.fontSize(16)
       .fillColor(secondaryColor)
       .text('Hostel Accommodation System', { align: 'center' });
    doc.moveDown(0.5);
    
    // Add report title
    doc.fontSize(20)
       .fillColor(textColor)
       .text(reportTitle, { align: 'center' });
    doc.moveDown(0.5);
    
    // Add generation info
    doc.fontSize(10)
       .fillColor(grayColor)
       .text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' })
       .text(`Report ID: ${randomCode}`, { align: 'center' });
    doc.moveDown(2);

    if (userData.role === 'admin') {
      // Admin Report
      doc.fontSize(16).fillColor(primaryColor).text('System Statistics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor(textColor)
        .text(`Total Colleges: ${reportData.totalColleges}`)
        .text(`Total Students: ${reportData.totalStudents}`)
        .text(`Total Wardens: ${reportData.totalWardens}`);
      doc.moveDown(2);
      
      // Colleges List
      if (reportData.colleges && reportData.colleges.length > 0) {
        doc.fontSize(16).fillColor(primaryColor).text('Registered Colleges', { underline: true });
        doc.moveDown(0.5);
        
        // Validate data before rendering
        console.log(`Rendering ${reportData.colleges.length} colleges to PDF`);
        
        reportData.colleges.forEach((college, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${college.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   College ID: ${college.collegeId || 'N/A'}`, { indent: 20 })
            .text(`   Email: ${college.email || 'N/A'}`, { indent: 20 })
            .text(`   Status: ${college.status || 'Active'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      } else {
        console.log('No colleges data to render in PDF');
        doc.fontSize(11).fillColor(grayColor).text('No colleges found.');
        doc.moveDown(1);
      }
      
      // Students List
      if (reportData.students && reportData.students.length > 0) {
        if (doc.y > 650) { doc.addPage(); }
        doc.fontSize(16).fillColor(primaryColor).text('All Students', { underline: true });
        doc.moveDown(0.5);
        
        // Validate data before rendering
        console.log(`Rendering ${reportData.students.length} students to PDF`);
        
        reportData.students.forEach((student, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${student.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${student.email || 'N/A'}`, { indent: 20 })
            .text(`   Status: ${student.status || 'N/A'}`, { indent: 20 })
            .text(`   College ID: ${student.collegeId || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      } else {
        console.log('No students data to render in PDF');
        doc.fontSize(11).fillColor(grayColor).text('No students found.');
        doc.moveDown(1);
      }
      
      // Wardens List
      if (reportData.wardens && reportData.wardens.length > 0) {
        if (doc.y > 650) { doc.addPage(); }
        doc.fontSize(16).fillColor(primaryColor).text('All Wardens', { underline: true });
        doc.moveDown(0.5);
        
        // Validate data before rendering
        console.log(`Rendering ${reportData.wardens.length} wardens to PDF`);
        
        reportData.wardens.forEach((warden, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${warden.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${warden.email || 'N/A'}`, { indent: 20 })
            .text(`   Status: ${warden.status || 'N/A'}`, { indent: 20 })
            .text(`   College ID: ${warden.collegeId || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
      } else {
        console.log('No wardens data to render in PDF');
        doc.fontSize(11).fillColor(grayColor).text('No wardens found.');
      }
    } else {
      // Management Report
      doc.fontSize(16).fillColor(primaryColor).text('College Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor(textColor)
        .text(`College ID: ${reportData.collegeId}`)
        .text(`College Name: ${reportData.collegeName}`)
        .text(`Email: ${reportData.email}`)
        .text(`Location: ${reportData.location || 'N/A'}`);
      doc.moveDown(1);
      
      doc.fontSize(16).fillColor(primaryColor).text('Statistics', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor(textColor)
        .text(`Total Students: ${reportData.students}`)
        .text(`Total Wardens: ${reportData.wardens}`);
      doc.moveDown(2);
      
      // Students List
      if (reportData.studentsList && reportData.studentsList.length > 0) {
        if (doc.y > 650) { doc.addPage(); }
        doc.fontSize(16).fillColor(primaryColor).text('Students List', { underline: true });
        doc.moveDown(0.5);
        
        // Validate data before rendering
        console.log(`Rendering ${reportData.studentsList.length} students to PDF`);
        
        reportData.studentsList.forEach((student, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${student.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${student.email || 'N/A'}`, { indent: 20 })
            .text(`   Phone: ${student.phoneNumber || 'N/A'}`, { indent: 20 })
            .text(`   Room: ${student.roomNumber || 'N/A'}`, { indent: 20 })
            .text(`   Status: ${student.status || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      } else {
        console.log('No students data to render in PDF');
        doc.fontSize(11).fillColor(grayColor).text('No students found.');
        doc.moveDown(1);
      }
      
      // Wardens List
      if (reportData.wardensList && reportData.wardensList.length > 0) {
        if (doc.y > 650) { doc.addPage(); }
        doc.fontSize(16).fillColor(primaryColor).text('Wardens List', { underline: true });
        doc.moveDown(0.5);
        
        // Validate data before rendering
        console.log(`Rendering ${reportData.wardensList.length} wardens to PDF`);
        
        reportData.wardensList.forEach((warden, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${warden.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${warden.email || 'N/A'}`, { indent: 20 })
            .text(`   Phone: ${warden.phoneNumber || 'N/A'}`, { indent: 20 })
            .text(`   Status: ${warden.status || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
      } else {
        console.log('No wardens data to render in PDF');
        doc.fontSize(11).fillColor(grayColor).text('No wardens found.');
      }
    }
    
    // Add footer to last page
    doc.moveDown(2);
    doc.fontSize(8)
       .fillColor(grayColor)
       .text('This is a system-generated report from HOAS', { align: 'center' })
       .text(`© ${new Date().getFullYear()} HOAS - All Rights Reserved`, { align: 'center' });

    // Finalize PDF
    doc.end();

    } catch (error) {
      console.error('Error generating PDF report:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      }
    }
  });
});
