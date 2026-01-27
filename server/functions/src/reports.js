import { onRequest } from 'firebase-functions/v2/https';
import PDFDocument from 'pdfkit';
import { db, corsHandler } from './config.js';
import { verifyAuthToken } from './helpers.js';

/**
 * Generate a random alphanumeric code
 * @param {number} length - Length of the code to generate
 * @returns {string} Random alphanumeric code
 */
function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Add watermark to PDF document
 * @param {PDFDocument} doc - PDFKit document instance
 * @param {string} watermarkText - Text to use as watermark
 */
function addWatermark(doc, watermarkText = 'HOAS') {
  // Save current graphics state
  doc.save();
  
  // Get page dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  
  // Set watermark properties for maximum difficulty to remove
  doc.fontSize(80)
     .fillColor('#000000', 0.08) // Very light gray with low opacity
     .opacity(0.08); // Additional opacity setting
  
  // Calculate center position
  const textWidth = doc.widthOfString(watermarkText);
  const textHeight = doc.currentLineHeight();
  const x = (pageWidth - textWidth) / 2;
  const y = (pageHeight - textHeight) / 2;
  
  // Add watermark at center with rotation
  doc.rotate(-45, { origin: [pageWidth / 2, pageHeight / 2] });
  doc.text(watermarkText, x, y, {
    lineBreak: false,
    align: 'center'
  });
  
  // Restore graphics state
  doc.restore();
  
  // Add multiple subtle watermarks across the page for extra security
  doc.save();
  doc.fontSize(40)
     .fillColor('#000000', 0.05)
     .opacity(0.05);
  
  // Top left
  doc.rotate(-45, { origin: [pageWidth / 4, pageHeight / 4] });
  doc.text(watermarkText, pageWidth / 4 - 60, pageHeight / 4 - 20, { lineBreak: false });
  doc.restore();
  
  doc.save();
  doc.fontSize(40)
     .fillColor('#000000', 0.05)
     .opacity(0.05);
  
  // Bottom right
  doc.rotate(-45, { origin: [3 * pageWidth / 4, 3 * pageHeight / 4] });
  doc.text(watermarkText, 3 * pageWidth / 4 - 60, 3 * pageHeight / 4 - 20, { lineBreak: false });
  doc.restore();
}

/**
 * Generate and download college report in JSON format
 */
