/**
 * HOAS Cloud Functions
 * Backend API for Hostel Operations Accountability System
 */

import './src/config.js'; // Initialize Firebase and set global options

// Export all functions
export * from './src/userManagement.js';
export * from './src/studentManagement.js';
export * from './src/collegeManagement.js';
export * from './src/reports.js';
export * from './src/systemSettings.js';
export * from './src/notifications.js';
export * from './src/bulkUpload.js';
export * from './src/complaintFunctions.js';
export * from './src/outingFunctions.js';
export * from './src/emergencyLocation.js';
export * from './src/fees.js';
export * from './src/contextChat.js';
export * from './src/reminders.js';

