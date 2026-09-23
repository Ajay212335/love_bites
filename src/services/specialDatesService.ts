import AsyncStorage from '@react-native-async-storage/async-storage';
import { SpecialDate } from '@/types';
import { api, generateDynamicId } from '@/services/api';

const SPECIAL_DATES_STORAGE_KEY = '@love_bites_db_special_dates';

export const specialDatesService = {
  async getSpecialDates(userId?: string, partnerId?: string): Promise<SpecialDate[]> {
    try {
      // 1. Fetch from cloud database first if available
      if (userId) {
        const remoteRes = await api.getSpecialDates(userId);
        const datesList = remoteRes?.dates || remoteRes?.specialDates;
        if (remoteRes && remoteRes.success && Array.isArray(datesList)) {
          const remoteDates: SpecialDate[] = datesList.map((d: any) => ({
            id: d._id || d.id,
            userId: d.userId,
            partnerId: d.partnerId,
            title: d.title,
            date: d.date,
            notes: d.notes,
            createdByName: d.createdByName || 'You',
            createdAt: d.createdAt,
          }));
          await AsyncStorage.setItem(
            `${SPECIAL_DATES_STORAGE_KEY}_${userId}`,
            JSON.stringify(remoteDates)
          );
          return remoteDates;
        }
      }

      // 2. Read from persistent local database partition for this couple/user
      const storageKey = userId
        ? `${SPECIAL_DATES_STORAGE_KEY}_${userId}`
        : SPECIAL_DATES_STORAGE_KEY;

      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed: SpecialDate[] = JSON.parse(stored);
        if (userId) {
          const coupleIds = [userId];
          if (partnerId) coupleIds.push(partnerId);
          return parsed.filter(
            (d) =>
              !d.userId ||
              coupleIds.includes(d.userId) ||
              (d.partnerId && coupleIds.includes(d.partnerId))
          );
        }
        return parsed;
      }
      return [];
    } catch (e) {
      console.error('Failed to get special dates:', e);
      return [];
    }
  },

  async addSpecialDate(data: {
    title: string;
    date: string;
    notes?: string;
    userId?: string;
    partnerId?: string;
    createdByName?: string;
  }): Promise<SpecialDate> {
    const current = await this.getSpecialDates(data.userId, data.partnerId);
    const newEntry: SpecialDate = {
      id: generateDynamicId(),
      userId: data.userId,
      partnerId: data.partnerId,
      title: data.title,
      date: data.date,
      notes: data.notes,
      createdByName: data.createdByName || 'You',
      createdAt: new Date().toISOString(),
    };

    // 1. Persist to cloud database
    api.createSpecialDate(newEntry).catch(() => {});

    // 2. Persist to local database
    const updated = [newEntry, ...current];
    const storageKey = data.userId
      ? `${SPECIAL_DATES_STORAGE_KEY}_${data.userId}`
      : SPECIAL_DATES_STORAGE_KEY;

    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
    return newEntry;
  },

  async deleteSpecialDate(id: string, userId?: string, partnerId?: string): Promise<void> {
    // 1. Delete from cloud database
    api.deleteSpecialDate(id).catch(() => {});

    // 2. Delete from local database
    const current = await this.getSpecialDates(userId, partnerId);
    const updated = current.filter((d) => d.id !== id);
    const storageKey = userId
      ? `${SPECIAL_DATES_STORAGE_KEY}_${userId}`
      : SPECIAL_DATES_STORAGE_KEY;

    await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
  },
};
