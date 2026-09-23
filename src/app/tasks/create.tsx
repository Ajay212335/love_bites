import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Clock,
  Heart,
  Coffee,
  Moon,
  ChefHat,
  Smile,
  X,
  PlusCircle,
  Bell,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTasks } from '@/context/TaskContext';
import { useAuth } from '@/context/AuthContext';
import { TaskCategory, TaskAssignee } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StyledAlertModal, AlertModalType } from '@/components/ui/StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

const CATEGORIES: { label: string; value: TaskCategory; icon: any }[] = [
  { label: 'Romance', value: 'romance', icon: Heart },
  { label: 'Morning Ritual', value: 'morning', icon: Coffee },
  { label: 'Food & Cook', value: 'cooking', icon: ChefHat },
  { label: 'Night Spark', value: 'night', icon: Moon },
  { label: 'Fun & Play', value: 'fun', icon: Smile },
];

const PRESET_TIMES = [
  { label: '08:00 AM (Morning)', hour: 8, minute: 0, text: '08:00 AM' },
  { label: '10:30 AM (Mid-Morning)', hour: 10, minute: 30, text: '10:30 AM' },
  { label: '01:30 PM (Afternoon)', hour: 13, minute: 30, text: '01:30 PM' },
  { label: '06:00 PM (Sunset/Evening)', hour: 18, minute: 0, text: '06:00 PM' },
  { label: '07:30 PM (Dinner Bite)', hour: 19, minute: 30, text: '07:30 PM' },
  { label: '09:30 PM (Night Sparks)', hour: 21, minute: 30, text: '09:30 PM' },
];

