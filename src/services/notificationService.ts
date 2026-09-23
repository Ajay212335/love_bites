import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyTask, NotificationLog } from '@/types';

const NOTIFICATIONS_LOG_KEY = '@love_bites_notification_logs';
const TASK_CHANNEL_ID = 'love_bites_tasks';

import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isAndroidExpoGo = Platform.OS === 'android' && isExpoGo;

// Safely require expo-notifications only in Dev builds, APKs, or non-Android Expo Go
let Notifications: typeof import('expo-notifications') | null = null;
if (!isAndroidExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require('expo-notifications');
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (e: any) {
    console.log('ℹ️ Notification handler initialization info:', e?.message || e);
  }
} else {
  console.log('📱 [Expo Go Android] In-App Notification Center and active task alerts running');
}

// Initialize Android notification channel for high-priority task alarms & nudges
export const setupNotificationChannel = async () => {
  if (Platform.OS === 'android' && Notifications?.setNotificationChannelAsync) {
    try {
      await Notifications.setNotificationChannelAsync(TASK_CHANNEL_ID, {
        name: 'Love Bites Couple Tasks & Alarms',
        importance: Notifications.AndroidImportance?.MAX || 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF4B6E',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
      console.log('✅ Android Notification Channel [love_bites_tasks] active');
    } catch (err) {
      console.warn('Could not register Android notification channel:', err);
    }
  }
};

// Run channel setup on startup
setupNotificationChannel();

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Notifications?.getPermissionsAsync || !Notifications?.requestPermissionsAsync) {
    return true;
  }
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Error requesting notification permissions:', e);
    return false;
  }
};

export const registerForPushNotificationsAsync = async (userId?: string): Promise<string | undefined> => {
  try {
    if (!Notifications?.getExpoPushTokenAsync && !Notifications?.getDevicePushTokenAsync) {
      return undefined;
    }
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return undefined;

    await setupNotificationChannel();

    let token: string | undefined;
    try {
      if (Notifications.getExpoPushTokenAsync) {
        const expoTokenObj = await Notifications.getExpoPushTokenAsync({
          projectId: 'ajayportfolio-007',
        });
        token = expoTokenObj?.data;
      }
    } catch {
      try {
        if (Notifications.getDevicePushTokenAsync) {
          const deviceTokenObj = await Notifications.getDevicePushTokenAsync();
          token = deviceTokenObj?.data;
        }
      } catch {}
    }

    if (token) {
      console.log('📱 [Device Push Token]:', token);
    }
    return token;
  } catch (err) {
    console.log('ℹ️ Push token registration info:', err);
    return undefined;
  }
};

/**
 * Schedule a daily recurring push notification at the exact task time
 */
export const scheduleTaskNotification = async (
  task: DailyTask
): Promise<string | undefined> => {
  try {
    if (!Notifications?.scheduleNotificationAsync) {
      return `mock_notif_${task.id}`;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return undefined;
    }

    await setupNotificationChannel();

    // Trigger daily at specified hour and minute
    const trigger: any = {
      type: Notifications.SchedulableTriggerInputTypes?.DAILY || 'daily',
      hour: task.hour,
      minute: task.minute,
      channelId: TASK_CHANNEL_ID,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💖 Love Bites: ${task.title} (${task.time})`,
        body: task.description || `It's ${task.time}! Time for your daily couple task ✨`,
        data: { taskId: task.id, type: 'task_alarm', time: task.time },
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.MAX,
        ...(Platform.OS === 'android' ? { channelId: TASK_CHANNEL_ID } : {}),
      },
      trigger,
    });

    console.log(
      `⏰ [Push Notification] Scheduled daily task alarm for "${task.title}" at ${task.time} (Hour: ${task.hour}, Min: ${task.minute}, ID: ${notificationId})`
    );

    return notificationId;
  } catch (error) {
    console.warn('Could not schedule task notification:', error);
    return undefined;
  }
};

/**
 * Cancel a scheduled task notification
 */
export const cancelTaskNotification = async (notificationId?: string) => {
  if (!notificationId || !Notifications?.cancelScheduledNotificationAsync) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`🗑️ [Push Notification] Cancelled notification ID: ${notificationId}`);
  } catch (error) {
    console.warn('Error canceling scheduled notification:', error);
  }
};

/**
 * Trigger an immediate test push notification on the device
 */
export const triggerTestPushNotification = async (
  title = '💖 Love Bites Push Alert Test',
  body = 'Time for your couple moment! Your task alarms are working perfectly ✨'
) => {
  try {
    if (!Notifications?.scheduleNotificationAsync) return;
    await requestNotificationPermissions();
    await setupNotificationChannel();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.MAX,
        ...(Platform.OS === 'android' ? { channelId: TASK_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL || 'timeInterval',
        seconds: 2, // Fire in 2 seconds
      } as any,
    });
    console.log('🚀 [Push Notification] Test notification scheduled in 2s');
  } catch (e) {
    console.warn('Could not trigger test notification:', e);
  }
};

/**
 * Send an instant partner nudge notification
 */
export const sendInstantPartnerNudge = async (
  partnerName: string,
  senderName: string,
  task: DailyTask
): Promise<NotificationLog> => {
  const title = `💖 ${senderName} nudged you!`;
  const body = `Time for: "${task.title}" at ${task.time}! Don't forget your couple spark ✨`;

  try {
    if (Notifications?.scheduleNotificationAsync) {
      await setupNotificationChannel();
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { taskId: task.id, type: 'partner_nudge' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.MAX,
          ...(Platform.OS === 'android' ? { channelId: TASK_CHANNEL_ID } : {}),
        },
        trigger: null, // Immediate trigger
      });
    }
  } catch (e) {
    console.warn('Could not trigger instant notification:', e);
  }

  // Record in notification logs
  const newLog: NotificationLog = {
    id: `notif_${Date.now()}`,
    title,
    body,
    timestamp: new Date().toISOString(),
    taskId: task.id,
    read: false,
    type: 'partner_nudge',
  };

  await logNotification(newLog);
  return newLog;
};

export const getNotificationLogs = async (): Promise<NotificationLog[]> => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const logNotification = async (log: NotificationLog) => {
  try {
    const existing = await getNotificationLogs();
    const updated = [log, ...existing].slice(0, 50); // Keep latest 50
    await AsyncStorage.setItem(NOTIFICATIONS_LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error storing notification log:', e);
  }
};

export const clearNotificationLogs = async () => {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_LOG_KEY);
  } catch {}
};
