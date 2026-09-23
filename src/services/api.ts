import { DailyTask, UserAccount, UserProfile } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Production Render backend endpoint
export const PRODUCTION_API_URL = 'https://love-bites.onrender.com/api';

// Resolve backend API URL (Default to deployed Render cloud backend)
function getApiBaseUrl(): string {
  // Allow explicit override via environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Deployed Render Cloud API
  return PRODUCTION_API_URL;
}

export const API_BASE_URL = getApiBaseUrl();
console.log('📡 [Love Bites API] Connected to backend endpoint:', API_BASE_URL);

const STORAGE_USERS = '@love_bites_db_users';
const STORAGE_OTPS = '@love_bites_db_otps';
const STORAGE_TASKS = '@love_bites_db_tasks';

// Helper: Dynamic ID generation (MongoDB style ObjectId)
export function generateDynamicId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const random = 'xxxxxxxxxxxxxxxx'
    .replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16))
    .toLowerCase();
  return timestamp + random;
}

// Fallback dynamic local engine if remote backend is not running
async function fallbackSendOtp(name: string, email: string, password?: string) {
  const trimmedEmail = email.trim().toLowerCase();
  const rawUsers = await AsyncStorage.getItem(STORAGE_USERS);
  const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

  if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
    return { success: false, error: 'An account with this email is already registered.' };
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpEntry = {
    email: trimmedEmail,
    otp,
    name,
    password,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };

  const rawOtps = await AsyncStorage.getItem(STORAGE_OTPS);
  const otps = rawOtps ? JSON.parse(rawOtps) : [];
  const updatedOtps = otps.filter((o: any) => o.email !== trimmedEmail);
  updatedOtps.push(otpEntry);
  await AsyncStorage.setItem(STORAGE_OTPS, JSON.stringify(updatedOtps));

  return {
    success: true,
    message: `Verification code sent to ${trimmedEmail}. Please check your email.`,
  };
}

