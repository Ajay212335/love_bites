import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { TaskProvider } from '@/context/TaskContext';

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { requestNotificationPermissions, setupNotificationChannel } from '@/services/notificationService';
import { useRouter } from 'expo-router';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const isAndroidExpoGo = Platform.OS === 'android' && isExpoGo;

function RootNavigation() {
  const { colorScheme, colors } = useTheme();
  const router = useRouter();

  React.useEffect(() => {
    requestNotificationPermissions();
    setupNotificationChannel();

    // Listen for notification tap / click from status bar (in Dev builds & standalone APKs)
    if (!isAndroidExpoGo) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Notifications = require('expo-notifications');
        if (Notifications?.addNotificationResponseReceivedListener) {
          const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
            console.log('📱 [Notification Tapped]: User opened app from notification', response);
            router.push('/notifications');
          });
          return () => subscription.remove();
        }
      } catch {}
    }
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/signup"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/verify-otp"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/onboarding"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="tasks/create"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="partner/add"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="notifications/index"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="special-dates/index"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <RootNavigation />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