export const downloadReportJson = onRequest({ cors: true }, async (req, res) => {
  // Handle CORS
  return corsHandler(req, res, async () => {
    try {
      console.log('=== downloadReportJson called ===');
      console.log('Headers:', req.headers);
      
      // Get the authenticated user's data
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        console.log('No Bearer token found');
        res.status(401).json({ error: 'Unauthorized - No token provided' });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      console.log('Token received (first 20 chars):', token.substring(0, 20));
      
      let decodedToken;
      try {
        decodedToken = await verifyAuthToken(token);
        console.log('✅ Token verified for user:', decodedToken.uid || decodedToken.user_id);
      } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        res.status(401).json({ error: 'Unauthorized - Invalid token', details: error.message });
        return;
      }

      // Get user data from Firestore
      const userId = decodedToken.uid || decodedToken.user_id;
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      const userData = userDoc.data();

    // Build report data based on user role
    let reportData;
    
    if (userData.role === 'admin') {
      // For admin, get all colleges stats
      const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
      const wardensSnapshot = await db.collection('users').where('role', '==', 'warden').get();
      const collegesSnapshot = await db.collection('users').where('role', '==', 'management').get();
      
      reportData = {
        reportType: 'Admin Overview',
        generatedAt: new Date().toISOString(),
        generatedBy: userData.name || userData.email,
        totalColleges: collegesSnapshot.size,
        totalStudents: studentsSnapshot.size,
        totalWardens: wardensSnapshot.size,
        colleges: collegesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().collegeName || doc.data().email,
          collegeId: doc.data().uid || doc.id,
          email: doc.data().email,
          status: doc.data().status
        })),
        students: studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          collegeId: doc.data().managementId
        })),
        wardens: wardensSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          collegeId: doc.data().managementId
        }))
      };
    } else if (userData.role === 'management') {
      // For management, get their college stats - filter by managementId
      const studentsSnapshot = await db.collection('users')
        .where('role', '==', 'student')
        .where('managementId', '==', userId)
        .get();
      const wardensSnapshot = await db.collection('users')
        .where('role', '==', 'warden')
        .where('managementId', '==', userId)
        .get();
      
      reportData = {
        reportType: 'College Report',
        generatedAt: new Date().toISOString(),
        generatedBy: userData.name || userData.email,
        collegeId: userId,
        collegeName: userData.collegeName || userData.name || userData.email,
        email: userData.email,
        location: userData.location,
        students: studentsSnapshot.size,
        wardens: wardensSnapshot.size,
        studentsList: studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          phoneNumber: doc.data().phoneNumber,
          roomNumber: doc.data().roomNumber
        })),
        wardensList: wardensSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          phoneNumber: doc.data().phoneNumber
        }))
      };
    } else {
      res.status(403).json({ error: 'Only admin and management can generate reports' });
      return;
    }

    // Generate random code for filename
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
export const downloadReportPdf = onRequest({ cors: true }, async (req, res) => {
  // Handle CORS
  return corsHandler(req, res, async () => {
    try {
      console.log('=== downloadReportPdf called ===');
      console.log('Headers:', req.headers);
      
      // Get the authenticated user's data
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        console.log('No Bearer token found');
        res.status(401).send('Unauthorized - No token provided');
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      console.log('Token received (first 20 chars):', token.substring(0, 20));
      
      let decodedToken;
      try {
        decodedToken = await verifyAuthToken(token);
        console.log('✅ Token verified for user:', decodedToken.uid || decodedToken.user_id);
      } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        res.status(401).send(`Unauthorized - Invalid token: ${error.message}`);
        return;
      }

      // Get user data from Firestore
      const userId = decodedToken.uid || decodedToken.user_id;
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        res.status(404).send('User profile not found');
        return;
      }

      const userData = userDoc.data();

    // Only admin and management can generate reports
    if (userData.role !== 'admin' && userData.role !== 'management') {
      res.status(403).send('Only admin and management can generate reports');
      return;
    }

    // Prepare report data
    let reportTitle, reportData;
    
    if (userData.role === 'admin') {
      const studentsSnapshot = await db.collection('users').where('role', '==', 'student').get();
      const wardensSnapshot = await db.collection('users').where('role', '==', 'warden').get();
      const collegesSnapshot = await db.collection('users').where('role', '==', 'management').get();
      
      reportTitle = 'Admin Overview Report';
      reportData = {
        totalColleges: collegesSnapshot.size,
        totalStudents: studentsSnapshot.size,
        totalWardens: wardensSnapshot.size,
        colleges: collegesSnapshot.docs.map(doc => ({
          name: doc.data().name || doc.data().collegeName || doc.data().email,
          collegeId: doc.data().uid || doc.id,
          email: doc.data().email,
          status: doc.data().status
        })),
        students: studentsSnapshot.docs.map(doc => ({
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          collegeId: doc.data().managementId
        })),
        wardens: wardensSnapshot.docs.map(doc => ({
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          collegeId: doc.data().managementId
        }))
      };
    } else {
      // For management, filter by managementId
      const studentsSnapshot = await db.collection('users')
        .where('role', '==', 'student')
        .where('managementId', '==', userId)
        .get();
      const wardensSnapshot = await db.collection('users')
        .where('role', '==', 'warden')
        .where('managementId', '==', userId)
        .get();
      
      reportTitle = 'College Report';
      reportData = {
        collegeId: userId,
        collegeName: userData.collegeName || userData.name || userData.email,
        email: userData.email,
        location: userData.location,
        students: studentsSnapshot.size,
        wardens: wardensSnapshot.size,
        studentsList: studentsSnapshot.docs.map(doc => ({
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          phoneNumber: doc.data().phoneNumber,
          roomNumber: doc.data().roomNumber
        })),
        wardensList: wardensSnapshot.docs.map(doc => ({
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status,
          phoneNumber: doc.data().phoneNumber
        }))
      };
    }

    // Create PDF with proper settings
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true
    });
    
    // Generate random code for filename
    const randomCode = generateRandomCode();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `HOAS-Report-${randomCode}-${timestamp}.pdf`;
    
    console.log('Generated PDF report with filename:', filename);
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add watermark to the first page
    addWatermark(doc, 'HOAS');

    // Add watermark to any new pages that are created
    doc.on('pageAdded', () => {
      addWatermark(doc, 'HOAS');
    });
    
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
        reportData.colleges.forEach((college, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${college.name}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   College ID: ${college.collegeId}`, { indent: 20 })
            .text(`   Email: ${college.email}`, { indent: 20 })
            .text(`   Status: ${college.status || 'Active'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }
      
      // Students List
      if (reportData.students && reportData.students.length > 0) {
        if (doc.y > 650) { doc.addPage(); }
        doc.fontSize(16).fillColor(primaryColor).text('All Students', { underline: true });
        doc.moveDown(0.5);
        reportData.students.forEach((student, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${student.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${student.email}`, { indent: 20 })
            .text(`   Status: ${student.status || 'N/A'}`, { indent: 20 })
            .text(`   College ID: ${student.collegeId || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }
      
      // Wardens List
      if (reportData.wardens && reportData.wardens.length > 0) {
        if (doc.y > 650) { doc.addPage(); }
        doc.fontSize(16).fillColor(primaryColor).text('All Wardens', { underline: true });
        doc.moveDown(0.5);
        reportData.wardens.forEach((warden, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${warden.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${warden.email}`, { indent: 20 })
            .text(`   Status: ${warden.status || 'N/A'}`, { indent: 20 })
            .text(`   College ID: ${warden.collegeId || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
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
        reportData.studentsList.forEach((student, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${student.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${student.email}`, { indent: 20 })
            .text(`   Phone: ${student.phoneNumber || 'N/A'}`, { indent: 20 })
            .text(`   Room: ${student.roomNumber || 'N/A'}`, { indent: 20 })
            .text(`   Status: ${student.status || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
        doc.moveDown(1);
      }
      
      // Wardens List
      if (reportData.wardensList && reportData.wardensList.length > 0) {
        if (doc.y > 650) { doc.addPage(); }
        doc.fontSize(16).fillColor(primaryColor).text('Wardens List', { underline: true });
        doc.moveDown(0.5);
        reportData.wardensList.forEach((warden, index) => {
          if (doc.y > 700) { doc.addPage(); }
          doc.fontSize(11).fillColor(textColor)
            .text(`${index + 1}. ${warden.name || 'N/A'}`, { continued: false })
            .fontSize(9).fillColor(grayColor)
            .text(`   Email: ${warden.email}`, { indent: 20 })
            .text(`   Phone: ${warden.phoneNumber || 'N/A'}`, { indent: 20 })
            .text(`   Status: ${warden.status || 'N/A'}`, { indent: 20 });
          doc.moveDown(0.5);
        });
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