export default function CreateTaskScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addTask } = useTasks();
  const { partner } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('romance');
  const [selectedAssignee, setSelectedAssignee] = useState<TaskAssignee>('both');
  const [selectedTime, setSelectedTime] = useState(PRESET_TIMES[4]); // Default to 7:30 PM
  const [customHour, setCustomHour] = useState('7');
  const [customMinute, setCustomMinute] = useState('30');
  const [customPeriod, setCustomPeriod] = useState<'AM' | 'PM'>('PM');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (
    title: string,
    message: string,
    type: AlertModalType = 'info',
    onConfirm?: () => void
  ) => {
    setAlertModal({ visible: true, title, message, type, onConfirm });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showAlert('Task Name Required', 'Please enter a task name or date idea.', 'warning');
      return;
    }

    let finalHour = selectedTime.hour;
    let finalMinute = selectedTime.minute;
    let finalTimeStr = selectedTime.text;

    if (useCustomTime) {
      let h = parseInt(customHour, 10) || 12;
      const m = parseInt(customMinute, 10) || 0;
      if (customPeriod === 'PM' && h < 12) h += 12;
      if (customPeriod === 'AM' && h === 12) h = 0;

      finalHour = h;
      finalMinute = m;
      const formattedH = (parseInt(customHour, 10) || 12).toString().padStart(2, '0');
      const formattedM = m.toString().padStart(2, '0');
      finalTimeStr = `${formattedH}:${formattedM} ${customPeriod}`;
    }

    setLoading(true);
    await addTask({
      title: title.trim(),
      description: description.trim(),
      time: finalTimeStr,
      hour: finalHour,
      minute: finalMinute,
      category: selectedCategory,
      assignedTo: selectedAssignee,
    });
    setLoading(false);

    showAlert(
      'Daily Task Scheduled! 💖',
      `"${title.trim()}" is scheduled for ${finalTimeStr}. A timed reminder notification will alert you and ${partner?.name || 'your partner'} at that exact time.`,
      'success',
      () => router.back()
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.topBar}>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              Add Daily Couple Task
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <X size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Input
            label="Task Name / Daily Bite"
            placeholder="e.g. Candlelight Dessert Tasting"
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label="Details & Romantic Notes (Optional)"
            placeholder="e.g. Try the strawberry chocolate fondue and share cute memories"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          {/* Category Selector */}
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Category Mood</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.value;
              const IconComp = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.value}
                  activeOpacity={0.8}
                  onPress={() => setSelectedCategory(cat.value)}
                  style={[
                    styles.categoryBtn,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <IconComp size={16} color={isSelected ? '#FFFFFF' : colors.text} />
                  <Text
                    style={[
                      styles.categoryBtnText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time Picker Selection */}
          <View style={styles.timeSectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Task Timing & Alarm</Text>
            <TouchableOpacity onPress={() => setUseCustomTime(!useCustomTime)}>
              <Text style={[styles.customToggleText, { color: colors.primary }]}>
                {useCustomTime ? 'Use Presets' : 'Custom Time'}
              </Text>
            </TouchableOpacity>
          </View>

          {!useCustomTime ? (
            <View style={styles.timePresetsGrid}>
              {PRESET_TIMES.map((timeItem, idx) => {
                const isSelected = selectedTime.text === timeItem.text;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTime(timeItem)}
                    style={[
                      styles.timePresetBtn,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Clock size={14} color={isSelected ? colors.primary : colors.textMuted} />
                    <Text
                      style={[
                        styles.timePresetText,
                        { color: isSelected ? colors.primary : colors.text },
                      ]}
                    >
                      {timeItem.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Card style={styles.customTimeCard}>
              <View style={styles.customTimeInputs}>
                <Input
                  label="Hour (1-12)"
                  placeholder="07"
                  keyboardType="numeric"
                  maxLength={2}
                  value={customHour}
                  onChangeText={setCustomHour}
                  containerStyle={{ width: 80 }}
                />
                <Text style={[styles.timeColon, { color: colors.text }]}>:</Text>
                <Input
                  label="Minute (0-59)"
                  placeholder="30"
                  keyboardType="numeric"
                  maxLength={2}
                  value={customMinute}
                  onChangeText={setCustomMinute}
                  containerStyle={{ width: 80 }}
                />
                <View style={styles.amPmSelector}>
                  <TouchableOpacity
                    onPress={() => setCustomPeriod('AM')}
                    style={[
                      styles.amPmBtn,
                      customPeriod === 'AM' && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.amPmText,
                        { color: customPeriod === 'AM' ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCustomPeriod('PM')}
                    style={[
                      styles.amPmBtn,
                      customPeriod === 'PM' && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.amPmText,
                        { color: customPeriod === 'PM' ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}

          {/* Assignee Selector */}
          <Text style={[styles.sectionLabel, { color: colors.text, marginTop: Spacing.md }]}>
            Who Should Do This?
          </Text>
          <View style={styles.assigneeRow}>
            {(['both', 'partner', 'me'] as TaskAssignee[]).map((assignee) => {
              const isSelected = selectedAssignee === assignee;
              const label =
                assignee === 'both'
                  ? 'Both of Us'
                  : assignee === 'partner'
                  ? partner?.name || 'Partner'
                  : 'Just Me';

              return (
                <TouchableOpacity
                  key={assignee}
                  activeOpacity={0.8}
                  onPress={() => setSelectedAssignee(assignee)}
                  style={[
                    styles.assigneeBtn,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.assigneeText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notification Info Banner */}
          <View
            style={[
              styles.notificationInfo,
              { backgroundColor: isDark ? '#261922' : '#FFF0F5' },
            ]}
          >
            <Bell size={16} color={colors.primary} />
            <Text style={[styles.notificationInfoText, { color: colors.textSecondary }]}>
              A reminder notification will be triggered at your set time every day. You can also tap &quot;Tell Partner&quot; at any moment to send an instant alert.
            </Text>
          </View>

          {/* Submit Button */}
          <Button
            title="Schedule Daily Task"
            onPress={handleCreate}
            loading={loading}
            variant="primary"
            size="lg"
            icon={<PlusCircle size={18} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Styled Alert Modal */}
      <StyledAlertModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        confirmText={alertModal.type === 'success' ? 'Great! 💖' : 'Got it'}
        onConfirm={alertModal.onConfirm}
        onClose={() => {
          const cb = alertModal.onConfirm;
          setAlertModal((prev) => ({ ...prev, visible: false }));
          if (cb) cb();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timePresetsGrid: {
    gap: 8,
  },
  timePresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  timePresetText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customTimeCard: {
    padding: Spacing.md,
  },
  customTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeColon: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 10,
  },
  amPmSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: 10,
    marginLeft: 4,
  },
  amPmBtn: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  amPmText: {
    fontSize: 12,
    fontWeight: '700',
  },
  assigneeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  assigneeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  assigneeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  notificationInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: Spacing.xl,
  },
});
