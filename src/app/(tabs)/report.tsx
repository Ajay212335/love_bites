import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  Sparkles,
  User,
  PieChart as PieChartIcon,
  Flame,
  Camera,
  Layers,
  Award,
  X,
  Eye,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import { DailyTask, TaskCategory } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

type ReportViewMode = 'day' | 'month' | 'year';
type StatusFilter = 'all' | 'incomplete' | 'completed';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  romance: '#FF204E',
  cooking: '#FF9F45',
  wellness: '#4ECCA3',
  fun: '#FFD93D',
  morning: '#FF6B6B',
  night: '#A66CFF',
  custom: '#6BCB77',
};

export default function ReportScreen() {
  const { colors } = useTheme();
  const { user, partner } = useAuth();
  const { tasks, toggleTaskComplete } = useTasks();

  const [viewMode, setViewMode] = useState<ReportViewMode>('day');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewingPhotoTask, setViewingPhotoTask] = useState<DailyTask | null>(null);

  // Date Navigation Helpers
  const handlePrev = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else {
      next.setFullYear(next.getFullYear() - 1);
    }
    setSelectedDate(next);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }
    setSelectedDate(next);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date());
  };

  // Helper to extract date string YYYY-MM-DD from task
  const getTaskDateStr = (task: DailyTask): string => {
    if (task.date) return task.date;
    if (task.createdAt) return task.createdAt.split('T')[0];
    if (task.completedAt) return task.completedAt.split('T')[0];
    return new Date().toISOString().split('T')[0];
  };

  // 1. Day Filtered Tasks
  const selectedDayStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const dayTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = getTaskDateStr(t);
      return taskDate === selectedDayStr;
    });
  }, [tasks, selectedDayStr]);

  // 2. Month Filtered Tasks
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth(); // 0-11

  const monthTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = getTaskDateStr(t);
      const parts = taskDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        return y === selectedYear && m === selectedMonth;
      }
      return false;
    });
  }, [tasks, selectedYear, selectedMonth]);

  // 3. Year Filtered Tasks
  const yearTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDate = getTaskDateStr(t);
      const parts = taskDate.split('-');
      if (parts.length >= 1) {
        const y = parseInt(parts[0], 10);
        return y === selectedYear;
      }
      return false;
    });
  }, [tasks, selectedYear]);

  // Active dataset depending on mode
  const activeTasks = useMemo(() => {
    if (viewMode === 'day') return dayTasks;
    if (viewMode === 'month') return monthTasks;
    return yearTasks;
  }, [viewMode, dayTasks, monthTasks, yearTasks]);

  const totalCount = activeTasks.length;
  const completedTasks = useMemo(() => activeTasks.filter((t) => t.isCompleted), [activeTasks]);
  const incompleteTasks = useMemo(() => activeTasks.filter((t) => !t.isCompleted), [activeTasks]);
  const completedCount = completedTasks.length;
  const incompleteCount = incompleteTasks.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered task list to show
  const displayTasks = useMemo(() => {
    if (statusFilter === 'incomplete') return incompleteTasks;
    if (statusFilter === 'completed') return completedTasks;
    return activeTasks;
  }, [statusFilter, activeTasks, incompleteTasks, completedTasks]);

  // Monthly breakdown stats for Year Mode
  const yearMonthlyStats = useMemo(() => {
    const stats: { month: string; total: number; completed: number; incomplete: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const mTasks = yearTasks.filter((t) => {
        const parts = getTaskDateStr(t).split('-');
        return parts.length >= 2 && parseInt(parts[1], 10) - 1 === m;
      });
      const cCount = mTasks.filter((t) => t.isCompleted).length;
      stats.push({
        month: MONTH_SHORT[m],
        total: mTasks.length,
        completed: cCount,
        incomplete: mTasks.length - cCount,
      });
    }
    return stats;
  }, [yearTasks]);

  // Category breakdown for Month/Year mode
  const categoryStats = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    activeTasks.forEach((t) => {
      const cat = t.category || 'custom';
      if (!counts[cat]) {
        counts[cat] = { total: 0, completed: 0 };
      }
      counts[cat].total += 1;
      if (t.isCompleted) counts[cat].completed += 1;
    });
    return counts;
  }, [activeTasks]);

  // Formatted Header Title
  const getHeaderTitle = () => {
    if (viewMode === 'day') {
      const isToday = new Date().toDateString() === selectedDate.toDateString();
      const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return isToday ? `Today (${dateStr})` : dateStr;
    }
    if (viewMode === 'month') {
      return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    return `Year ${selectedYear}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.pageTitle, { color: colors.text }]}>
              Task <Text style={{ color: colors.primary }}>Report</Text>
            </Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
              Track completed, missed & outstanding couple moments
            </Text>
          </View>
        </View>

        {/* View Mode Switcher: Day | Month | Year */}
        <View style={[styles.modeTabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.modeTabBtn,
              viewMode === 'day' && [styles.modeTabBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setViewMode('day')}
          >
            <CalendarIcon size={15} color={viewMode === 'day' ? '#FFFFFF' : colors.textMuted} />
            <Text
              style={[
                styles.modeTabLabel,
                { color: viewMode === 'day' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Date
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTabBtn,
              viewMode === 'month' && [styles.modeTabBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setViewMode('month')}
          >
            <PieChartIcon size={15} color={viewMode === 'month' ? '#FFFFFF' : colors.textMuted} />
            <Text
              style={[
                styles.modeTabLabel,
                { color: viewMode === 'month' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTabBtn,
              viewMode === 'year' && [styles.modeTabBtnActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setViewMode('year')}
          >
            <Award size={15} color={viewMode === 'year' ? '#FFFFFF' : colors.textMuted} />
            <Text
              style={[
                styles.modeTabLabel,
                { color: viewMode === 'year' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              Yearly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date / Month / Year Navigator */}
        <View style={[styles.navCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.navArrowBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={handlePrev}
          >
            <ChevronLeft size={20} color={colors.text} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSetToday} style={styles.navTitleCenter}>
            <Text style={[styles.navTitleText, { color: colors.text }]}>{getHeaderTitle()}</Text>
            {viewMode === 'day' && (
              <Text style={[styles.navSubtext, { color: colors.primary }]}>Tap to jump to Today</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navArrowBtn, { backgroundColor: colors.surfaceSubtle }]}
            onPress={handleNext}
          >
            <ChevronRight size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Big Metrics Summary Card */}
        <Card style={[styles.metricsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metricsTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.metricsSubtitle, { color: colors.textSecondary }]}>
                {viewMode === 'day' ? 'DAILY COMPLETION' : viewMode === 'month' ? 'MONTHLY COMPLETION' : 'ANNUAL COMPLETION'}
              </Text>
              <View style={styles.rateRow}>
                <Text style={[styles.rateValue, { color: colors.primary }]}>{completionRate}%</Text>
                <Badge
                  label={completionRate >= 80 ? '🔥 On Fire' : completionRate >= 50 ? '✨ Good Spark' : '⚠️ Attention'}
                  variant={completionRate >= 80 ? 'primary' : completionRate >= 50 ? 'secondary' : 'neutral'}
                />
              </View>
            </View>

            {/* Circular Rate Indicator */}
            <View
              style={[
                styles.rateCircle,
                {
                  borderColor: completionRate > 0 ? colors.primary : colors.border,
                  backgroundColor: 'rgba(255, 32, 78, 0.08)',
                },
              ]}
            >
              <Heart
                size={24}
                color={colors.primary}
                fill={completionRate >= 50 ? colors.primary : 'transparent'}
              />
            </View>
          </View>

          {/* Linear Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceSubtle }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${completionRate}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          {/* 3 Metric Pills */}
          <View style={[styles.metricPillsRow, { borderTopColor: colors.border }]}>
            <View style={styles.metricPill}>
              <Layers size={16} color={colors.textSecondary} />
              <Text style={[styles.metricPillNumber, { color: colors.text }]}>{totalCount}</Text>
              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricPill}>
              <CheckCircle2 size={16} color="#34C759" />
              <Text style={[styles.metricPillNumber, { color: '#34C759' }]}>{completedCount}</Text>
              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricPill}>
              <XCircle size={16} color="#FF3B30" />
              <Text style={[styles.metricPillNumber, { color: '#FF3B30' }]}>{incompleteCount}</Text>
              <Text style={[styles.metricPillLabel, { color: colors.textSecondary }]}>Incomplete</Text>
            </View>
          </View>
        </Card>

        {/* Year Mode: Month-by-Month Trend Overview */}
        {viewMode === 'year' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>12-Month Completion Trend</Text>
            <Card style={[styles.trendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.monthsGrid}>
                {yearMonthlyStats.map((item, idx) => {
                  const mRate = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
                  const isCurrentSelectedMonth = idx === selectedMonth;
                  return (
                    <TouchableOpacity
                      key={item.month}
                      activeOpacity={0.7}
                      onPress={() => {
                        const next = new Date(selectedDate);
                        next.setMonth(idx);
                        setSelectedDate(next);
                        setViewMode('month');
                      }}
                      style={[
                        styles.monthGridItem,
                        {
                          backgroundColor: isCurrentSelectedMonth
                            ? 'rgba(255, 32, 78, 0.15)'
                            : colors.surfaceSubtle,
                          borderColor: isCurrentSelectedMonth ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthGridName,
                          { color: isCurrentSelectedMonth ? colors.primary : colors.text },
                        ]}
                      >
                        {item.month}
                      </Text>
                      <Text style={[styles.monthGridRate, { color: mRate > 0 ? '#34C759' : colors.textMuted }]}>
                        {item.total > 0 ? `${mRate}%` : '—'}
                      </Text>
                      <Text style={[styles.monthGridCount, { color: colors.textSecondary }]}>
                        {item.completed}/{item.total}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          </View>
        )}

        {/* Category Breakdown for Month / Year Mode */}
        {viewMode !== 'day' && Object.keys(categoryStats).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Breakdown</Text>
            <Card style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {Object.entries(categoryStats).map(([cat, stat]) => {
                const percent = Math.round((stat.completed / stat.total) * 100);
                const catColor = CATEGORY_COLORS[cat as TaskCategory] || colors.primary;
                return (
                  <View key={cat} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryNameRow}>
                        <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                        <Text style={[styles.categoryName, { color: colors.text }]}>
                          {cat.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.categoryStatText, { color: colors.textSecondary }]}>
                        {stat.completed} of {stat.total} done ({percent}%)
                      </Text>
                    </View>
                    <View style={[styles.catProgressTrack, { backgroundColor: colors.surfaceSubtle }]}>
                      <View
                        style={[
                          styles.catProgressFill,
                          {
                            width: `${percent}%`,
                            backgroundColor: catColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {/* Filter Chips: All | Incomplete Only | Completed Only */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Task Details ({displayTasks.length})
          </Text>
          <View style={styles.filterChipsRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'all' && [styles.filterChipActive, { backgroundColor: colors.surfaceSubtle, borderColor: colors.primary }],
              ]}
              onPress={() => setStatusFilter('all')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === 'all' ? colors.primary : colors.textSecondary },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'incomplete' && [styles.filterChipActive, { backgroundColor: 'rgba(255, 59, 48, 0.15)', borderColor: '#FF3B30' }],
              ]}
              onPress={() => setStatusFilter('incomplete')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === 'incomplete' ? '#FF3B30' : colors.textSecondary },
                ]}
              >
                Incomplete ({incompleteCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                statusFilter === 'completed' && [styles.filterChipActive, { backgroundColor: 'rgba(52, 199, 89, 0.15)', borderColor: '#34C759' }],
              ]}
              onPress={() => setStatusFilter('completed')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: statusFilter === 'completed' ? '#34C759' : colors.textSecondary },
                ]}
              >
                Completed ({completedCount})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tasks List */}
        {displayTasks.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CalendarIcon size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {statusFilter === 'incomplete'
                ? 'No Incomplete Tasks! 🎉'
                : statusFilter === 'completed'
                ? 'No Completed Tasks Yet'
                : 'No Tasks Recorded'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {statusFilter === 'incomplete'
                ? 'All scheduled couple tasks for this period have been successfully completed.'
                : 'Create tasks in the Tasks tab to view detailed history and reports.'}
            </Text>
          </Card>
        ) : (
          displayTasks.map((task) => {
            const isDone = task.isCompleted;
            const taskColor = CATEGORY_COLORS[task.category] || colors.primary;
            const assignedLabel =
              task.assignedTo === 'both'
                ? 'Both Partners'
                : task.assignedTo === 'partner'
                ? partner?.name || 'Partner'
                : user?.name || 'You';

            return (
              <Card
                key={task.id}
                style={[
                  styles.taskItemCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isDone ? colors.border : 'rgba(255, 59, 48, 0.35)',
                  },
                ]}
              >
                <View style={styles.taskItemRow}>
                  {/* Status Toggle / Icon */}
                  <TouchableOpacity
                    style={styles.taskStatusToggle}
                    onPress={() => toggleTaskComplete(task.id)}
                  >
                    {isDone ? (
                      <CheckCircle2 size={24} color="#34C759" />
                    ) : (
                      <XCircle size={24} color="#FF3B30" />
                    )}
                  </TouchableOpacity>

                  {/* Task Content */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.taskItemTitleRow}>
                      <Text
                        style={[
                          styles.taskItemTitle,
                          {
                            color: colors.text,
                            textDecorationLine: isDone ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {task.title}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: isDone ? 'rgba(52, 199, 89, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                            borderColor: isDone ? 'rgba(52, 199, 89, 0.4)' : 'rgba(255, 59, 48, 0.4)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: isDone ? '#34C759' : '#FF3B30' },
                          ]}
                        >
                          {isDone ? 'Completed' : 'Missed / Incomplete'}
                        </Text>
                      </View>
                    </View>

                    {task.description ? (
                      <Text style={[styles.taskItemDesc, { color: colors.textSecondary }]}>
                        {task.description}
                      </Text>
                    ) : null}

                    {/* Metadata chips */}
                    <View style={styles.taskMetaRow}>
                      <View style={styles.metaChip}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                          {task.time || 'All Day'}
                        </Text>
                      </View>

                      <View style={styles.metaChip}>
                        <User size={12} color={colors.textMuted} />
                        <Text style={[styles.metaChipText, { color: colors.textSecondary }]}>
                          {assignedLabel}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.categoryBadgeChip,
                          { backgroundColor: `${taskColor}20`, borderColor: taskColor },
                        ]}
                      >
                        <Text style={[styles.categoryBadgeText, { color: taskColor }]}>
                          {task.category}
                        </Text>
                      </View>
                    </View>

                    {/* Photo Proof thumbnail if attached */}
                    {task.photoUrl && (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setViewingPhotoTask(task)}
                        style={[styles.photoProofBox, { borderColor: colors.border }]}
                      >
                        <Camera size={14} color={colors.primary} />
                        <Image source={{ uri: task.photoUrl }} style={styles.photoProofThumb} />
                        <Text style={[styles.photoProofText, { color: colors.textSecondary }]}>
                          Proof by {task.attachedByName || 'Partner'}
                        </Text>
                        <Eye size={12} color={colors.primary} style={{ marginLeft: 'auto' }} />
                      </TouchableOpacity>
                    )}

                    {/* Completed by footer */}
                    {isDone && task.completedByName && (
                      <Text style={[styles.completedByText, { color: '#34C759' }]}>
                        ✓ Completed by {task.completedByName}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Full-Screen Proof Viewer Modal */}
      {viewingPhotoTask && viewingPhotoTask.photoUrl && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setViewingPhotoTask(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTaskTitle} numberOfLines={1}>
                  {viewingPhotoTask.title}
                </Text>
                <Text style={styles.modalTaskMeta}>
                  {viewingPhotoTask.attachedByName ? `Photo by ${viewingPhotoTask.attachedByName}` : 'Proof Photo'}
                  {viewingPhotoTask.completedByName ? ` • Completed by ${viewingPhotoTask.completedByName}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setViewingPhotoTask(null)}
              >
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalImageContainer}>
              <Image source={{ uri: viewingPhotoTask.photoUrl }} style={styles.modalFullImage} />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => setViewingPhotoTask(null)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Close Proof</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
  },
  topHeader: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  modeTabContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 4,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  modeTabBtnActive: {
    shadowColor: '#FF204E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTabLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleCenter: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  navTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  navSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  metricsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  metricsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  metricsSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '900',
  },
  rateCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  metricPill: {
    alignItems: 'center',
    gap: 3,
  },
  metricPillNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  metricPillLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 28,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  trendCard: {
    padding: Spacing.sm,
    borderWidth: 1,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  monthGridItem: {
    width: (width - 64) / 4,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthGridName: {
    fontSize: 12,
    fontWeight: '700',
  },
  monthGridRate: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  monthGridCount: {
    fontSize: 10,
    marginTop: 2,
  },
  categoryCard: {
    padding: Spacing.md,
    borderWidth: 1,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryStatText: {
    fontSize: 11,
  },
  catProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
  },
  taskItemCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskStatusToggle: {
    paddingTop: 2,
  },
  taskItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  taskItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  taskItemDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaChipText: {
    fontSize: 11,
  },
  categoryBadgeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  photoProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    padding: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  photoProofThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  photoProofText: {
    fontSize: 11,
    fontWeight: '500',
  },
  completedByText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#23232F',
  },
  modalTaskTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  modalTaskMeta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E1E26',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  modalFullImage: {
    width: width - 32,
    height: 380,
    resizeMode: 'contain',
    borderRadius: BorderRadius.lg,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
  },
  modalActionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
});
