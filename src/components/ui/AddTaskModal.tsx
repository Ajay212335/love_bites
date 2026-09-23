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
  Modal,
  Dimensions,
} from 'react-native';
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
  Sparkles,
  User,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTasks } from '@/context/TaskContext';
import { useAuth } from '@/context/AuthContext';
import { TaskCategory, TaskAssignee } from '@/types';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { StyledAlertModal, AlertModalType } from './StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const PRESET_TIMES = [
  { label: '08:00 AM (Morning)', hour: 8, minute: 0, text: '08:00 AM' },
  { label: '10:30 AM (Mid-Day)', hour: 10, minute: 30, text: '10:30 AM' },
  { label: '01:30 PM (Lunch)', hour: 13, minute: 30, text: '01:30 PM' },
  { label: '06:00 PM (Evening)', hour: 18, minute: 0, text: '06:00 PM' },
  { label: '07:30 PM (Dinner Bite)', hour: 19, minute: 30, text: '07:30 PM' },
  { label: '09:30 PM (Night Sparks)', hour: 21, minute: 30, text: '09:30 PM' },
];

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onTaskAdded?: () => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  onTaskAdded,
}) => {
  const { colors, isDark } = useTheme();
  const { addTask } = useTasks();
  const { partner } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedAssignee('both');
    setSelectedTime(PRESET_TIMES[4]);
    setUseCustomTime(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showAlert('Task Name Required', 'Please enter a task name or romantic ritual idea.', 'warning');
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
      category: 'romance',
      assignedTo: selectedAssignee,
    });
    setLoading(false);

    showAlert(
      'Daily Task Scheduled! 💖',
      `"${title.trim()}" is set for ${finalTimeStr}. A timed reminder notification will alert you and ${partner?.name || 'your partner'} at that exact time.`,
      'success',
      () => {
        resetForm();
        onClose();
        if (onTaskAdded) {
          onTaskAdded();
        }
      }
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: isDark ? '#14141C' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Grab Handle */}
          <View style={[styles.grabHandle, { backgroundColor: colors.border }]} />

          {/* Modal Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIconBox, { backgroundColor: colors.primaryLight }]}>
                <Sparkles size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>
                  Add Daily Task
                </Text>
                <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                  Scheduled timed ritual for you and your partner
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <X size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Modal Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
          >
            {/* Task Name */}
            <Input
              label="Task Name / Daily Ritual"
              placeholder="e.g. Candlelight Dessert Tasting"
              value={title}
              onChangeText={setTitle}
            />

            {/* Description */}
            <Input
              label="Details & Romantic Notes (Optional)"
              placeholder="e.g. Share 3 things you love about each other"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
            />

            {/* Time Picker Section */}
            <View style={styles.timeHeaderRow}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Alarm & Reminder Time
              </Text>
              <TouchableOpacity onPress={() => setUseCustomTime(!useCustomTime)}>
                <Text style={[styles.toggleText, { color: colors.primary }]}>
                  {useCustomTime ? 'Choose Preset' : 'Custom Time'}
                </Text>
              </TouchableOpacity>
            </View>

            {!useCustomTime ? (
              <View style={styles.presetsGrid}>
                {PRESET_TIMES.map((item, idx) => {
                  const isSelected = selectedTime.text === item.text;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setSelectedTime(item)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Clock
                        size={13}
                        color={isSelected ? '#FFFFFF' : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.presetChipText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Card
                style={[
                  styles.customTimeCard,
                  { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                ]}
              >
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

            {/* Assignee Selection */}
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

                const Icon =
                  assignee === 'both' ? Users : assignee === 'partner' ? Heart : User;

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
                    <Icon size={15} color={isSelected ? '#FFFFFF' : colors.text} />
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

            {/* Notification Tip */}
            <View
              style={[
                styles.tipCard,
                { backgroundColor: isDark ? '#1C1520' : '#FFF0F5', borderColor: 'rgba(255, 32, 78, 0.2)' },
              ]}
            >
              <Bell size={15} color={colors.primary} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                A timed push notification and in-app alert will notify you and your partner when it&apos;s time!
              </Text>
            </View>

            {/* Schedule Button */}
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
        </View>

        {/* Styled Task Scheduled & Validation Alert Modal */}
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
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.9,
    paddingBottom: Spacing.xl,
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    padding: Spacing.lg,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  timeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customTimeCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
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
    marginBottom: Spacing.md,
  },
  assigneeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  assigneeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  submitBtn: {
    marginBottom: Spacing.md,
  },
});
