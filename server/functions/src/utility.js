import { onCall } from 'firebase-functions/v2/https';

/**
 * Health check endpoint
 */
export const healthCheck = onCall({ cors: true }, async () => {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    service: 'HOAS Cloud Functions',
    version: '1.0.0'
  };
});
