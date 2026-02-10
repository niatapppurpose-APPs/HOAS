/**
 * HOAS Cloud Functions
 * Backend API for Hostel Operations Accountability System
 */

import './src/config.js'; // Initialize Firebase and set global options

// Export all functions
export * from './src/userManagement.js';
export * from './src/collegeManagement.js';
export * from './src/admin.js';
export * from './src/triggers.js';
export * from './src/utility.js';
export * from './src/reports.js';
export * from './src/systemSettings.js';
export * from './src/notifications.js';
export * from './src/bulkUpload.js';

