import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { DailyTask, TaskCategory, TaskAssignee, NotificationLog } from '@/types';
import { useAuth } from './AuthContext';
import { api } from '@/services/api';
import {
  scheduleTaskNotification,
  cancelTaskNotification,
  sendInstantPartnerNudge,
  triggerTestPushNotification,
  getNotificationLogs,
  logNotification,
} from '@/services/notificationService';

interface TaskContextType {
  tasks: DailyTask[];
  todayTasks: DailyTask[];
  partnerTasks: DailyTask[];
  completedCount: number;
  notificationLogs: NotificationLog[];
  addTask: (params: {
    title: string;
    description?: string;
    photoUrl?: string;
    time: string;
    hour: number;
    minute: number;
    category: TaskCategory;
    assignedTo: TaskAssignee;
  }) => Promise<DailyTask>;
  attachPhotoToTask: (taskId: string, photoUrl: string) => Promise<void>;
  completeTaskWithPhoto: (taskId: string, photoUrl: string) => Promise<void>;
  toggleTaskComplete: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  nudgePartner: (taskId: string) => Promise<{ success: boolean; message: string }>;
  refreshNotifications: () => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TASKS_STORAGE_KEY = '@love_bites_daily_tasks';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, partner } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const triggeredAlarmsRef = useRef<{ [key: string]: boolean }>({});

  const loadTasks = async () => {
    try {
      const [stored, logs] = await Promise.all([
        AsyncStorage.getItem(TASKS_STORAGE_KEY),
        getNotificationLogs(),
      ]);

      const todayDateStr = new Date().toISOString().split('T')[0];
      let currentTasks: DailyTask[] = [];

      if (stored) {
        const parsed: DailyTask[] = JSON.parse(stored);
        currentTasks = parsed
          .filter((t) => !['task_1', 'task_2', 'task_3', 'task_4'].includes(t.id))
          .map((t) => {
            const created =
              t.createdAt ||
              (t.id.startsWith('task_') && !isNaN(Number(t.id.replace('task_', '')))
                ? new Date(Number(t.id.replace('task_', ''))).toISOString()
                : new Date().toISOString());
            
            const lastCompletedDate = t.completedAt
              ? new Date(t.completedAt).toISOString().split('T')[0]
              : t.date || null;
            const isCompletedToday = t.isCompleted && lastCompletedDate === todayDateStr;

            return {
              ...t,
              createdAt: created,
              isCompleted: isCompletedToday,
              photoUrl: isCompletedToday ? t.photoUrl : undefined,
              lastPhotoUrl: t.photoUrl || t.lastPhotoUrl,
              date: todayDateStr,
            };
          });
        setTasks(currentTasks);
      }

      setNotificationLogs(logs);

      // If user is authenticated, sync with remote MongoDB Database
      if (user?.id) {
        const dbRes = await api.getTasks(user.id);
        if (dbRes && dbRes.success && Array.isArray(dbRes.tasks)) {
          const remoteTasks: DailyTask[] = dbRes.tasks.map((t: any) => {
            const lastCompletedDate = t.completedAt
              ? new Date(t.completedAt).toISOString().split('T')[0]
              : t.date || null;
            const isCompletedToday = t.isCompleted && lastCompletedDate === todayDateStr;

            return {
              id: t.id || t._id,
              title: t.title,
              description: t.description,
              time: t.time,
              hour: t.hour,
              minute: t.minute,
              category: t.category,
              assignedTo: t.assignedTo,
              creatorId: t.creatorId,
              creatorName: t.creatorName,
              isCompleted: isCompletedToday,
              completedAt: t.completedAt,
              completedByName: t.completedByName || t.attachedByName || (t.isCompleted ? 'Partner' : undefined),
              photoUrl: isCompletedToday ? t.photoUrl : undefined,
              lastPhotoUrl: t.lastPhotoUrl || t.photoUrl,
              attachedByName: t.attachedByName || t.completedByName,
              date: todayDateStr,
              createdAt: t.createdAt,
              streakCount: t.streakCount || 1,
              history: t.history || [],
            };
          });

          setTasks(remoteTasks);
          await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(remoteTasks));
        }
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.id]);

  // Periodic Active Time Ticker for in-app task alarms and system push banners
  useEffect(() => {
    const checkTaskTimes = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const dateKey = now.toDateString();

      for (const task of tasks) {
        if (task.isCompleted) continue;

        let taskHour = task.hour !== undefined ? Number(task.hour) : undefined;
        let taskMinute = task.minute !== undefined ? Number(task.minute) : undefined;

        // If hour/minute was not stored numerically, parse from task.time string
        if (
          taskHour === undefined ||
          isNaN(taskHour) ||
          taskMinute === undefined ||
          isNaN(taskMinute)
        ) {
          if (task.time) {
            const match = task.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
            if (match) {
              let h = parseInt(match[1], 10);
              const m = parseInt(match[2], 10);
              const period = match[3]?.toUpperCase();
              if (period === 'PM' && h < 12) h += 12;
              if (period === 'AM' && h === 12) h = 0;
              taskHour = h;
              taskMinute = m;
            }
          }
        }

        if (taskHour === currentHour && taskMinute === currentMinute) {
          const alarmKey = `${dateKey}_${task.id}_${currentHour}_${currentMinute}`;
          if (!triggeredAlarmsRef.current[alarmKey]) {
            triggeredAlarmsRef.current[alarmKey] = true;

            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {}

            const notifTitle = `💖 Love Bites: ${task.title} (${task.time})`;
            const notifBody =
              task.description || `It's ${task.time}! Time for your daily couple task ✨`;

            // Trigger system status bar notification
            triggerTestPushNotification(notifTitle, notifBody).catch(() => {});

            const newLog: NotificationLog = {
              id: `alarm_${Date.now()}`,
              title: notifTitle,
              body: notifBody,
              timestamp: new Date().toISOString(),
              taskId: task.id,
              read: false,
              type: 'task_alarm',
            };

            await logNotification(newLog);
            setNotificationLogs((prev) => [newLog, ...prev]);

            Alert.alert(
              `⏰ ${task.time} — Task Time!`,
              `💖 "${task.title}"\n${task.description ? `\n${task.description}\n` : ''}\nTime to complete your couple spark together!`,
              [{ text: 'Got It 💖' }]
            );
          }
        }
      }
    };

    const interval = setInterval(checkTaskTimes, 10000); // Check every 10 seconds
    checkTaskTimes();

    return () => clearInterval(interval);
  }, [tasks]);

  const refreshNotifications = async () => {
    const logs = await getNotificationLogs();
    setNotificationLogs(logs);
  };

  const addTask = async ({
    title,
    description,
    photoUrl,
    time,
    hour,
    minute,
    category,
    assignedTo,
  }: {
    title: string;
    description?: string;
    photoUrl?: string;
    time: string;
    hour: number;
    minute: number;
    category: TaskCategory;
    assignedTo: TaskAssignee;
  }): Promise<DailyTask> => {
    const now = new Date();
    const newTask: DailyTask = {
      id: `task_${Date.now()}`,
      title: title.trim(),
      description: description?.trim(),
      photoUrl: photoUrl || undefined,
      attachedByName: photoUrl ? (user?.name || 'You') : undefined,
      time,
      hour,
      minute,
      category,
      assignedTo,
      creatorId: user?.id || 'usr_current',
      creatorName: user?.name || 'You',
      isCompleted: false,
      createdAt: now.toISOString(),
      date: now.toISOString().split('T')[0],
      streakCount: 1,
    };

    // Schedule notification for task timing
    const notificationId = await scheduleTaskNotification(newTask);
    if (notificationId) {
      newTask.notificationId = notificationId;
    }

    // Persist to remote MongoDB Database if online
    if (user?.id) {
      api.createTask({
        title: newTask.title,
        description: newTask.description,
        photoUrl: newTask.photoUrl,
        attachedByName: newTask.attachedByName,
        time: newTask.time,
        hour: newTask.hour,
        minute: newTask.minute,
        category: newTask.category,
        assignedTo: newTask.assignedTo,
        creatorId: user.id,
        date: newTask.date,
      }).then((res) => {
        if (res?.success && res?.task?.id) {
          newTask.id = res.task.id;
        }
      }).catch((e) => console.warn('Cloud DB create task err:', e?.message));
    }

    const updated = [newTask, ...tasks];
    setTasks(updated);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    return newTask;
  };

  const attachPhotoToTask = async (taskId: string, photoUrl: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const now = new Date();

    // Persist to remote MongoDB Database
    api.attachTaskPhoto(taskId, photoUrl, user?.name || 'Partner').catch((e) =>
      console.warn('Cloud DB attach photo err:', e?.message)
    );

    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            photoUrl,
            attachedByName: user?.name || 'You',
            completedAt: t.completedAt || now.toISOString(),
            completedByName: t.completedByName || user?.name || 'You',
          }
        : t
    );

    setTasks(updated);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
  };

  const completeTaskWithPhoto = async (taskId: string, photoUrl: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    const now = new Date();

    // Persist to remote MongoDB Database
    api.completeTaskWithPhoto(taskId, photoUrl, user?.name || 'Partner').catch((e) =>
      console.warn('Cloud DB complete task with photo err:', e?.message)
    );

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          photoUrl,
          attachedByName: user?.name || 'You',
          isCompleted: true,
          completedAt: now.toISOString(),
          completedByName: user?.name || 'You',
          streakCount: (t.streakCount || 0) + 1,
        };
      }
      return t;
    });

    setTasks(updated);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
  };

  const toggleTaskComplete = async (taskId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    // Persist to remote MongoDB Database
    api.toggleTask(taskId, user?.name || 'You').catch((e) =>
      console.warn('Cloud DB toggle task err:', e?.message)
    );

    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.isCompleted;
        return {
          ...t,
          isCompleted: nextState,
          completedAt: nextState ? new Date().toISOString() : undefined,
          completedByName: nextState ? (user?.name || 'You') : undefined,
          streakCount: nextState ? (t.streakCount || 0) + 1 : Math.max(0, (t.streakCount || 1) - 1),
        };
      }
      return t;
    });

    setTasks(updated);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
  };

  const deleteTask = async (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target?.notificationId) {
      await cancelTaskNotification(target.notificationId);
    }

    // Persist delete to remote MongoDB Database
    api.deleteTask(taskId).catch((e) =>
      console.warn('Cloud DB delete task err:', e?.message)
    );

    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));
  };

  const nudgePartner = async (taskId: string): Promise<{ success: boolean; message: string }> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return { success: false, message: 'Task not found' };

    const targetPartnerName = partner?.name || user?.partnerName || 'your partner';
    const senderName = user?.name || 'You';

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}

    const log = await sendInstantPartnerNudge(targetPartnerName, senderName, task);

    // Trigger remote push notification to partner device if partner is linked
    if (user?.id && (partner?.id || user?.partnerId)) {
      const partnerId = partner?.id || user?.partnerId || '';
      api.sendPartnerPushNudge(user.id, partnerId, task.title, task.time).catch((err) => {
        console.warn('Backend push nudge error:', err?.message || err);
      });
    }

    // Update last nudged at
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, lastNudgedAt: new Date().toISOString() } : t
    );
    setTasks(updated);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updated));

    setNotificationLogs((prev) => [log, ...prev]);

    return {
      success: true,
      message: `Nudge sent to ${targetPartnerName} for "${task.title}"!`,
    };
  };

  const todayTasks = tasks;
  const partnerTasks = tasks.filter(
    (t) => t.assignedTo === 'partner' || t.assignedTo === 'both'
  );
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        todayTasks,
        partnerTasks,
        completedCount,
        notificationLogs,
        addTask,
        attachPhotoToTask,
        completeTaskWithPhoto,
        toggleTaskComplete,
        deleteTask,
        nudgePartner,
        refreshNotifications,
        refreshTasks: loadTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
