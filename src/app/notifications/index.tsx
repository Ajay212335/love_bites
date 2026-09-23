import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Heart, Sparkles, Clock, Trash2, ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTasks } from '@/context/TaskContext';
import { clearNotificationLogs, triggerTestPushNotification } from '@/services/notificationService';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { notificationLogs, refreshNotifications } = useTasks();

  const handleClear = async () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notification history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearNotificationLogs();
            await refreshNotifications();
          },
        },
      ]
    );
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(isoString).toLocaleDateString();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Notification Center
        </Text>
        {notificationLogs.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Trash2 size={18} color={colors.error} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Test Notification Banner */}
      <View style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={async () => {
            await triggerTestPushNotification();
            Alert.alert('🔔 Push Alert Triggered', 'Push notification scheduled to fire in 2 seconds!');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primaryLight,
            paddingVertical: 10,
            borderRadius: BorderRadius.md,
            gap: 8,
          }}
        >
          <Bell size={16} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
            Send Test Push Notification
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notificationLogs.length === 0 ? (
          <EmptyState
            icon={<Bell size={36} color={colors.primary} />}
            title="No Notifications Yet"
            description="When daily task alarms fire or your partner sends you a nudge, they will appear here."
            actionTitle="Go Back to Tasks"
            onAction={() => router.back()}
          />
        ) : (
          <View style={styles.list}>
            {notificationLogs.map((log) => (
              <Card key={log.id} style={styles.logCard}>
                <View style={styles.logRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor:
                          log.type === 'partner_nudge'
                            ? colors.primaryLight
                            : colors.surfaceSubtle,
                      },
                    ]}
                  >
                    {log.type === 'partner_nudge' ? (
                      <Heart size={18} color={colors.primary} fill={colors.primary} />
                    ) : (
                      <Clock size={18} color={colors.primary} />
                    )}
                  </View>

                  <View style={styles.logContent}>
                    <View style={styles.logHeader}>
                      <Text style={[styles.logTitle, { color: colors.text }]}>
                        {log.title}
                      </Text>
                      <Text style={[styles.logTime, { color: colors.textMuted }]}>
                        {formatTimeAgo(log.timestamp)}
                      </Text>
                    </View>
                    <Text style={[styles.logBody, { color: colors.textSecondary }]}>
                      {log.body}
                    </Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  list: {
    gap: 8,
    paddingTop: Spacing.xs,
  },
  logCard: {
    padding: Spacing.md,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  logTime: {
    fontSize: 11,
  },
  logBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
