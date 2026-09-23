import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, UserAccount } from '@/types';
import { api } from '@/services/api';

interface AuthContextType {
  user: UserProfile | null;
  partner: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  sendOtp: (
    name: string,
    email: string,
    password?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyOtp: (
    email: string,
    otp: string,
    name?: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  addPartner: (
    email: string,
    password?: string,
    name?: string
  ) => Promise<{ success: boolean; error?: string }>;
  unlinkPartner: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AUTH_USER_KEY = '@love_bites_current_user';
const ONBOARDING_STORAGE_KEY = '@love_bites_onboarding_completed';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const [storedUser, storedOnboarding] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
        ]);

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (parsedUser.partnerId && parsedUser.partnerName) {
            setPartner({
              id: parsedUser.partnerId,
              name: parsedUser.partnerName,
              email: parsedUser.partnerEmail || '',
              createdAt: new Date().toISOString(),
              preferences: { notifications: true, darkMode: false },
            });
          }
        }

        if (storedOnboarding !== null) {
          setHasSeenOnboarding(storedOnboarding === 'true');
        }
      } catch (e) {
        console.error('Failed to initialize auth', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const sendOtp = async (name: string, email: string, password?: string) => {
    return await api.sendOtp(name, email, password);
  };

  const verifyOtp = async (email: string, otp: string, name?: string, password?: string) => {
    const result = await api.verifyOtpSignup(email, otp, name, password);
    if (result.success && result.user) {
      const activeProfile: UserProfile = {
        ...result.user,
        preferences: { notifications: true, darkMode: false },
      };
      setUser(activeProfile);
      setPartner(null);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(activeProfile));

      // Register device push token with backend
      try {
        const { registerForPushNotificationsAsync } = await import('@/services/notificationService');
        const token = await registerForPushNotificationsAsync(activeProfile.id);
        if (token && activeProfile.id) {
          await api.updatePushToken(activeProfile.id, token, token);
        }
      } catch (e) {
        console.log('Push token registration info:', e);
      }

      return { success: true };
    }
    return { success: false, error: result.error || 'Verification failed.' };
  };

  const login = async (email: string, password?: string) => {
    const result = await api.login(email, password);
    if (result.success && result.user) {
      const activeProfile: UserProfile = {
        ...result.user,
        preferences: { notifications: true, darkMode: false },
      };
      setUser(activeProfile);

      if (result.partner) {
        setPartner({
          ...result.partner,
          preferences: { notifications: true, darkMode: false },
        });
      } else if (result.user.partnerId && result.user.partnerName) {
        setPartner({
          id: result.user.partnerId,
          name: result.user.partnerName,
          email: result.user.partnerEmail || '',
          createdAt: new Date().toISOString(),
          preferences: { notifications: true, darkMode: false },
        });
      } else {
        setPartner(null);
      }

      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(activeProfile));

      // Register device push token with backend
      try {
        const { registerForPushNotificationsAsync } = await import('@/services/notificationService');
        const token = await registerForPushNotificationsAsync(activeProfile.id);
        if (token && activeProfile.id) {
          await api.updatePushToken(activeProfile.id, token, token);
        }
      } catch (e) {
        console.log('Push token registration info:', e);
      }

      return { success: true };
    }
    return { success: false, error: result.error || 'Login failed.' };
  };

  const addPartner = async (email: string, password?: string, name?: string) => {
    if (!user) return { success: false, error: 'You must be logged in to link a partner.' };

    const result = await api.linkPartner(user.id, email, password, name);
    if (result.success && result.user) {
      const updatedUser: UserProfile = {
        ...user,
        ...result.user,
      };
      setUser(updatedUser);

      if (result.partner) {
        setPartner({
          ...result.partner,
          preferences: { notifications: true, darkMode: false },
        });
      }

      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to link partner.' };
  };

  const unlinkPartner = async () => {
    if (!user) return;
    const updatedUser: UserProfile = {
      ...user,
      partnerId: undefined,
      partnerName: undefined,
      partnerEmail: undefined,
    };

    setUser(updatedUser);
    setPartner(null);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
  };

  const logout = async () => {
    setUser(null);
    setPartner(null);
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  };

  const updateUser = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
  };

  const completeOnboarding = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        partner,
        isAuthenticated: !!user,
        isLoading,
        hasSeenOnboarding,
        sendOtp,
        verifyOtp,
        login,
        addPartner,
        unlinkPartner,
        logout,
        updateUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
