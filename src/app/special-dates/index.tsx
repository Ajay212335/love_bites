import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Heart,
  ChevronLeft,
  Plus,
  Calendar,
  Trash2,
  X,
  Lock,
  Clock,
  User,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { specialDatesService } from '@/services/specialDatesService';
import { SpecialDate } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StyledAlertModal, AlertModalType } from '@/components/ui/StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function SpecialDatesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, partner } = useAuth();

  const [dates, setDates] = useState<SpecialDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(''); // YYYY-MM-DD
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Styled Alerts
  const [itemToDelete, setItemToDelete] = useState<SpecialDate | null>(null);
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

  const loadDates = async () => {
    setLoading(true);
    const data = await specialDatesService.getSpecialDates(user?.id, partner?.id);
    setDates(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDates();
  }, [user?.id, partner?.id]);

  const handleOpenAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setTitle('');
    setDateStr(today);
    setNotes('');
    setModalVisible(true);
  };

  const handleSaveDate = async () => {
    if (!title.trim()) {
      showAlert('Title Required', 'Please enter a name for this special date.', 'warning');
      return;
    }
    if (!dateStr.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      showAlert(
        'Valid Date Required',
        'Please enter a date in YYYY-MM-DD format (e.g. 2024-02-14).',
        'warning'
      );
      return;
    }

    setSaving(true);
    await specialDatesService.addSpecialDate({
      title: title.trim(),
      date: dateStr.trim(),
      notes: notes.trim() || undefined,
      userId: user?.id,
      partnerId: partner?.id,
      createdByName: user?.name || 'You',
    });
    setSaving(false);
    setModalVisible(false);
    await loadDates();

    showAlert(
      '💖 Date Saved!',
      `"${title.trim()}" has been saved to your couple database. Both you and ${partner?.name || 'your partner'} can see this date.`,
      'success'
    );
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const toDel = itemToDelete;
    setItemToDelete(null);
    await specialDatesService.deleteSpecialDate(toDel.id, user?.id, partner?.id);
    await loadDates();
  };

  const calculateDaysText = (dateISO: string) => {
    const target = new Date(dateISO);
    const today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { text: 'Today! 🎉', isFuture: false, isToday: true };
    }
    if (diffDays > 0) {
      return { text: `In ${diffDays} day${diffDays === 1 ? '' : 's'}`, isFuture: true, isToday: false };
    }
    const pastDays = Math.abs(diffDays);
    return { text: `${pastDays} days ago`, isFuture: false, isToday: false };
  };

  const formatDateLabel = (dateISO: string) => {
    try {
      const parts = dateISO.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch {}
    return dateISO;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Special <Text style={{ color: colors.primary }}>Dates</Text>
          </Text>
          <View style={styles.lockBadge}>
            <Lock size={10} color={colors.primary} />
            <Text style={[styles.lockBadgeText, { color: colors.primary }]}>
              Shared with {partner?.name ? partner.name.split(' ')[0] : 'Partner'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleOpenAddModal}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Banner */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#1C1520' : '#FFF0F4', borderColor: 'rgba(255, 32, 78, 0.2)' }]}>
          <Heart size={18} color={colors.primary} fill={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            A private couple diary for your anniversaries, birthdays, and relationship milestones. Only you and {partner?.name || 'your partner'} can view these dates.
          </Text>
        </View>

        {/* Dates Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Recorded Dates ({dates.length})
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : dates.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Calendar size={42} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Special Dates Yet</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              Save your first relationship milestone, anniversary, or special memory.
            </Text>
            <Button
              title="+ Add First Special Date"
              onPress={handleOpenAddModal}
              variant="primary"
              size="sm"
              style={{ marginTop: 12 }}
            />
          </Card>
        ) : (
          dates.map((item) => {
            const dayCalc = calculateDaysText(item.date);

            return (
              <Card
                key={item.id}
                style={[
                  styles.dateCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.dateCardRow}>
                  {/* Heart Icon Badge */}
                  <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
                    <Heart size={20} color={colors.primary} fill={colors.primary} />
                  </View>

                  {/* Title and date text */}
                  <View style={styles.dateContent}>
                    <View style={styles.dateTitleRow}>
                      <Text style={[styles.dateTitle, { color: colors.text }]}>
                        {item.title}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setItemToDelete(item)}
                        style={styles.deleteBtn}
                      >
                        <Trash2 size={15} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.dateMetaRow}>
                      <View style={[styles.calendarBadge, { backgroundColor: colors.surfaceSubtle }]}>
                        <Calendar size={12} color={colors.textSecondary} />
                        <Text style={[styles.calendarText, { color: colors.textSecondary }]}>
                          {formatDateLabel(item.date)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.countdownBadge,
                          {
                            backgroundColor: dayCalc.isToday
                              ? '#34C759'
                              : dayCalc.isFuture
                              ? colors.primary
                              : colors.surfaceSubtle,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countdownText,
                            {
                              color: dayCalc.isToday || dayCalc.isFuture ? '#FFFFFF' : colors.textSecondary,
                            },
                          ]}
                        >
                          {dayCalc.text}
                        </Text>
                      </View>
                    </View>

                    {/* Romantic Notes */}
                    {item.notes ? (
                      <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                        &quot;{item.notes}&quot;
                      </Text>
                    ) : null}

                    {/* Added By Creator Badge */}
                    <View style={[styles.authorBadge, { backgroundColor: colors.surfaceSubtle }]}>
                      <User size={11} color={colors.primary} />
                      <Text style={[styles.authorText, { color: colors.textSecondary }]}>
                        {item.createdByName === user?.name || item.createdByName === 'You'
                          ? 'Added by You'
                          : `Added by ${item.createdByName || partner?.name || 'Partner'}`}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add Special Date Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#14141C' : '#FFFFFF', borderColor: colors.border }]}>
            {/* Top Grab Handle */}
            <View style={[styles.grabHandle, { backgroundColor: colors.border }]} />

            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Heart size={20} color={colors.primary} fill={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Add Special Date</Text>
                  <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                    Saved to MongoDB and shared with {partner?.name || 'your partner'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalBody}>
              {/* Quick Preset Date Suggestions */}
              <Text style={[styles.quickChipsLabel, { color: colors.textSecondary }]}>Quick Suggestions:</Text>
              <View style={styles.quickChipsRow}>
                {[
                  { label: 'Today 🎉', getDate: () => new Date().toISOString().split('T')[0] },
                  { label: 'Valentine’s Day 💖', getDate: () => `${new Date().getFullYear()}-02-14` },
                  { label: 'New Year 🎆', getDate: () => `${new Date().getFullYear() + 1}-01-01` },
                ].map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setDateStr(chip.getDate())}
                    style={[styles.quickChip, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                  >
                    <Text style={[styles.quickChipText, { color: colors.text }]}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Date Name / Milestone"
                placeholder="e.g. First Anniversary, Proposal, Birthday"
                value={title}
                onChangeText={setTitle}
              />

              <Input
                label="Date (YYYY-MM-DD)"
                placeholder="e.g. 2024-02-14"
                value={dateStr}
                onChangeText={setDateStr}
                maxLength={10}
              />

              <Input
                label="Romantic Notes & Memory (Optional)"
                placeholder="e.g. The day we met and promised forever"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <Button
                title="Save Special Date"
                onPress={handleSaveDate}
                loading={saving}
                variant="primary"
                size="lg"
                icon={<Heart size={18} color="#FFFFFF" fill="#FFFFFF" />}
                style={styles.saveBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Styled Delete Special Date Modal */}
      <StyledAlertModal
        visible={Boolean(itemToDelete)}
        type="delete"
        title="Delete Special Date?"
        message={`Remove "${itemToDelete?.title}" from your couple milestone calendar?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
        onClose={() => setItemToDelete(null)}
      />

      {/* Styled Feedback Modal */}
      <StyledAlertModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  lockBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    gap: 8,
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  dateCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  dateCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContent: {
    flex: 1,
  },
  dateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  deleteBtn: {
    padding: 4,
  },
  dateMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 2,
    marginBottom: 6,
  },
  calendarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  calendarText: {
    fontSize: 11,
    fontWeight: '600',
  },
  countdownBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 4,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  authorText: {
    fontSize: 10,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: '90%',
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSub: {
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
  modalBody: {
    padding: Spacing.lg,
  },
  quickChipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: Spacing.md,
  },
});
