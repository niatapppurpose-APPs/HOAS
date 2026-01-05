import { onRequest } from 'firebase-functions/v2/https';
import PDFDocument from 'pdfkit';
import { db, corsHandler } from './config.js';
import { verifyAuthToken } from './helpers.js';

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
          name: doc.data().name || doc.data().email,
          collegeId: doc.data().uid
        }))
      };
    } else if (userData.role === 'management') {
      // For management, get their college stats
      const studentsSnapshot = await db.collection('users')
        .where('role', '==', 'student')
        .where('uid', '==', userData.uid)
        .get();
      const wardensSnapshot = await db.collection('users')
        .where('role', '==', 'warden')
        .where('uid', '==', userData.uid)
        .get();
      
      reportData = {
        reportType: 'College Report',
        generatedAt: new Date().toISOString(),
        collegeId: userData.uid,
        collegeName: userData.name || userData.email,
        email: userData.email,
        students: studentsSnapshot.size,
        wardens: wardensSnapshot.size,
        studentsList: studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status
        })),
        wardensList: wardensSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          status: doc.data().status
        }))
      };
    } else {
      res.status(403).json({ error: 'Only admin and management can generate reports' });
      return;
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="college-report-${Date.now()}.json"`);
    
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
          name: doc.data().name || doc.data().email,
          collegeId: doc.data().uid
        }))
      };
    } else {
      const studentsSnapshot = await db.collection('users')
        .where('role', '==', 'student')
        .where('uid', '==', userData.uid)
        .get();
      const wardensSnapshot = await db.collection('users')
        .where('role', '==', 'warden')
        .where('uid', '==', userData.uid)
        .get();
      
      reportTitle = 'College Report';
      reportData = {
        collegeId: userData.uid,
        collegeName: userData.name || userData.email,
        email: userData.email,
        students: studentsSnapshot.size,
        wardens: wardensSnapshot.size
      };
    }

    // Create PDF
    const doc = new PDFDocument();
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="college-report-${Date.now()}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text(reportTitle, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    if (userData.role === 'admin') {
      doc.fontSize(14).text('System Statistics', { underline: true });
      doc.moveDown();
      doc.fontSize(12)
        .text(`Total Colleges: ${reportData.totalColleges}`)
        .text(`Total Students: ${reportData.totalStudents}`)
        .text(`Total Wardens: ${reportData.totalWardens}`);
      
      if (reportData.colleges.length > 0) {
        doc.moveDown(2);
        doc.fontSize(14).text('Registered Colleges', { underline: true });
        doc.moveDown();
        reportData.colleges.forEach((college, index) => {
          doc.fontSize(12).text(`${index + 1}. ${college.name} (ID: ${college.collegeId})`);
        });
      }
    } else {
      doc.fontSize(14).text('College Information', { underline: true });
      doc.moveDown();
      doc.fontSize(12)
        .text(`College ID: ${reportData.collegeId}`)
        .text(`College Name: ${reportData.collegeName}`)
        .text(`Email: ${reportData.email}`)
        .text(`Total Students: ${reportData.students}`)
        .text(`Total Wardens: ${reportData.wardens}`);
    }

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
