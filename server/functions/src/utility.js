import { onCall } from 'firebase-functions/v2/https';
import { corsOptions } from './config.js';

/**
 * Health check endpoint
 */
export const healthCheck = onCall(corsOptions, async () => {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    service: 'HOAS Cloud Functions',
    version: '1.0.0'
  };
});
