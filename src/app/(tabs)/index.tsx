import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Heart,
  Bell,
  Plus,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Send,
  Flame,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import { PartnerStatusHeader } from '@/components/ui/PartnerStatusHeader';
import { TaskCard } from '@/components/ui/TaskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AddTaskModal } from '@/components/ui/AddTaskModal';
import { Card } from '@/components/ui/Card';
import { Logo } from '@/components/ui/Logo';
import { Spacing, BorderRadius } from '@/constants/theme';

type TaskFilter = 'all' | 'partner' | 'completed';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, partner } = useAuth();
  const { tasks, completedCount, notificationLogs, refreshTasks } = useTasks();
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [addTaskModalVisible, setAddTaskModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  }, [refreshTasks]);

  // Periodic partner sync every 15 seconds to fetch new moment photos & timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      refreshTasks();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshTasks]);

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'completed') return t.isCompleted;
    if (filter === 'partner') return t.assignedTo === 'partner' || t.assignedTo === 'both';
    return true;
  });

  const progressPercentage =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Logo size={28} rounded />
            <Text style={[styles.brandTitle, { color: colors.text }]}>
              Love <Text style={{ color: colors.primary }}>Bites</Text>
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Notifications Button with Badge */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/notifications')}
              style={[
                styles.iconButton,
                { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
              ]}
            >
              <Bell size={18} color={colors.text} />
              {notificationLogs.length > 0 && (
                <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>

            {/* Add Task Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setAddTaskModalVisible(true)}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting */}
        <View style={styles.greetingRow}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hey, {user ? user.name.split(' ')[0] : 'Ajay'} ✋
          </Text>
        </View>

        {/* Partner Connection Banner */}
        <PartnerStatusHeader />

        {/* Daily Couple Progress Card */}
        <Card
          style={[
            styles.progressCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.progressTopRow}>
            <View style={styles.progressLeft}>
              <View style={styles.progressLabelRow}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  Today&apos;s Couple Spark
                </Text>
              </View>
              <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                {completedCount} of {tasks.length} daily moments completed
              </Text>
            </View>

            <View style={[styles.progressPercentCircle, { borderColor: colors.primary }]}>
              <Text style={[styles.progressPercentText, { color: colors.primary }]}>
                {progressPercentage}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Task Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('all')}
            style={[
              styles.filterTab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              filter === 'all' && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === 'all' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              All Tasks ({tasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('partner')}
            style={[
              styles.filterTab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              filter === 'partner' && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === 'partner' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              For {partner?.name ? partner.name.split(' ')[0] : 'Partner'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilter('completed')}
            style={[
              styles.filterTab,
              { backgroundColor: colors.surface, borderColor: colors.border },
              filter === 'completed' && {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === 'completed' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Done ({completedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <View style={styles.tasksContainer}>
          {filteredTasks.length === 0 ? (
            <EmptyState
              icon={<Calendar size={36} color={colors.primary} />}
              title={tasks.length === 0 ? 'No Tasks Added Yet' : 'No Tasks in this Filter'}
              description={
                tasks.length === 0
                  ? 'Your couple task list is fresh and empty. Tap below to create your first daily romantic ritual or shared activity!'
                  : 'No tasks found under this filter. Tap below to create a new task.'
              }
              actionTitle={tasks.length === 0 ? '+ Add Your First Task' : '+ Add Daily Task'}
              onAction={() => setAddTaskModalVisible(true)}
            />
          ) : (
            filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </View>
      </ScrollView>

      {/* Styled Add Task Modal Popup */}
      <AddTaskModal
        visible={addTaskModalVisible}
        onClose={() => setAddTaskModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  greetingRow: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLeft: {
    flex: 1,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressSub: {
    fontSize: 12,
  },
  progressPercentCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 32, 78, 0.08)',
  },
  progressPercentText: {
    fontSize: 13,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tasksContainer: {
    paddingHorizontal: Spacing.md,
  },
});
