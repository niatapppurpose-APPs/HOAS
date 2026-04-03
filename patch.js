const fs = require('fs');
let c = fs.readFileSync('server/functions/src/notifications.js', 'utf8');

const regex = /  \/\/ Send push notifications[\s\S]*?logger\.error\('Error sending notification:', error\);\r?\n      throw error;\r?\n    \}\r?\n  \}/mg;

const repl = \  // Send push notifications
      if (tokens.length > 0) {
        const message = {
          notification: {
            title,
            body
          },
          data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          tokens
        };
    
        const response = await getMessaging().sendEachForMulticast(message);
        
        logger.info(\\\Successfully sent \\\ notifications\\\);
        if (response.failureCount > 0) {
          logger.warn(\\\Failed to send \\\ notifications\\\);
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              logger.error(\\\Error sending to token \\\: \\\\\\);
            }
          });
        }
        return response;
      }
      return { successCount: 0, failureCount: 0 };
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }\;

c = c.replace(regex, repl);
fs.writeFileSync('server/functions/src/notifications.js', c);
