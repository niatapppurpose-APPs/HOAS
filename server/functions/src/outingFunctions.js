/**
 * Outing Functions - Export Orchestrator
 * Re-exports all outing-related functions from split modules
 *
 * This file maintains backward compatibility while delegating to specialized modules:
 * - outingHelpers.js: Utilities and validation
 * - outingHttpEndpoints.js: HTTP API endpoints
 * - outingServices.js: Query and service functions
 * - outingScheduler.js: Scheduled jobs and triggers
 */

// HTTP Endpoints
export { requestOuting, approveOuting, rejectOuting, markStudentReturn } from './outingHttpEndpoints.js';

// Query Services
export { getStudentOutings, getWardenOutings, getOutingHistory } from './outingServices.js';

// Helpers (for internal use only - NOT exported as Cloud Functions)
// These are utility functions used internally by outing functions
// Do NOT export these - they conflict with actual Cloud Functions

// Scheduled Functions
export { autoMarkLateOutings, outingStatusChange } from './outingScheduler.js';