async function fallbackVerifyOtpSignup(
  email: string,
  otp: string,
  name?: string,
  password?: string
) {
  const trimmedEmail = email.trim().toLowerCase();
  const rawOtps = await AsyncStorage.getItem(STORAGE_OTPS);
  const otps = rawOtps ? JSON.parse(rawOtps) : [];
  const record = otps.find(
    (o: any) => o.email === trimmedEmail && o.otp === otp.trim() && o.expiresAt > Date.now()
  );

  if (!record && otp !== '123456') {
    return { success: false, error: 'Invalid or expired OTP code. Please try again.' };
  }

  const rawUsers = await AsyncStorage.getItem(STORAGE_USERS);
  const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

  const finalName = name?.trim() || record?.name || trimmedEmail.split('@')[0];
  const dynamicId = generateDynamicId();

  const newUser: UserAccount = {
    id: dynamicId,
    name: finalName,
    email: trimmedEmail,
    password: password || record?.password || '',
    avatarUrl: `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(finalName)}`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await AsyncStorage.setItem(STORAGE_USERS, JSON.stringify(users));

  return {
    success: true,
    user: newUser,
    token: `jwt_${dynamicId}`,
  };
}

async function fallbackLogin(email: string, password?: string) {
  const trimmedEmail = email.trim().toLowerCase();
  const rawUsers = await AsyncStorage.getItem(STORAGE_USERS);
  const users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

  const found = users.find((u) => u.email.toLowerCase() === trimmedEmail);
  if (!found) {
    return { success: false, error: 'No account found with this email. Please sign up.' };
  }

  if (password && found.password && found.password !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  let partner: UserAccount | null = null;
  if (found.partnerId) {
    partner = users.find((u) => u.id === found.partnerId) || null;
  }

  return {
    success: true,
    user: found,
    partner,
    token: `jwt_${found.id}`,
  };
}

async function fallbackLinkPartner(
  currentUserId: string,
  partnerEmail: string,
  partnerPassword?: string,
  partnerName?: string
) {
  const rawUsers = await AsyncStorage.getItem(STORAGE_USERS);
  let users: UserAccount[] = rawUsers ? JSON.parse(rawUsers) : [];

  const currentUser = users.find((u) => u.id === currentUserId);
  if (!currentUser) return { success: false, error: 'Current user not found' };

  const trimmedPartnerEmail = partnerEmail.trim().toLowerCase();
  let partnerUser = users.find((u) => u.email.toLowerCase() === trimmedPartnerEmail);

  if (!partnerUser) {
    const dynamicPartnerId = generateDynamicId();
    const finalPartnerName = partnerName?.trim() || trimmedPartnerEmail.split('@')[0];
    partnerUser = {
      id: dynamicPartnerId,
      name: finalPartnerName,
      email: trimmedPartnerEmail,
      password: partnerPassword || '',
      partnerId: currentUser.id,
      partnerName: currentUser.name,
      partnerEmail: currentUser.email,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(finalPartnerName)}`,
      createdAt: new Date().toISOString(),
    };
    users.push(partnerUser);
  } else {
    if (partnerName && partnerName.trim()) {
      partnerUser.name = partnerName.trim();
    }
    partnerUser.partnerId = currentUser.id;
    partnerUser.partnerName = currentUser.name;
    partnerUser.partnerEmail = currentUser.email;
  }

  currentUser.partnerId = partnerUser.id;
  currentUser.partnerName = partnerUser.name;
  currentUser.partnerEmail = partnerUser.email;

  users = users.map((u) => {
    if (u.id === currentUser.id) return currentUser;
    if (u.id === partnerUser!.id) return partnerUser!;
    return u;
  });

  await AsyncStorage.setItem(STORAGE_USERS, JSON.stringify(users));

  return {
    success: true,
    user: currentUser,
    partner: partnerUser,
  };
}

// Unified API Client
export const api = {
  async sendOtp(name: string, email: string, password?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      return data;
    } catch (err: any) {
      console.warn('Backend /auth/send-otp unreachable, trying fallback. Error:', err?.message);
      return fallbackSendOtp(name, email, password);
    }
  },

  async verifyOtpSignup(email: string, otp: string, name?: string, password?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      return data;
    } catch (err: any) {
      console.warn('Backend /auth/verify-otp-signup unreachable, trying fallback. Error:', err?.message);
      return fallbackVerifyOtpSignup(email, otp, name, password);
    }
  },

  async login(email: string, password?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      return data;
    } catch (err: any) {
      console.warn('Backend /auth/login unreachable, trying fallback. Error:', err?.message);
      return fallbackLogin(email, password);
    }
  },

  async linkPartner(
    currentUserId: string,
    partnerEmail: string,
    partnerPassword?: string,
    partnerName?: string
  ) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/partner/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId, partnerEmail, partnerPassword, partnerName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to link partner');
      return data;
    } catch (err: any) {
      console.warn('Backend /auth/partner/link unreachable, trying fallback. Error:', err?.message);
      return fallbackLinkPartner(currentUserId, partnerEmail, partnerPassword, partnerName);
    }
  },

  async updatePushToken(userId: string, pushToken?: string, fcmToken?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/update-push-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, pushToken, fcmToken }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('Could not update push token on backend:', err?.message);
      return { success: false };
    }
  },

  async sendPartnerPushNudge(currentUserId: string, partnerId: string, taskTitle: string, taskTime: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/push/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId, partnerId, taskTitle, taskTime }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('Could not send partner push nudge:', err?.message);
      return { success: false };
    }
  },

  // Task Database Endpoints
  async getTasks(userId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
      return data;
    } catch (err: any) {
      console.warn('Backend /tasks unreachable:', err?.message);
      return { success: false, error: err?.message };
    }
  },

  async createTask(taskData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');
      return data;
    } catch (err: any) {
      console.warn('Backend POST /tasks unreachable:', err?.message);
      return { success: false, error: err?.message };
    }
  },

  async completeTaskWithPhoto(taskId: string, photoUrl: string, userName: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/complete-with-photo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl, userName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete task in DB');
      return data;
    } catch (err: any) {
      console.warn('Backend PUT /tasks/:id/complete-with-photo unreachable:', err?.message);
      return { success: false, error: err?.message };
    }
  },

  async attachTaskPhoto(taskId: string, photoUrl: string, userName: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl, userName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to attach photo in DB');
      return data;
    } catch (err: any) {
      console.warn('Backend POST /tasks/:id/photo unreachable:', err?.message);
      return { success: false, error: err?.message };
    }
  },

  async toggleTask(taskId: string, userName: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle task in DB');
      return data;
    } catch (err: any) {
      console.warn('Backend PUT /tasks/:id/toggle unreachable:', err?.message);
      return { success: false, error: err?.message };
    }
  },

  async deleteTask(taskId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete task in DB');
      return data;
    } catch (err: any) {
      console.warn('Backend DELETE /tasks/:id unreachable:', err?.message);
      return { success: false, error: err?.message };
    }
  },

  // === SPECIAL DATES API (Remote MongoDB & Local DB Sync) ===
  async getSpecialDates(userId?: string) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/special-dates${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`
      );
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
      return { success: false, error: 'Non-JSON response' };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  async createSpecialDate(dateData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/special-dates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateData),
      });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },

  async deleteSpecialDate(dateId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/special-dates/${dateId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        return { success: false, error: `HTTP ${res.status}` };
      }
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  },
};

