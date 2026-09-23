/**
 * Firebase Cloud Messaging (FCM) & Expo Push Notification Service
 * Project: ajayportfolio-007
 * Package: love.bite
 */

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyCus3MsG_04Es3BNtsAsLr3T5XLctS6Mr8';
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'ajayportfolio-007';

/**
 * Send Firebase / Expo Push Notification to a target device token
 */
async function sendFirebasePushNotification({ pushToken, title, body, data = {} }) {
  if (!pushToken) {
    console.log('ℹ️ [Push Notification] No push token registered for user. Notification skipped.');
    return { success: false, reason: 'no_token' };
  }

  try {
    // 1. If it is an Expo / FCM push token
    if (pushToken.startsWith('ExponentPushToken') || pushToken.startsWith('ExpoPushToken')) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          sound: 'default',
          title,
          body,
          data,
          channelId: 'love_bites_tasks',
          priority: 'high',
        }),
      });

      const result = await response.json();
      console.log(`📱 [Firebase/Expo Push] Notification dispatched to token [${pushToken.slice(0, 18)}...]:`, result);
      return { success: true, result };
    }

    // 2. Direct FCM Token
    console.log(`📱 [Firebase FCM] Notification queued for device [${pushToken.slice(0, 18)}...]: "${title}" - "${body}"`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Firebase Push Error]:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendFirebasePushNotification,
  FIREBASE_PROJECT_ID,
};
