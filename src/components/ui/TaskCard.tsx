import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  CheckCircle2,
  Circle,
  Clock,
  Send,
  Sparkles,
  Heart,
  Coffee,
  Moon,
  ChefHat,
  Smile,
  Trash2,
  Camera,
  Image as ImageIcon,
  X,
  Eye,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTasks } from '@/context/TaskContext';
import { useAuth } from '@/context/AuthContext';
import { DailyTask, TaskCategory } from '@/types';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';
import { StyledAlertModal, AlertModalType } from './StyledAlertModal';
import { BorderRadius, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TaskCardProps {
  task: DailyTask;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { colors, isDark } = useTheme();
  const {
    toggleTaskComplete,
    completeTaskWithPhoto,
    deleteTask,
    nudgePartner,
  } = useTasks();
  const { partner } = useAuth();

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nudging, setNudging] = useState(false);

  // Styled Alert Modals State
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [reopenConfirmVisible, setReopenConfirmVisible] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, type: AlertModalType = 'info') => {
    setAlertModal({ visible: true, title, message, type });
  };

  const isAssignedToPartner = task.assignedTo === 'partner';
  const canUserComplete = !isAssignedToPartner;

  const handlePickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permission Denied', 'Gallery permission is required to select a moment photo.', 'warning');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setSelectedPhotoUri(res.assets[0].uri);
      }
    } catch (e: any) {
      showAlert('Error', e?.message || 'Could not pick image', 'error');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showAlert('Permission Denied', 'Camera permission is required to take a photo.', 'warning');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setSelectedPhotoUri(res.assets[0].uri);
      }
    } catch (e: any) {
      showAlert('Error', e?.message || 'Could not take photo', 'error');
    }
  };

  const handleSubmitCompletion = async () => {
    if (!selectedPhotoUri) {
      showAlert(
        'Photo Required',
        `Please take or pick a moment photo proof before completing "${task.title}".`,
        'warning'
      );
      return;
    }

    setSubmitting(true);
    await completeTaskWithPhoto(task.id, selectedPhotoUri);
    setSubmitting(false);
    setDetailsModalVisible(false);
    setSelectedPhotoUri(null);

    showAlert(
      '🎉 Task Completed!',
      `Moment photo attached & shared with ${partner?.name || 'your partner'}!`,
      'success'
    );
  };

  const handleNudge = async () => {
    setNudging(true);
    const result = await nudgePartner(task.id);
    setNudging(false);

    showAlert(
      '💖 Nudge Sent!',
      result.message || `Notified ${partner?.name || 'Partner'} about "${task.title}" at ${task.time}!`,
      'info'
    );
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmVisible(false);
    setDetailsModalVisible(false);
    deleteTask(task.id);
  };

  const handleConfirmReopen = () => {
    setReopenConfirmVisible(false);
    setDetailsModalVisible(false);
    toggleTaskComplete(task.id);
  };

  const getCategoryIcon = (category: TaskCategory) => {
    const size = 14;
    const color = colors.primary;
    switch (category) {
      case 'morning':
        return <Coffee size={size} color={color} />;
      case 'night':
        return <Moon size={size} color={color} />;
      case 'cooking':
        return <ChefHat size={size} color={color} />;
      case 'fun':
        return <Smile size={size} color={color} />;
      case 'romance':
      default:
        return <Heart size={size} color={color} />;
    }
  };

  const getAssigneeLabel = () => {
    if (task.assignedTo === 'both') return 'Both of us';
    if (task.assignedTo === 'partner') return partner?.name || 'Partner';
    return 'For Me';
  };

  const formatAttachedTimestamp = (dateString?: string) => {
    const rawDate = dateString || (task as any).updatedAt || task.createdAt;
    if (!rawDate) {
      return task.time ? `Today, ${task.time}` : 'Today';
    }
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) {
        return task.time ? `Today, ${task.time}` : 'Today';
      }

      const now = new Date();
      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const timeStr = d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      if (isToday) {
        return `Today, ${timeStr}`;
      }

      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${dateStr}, ${timeStr}`;
    } catch {
      return task.time ? `Today, ${task.time}` : 'Today';
    }
  };

  const formattedUploadTime = formatAttachedTimestamp(task.completedAt);

  return (
    <>
      {/* Outside Card - Clean, minimal view with Timing and Task Name */}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setDetailsModalVisible(true)}
      >
        <Card
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            task.isCompleted && {
              backgroundColor: isDark ? '#111116' : '#F9FBF9',
              borderColor: 'rgba(52, 199, 89, 0.35)',
            },
          ]}
        >
          <View style={styles.cardContent}>
            {/* Completion Indicator */}
            <View style={styles.checkWrapper}>
              {task.isCompleted ? (
                <CheckCircle2 size={24} color="#34C759" fill="rgba(52, 199, 89, 0.15)" />
              ) : (
                <Circle size={24} color={colors.border} />
              )}
            </View>

            {/* Task Title & Time Only */}
            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text },
                  task.isCompleted && styles.completedTitle,
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>

              <View style={styles.metaRow}>
                {/* Time Badge */}
                <View style={[styles.timeBadge, { backgroundColor: colors.primaryLight }]}>
                  <Clock size={11} color={colors.primary} />
                  <Text style={[styles.timeText, { color: colors.primary }]}>
                    {task.time}
                  </Text>
                </View>

                {/* Category Badge */}
                <Badge
                  label={task.category.toUpperCase()}
                  variant="neutral"
                  icon={getCategoryIcon(task.category)}
                  style={styles.categoryBadge}
                />

                {/* Assignee Badge */}
                <Badge
                  label={getAssigneeLabel()}
                  variant={task.assignedTo === 'partner' ? 'primary' : 'secondary'}
                  style={styles.categoryBadge}
                />
              </View>
            </View>

            {/* Right arrow to open details */}
            <View style={styles.arrowWrapper}>
              <ChevronRight size={18} color={colors.textMuted} />
            </View>
          </View>

          {/* Prominent Attached Moment Photo Proof Banner with Upload Time directly on the card */}
          {task.photoUrl && (
            <View
              style={[
                styles.cardPhotoBanner,
                {
                  backgroundColor: isDark ? '#171724' : '#F3FAF5',
                  borderColor: isDark ? '#26263B' : '#CDEED6',
                },
              ]}
            >
              <Image source={{ uri: task.photoUrl }} style={styles.cardPhotoThumbnail} />
              <View style={styles.cardPhotoBannerInfo}>
                <View style={styles.cardPhotoBannerTop}>
                  <View style={[styles.cardPhotoTimeBadge, { backgroundColor: isDark ? '#232338' : '#E0F4E7' }]}>
                    <Clock size={10.5} color="#34C759" />
                    <Text style={styles.cardPhotoTimeText}>
                      Uploaded {formattedUploadTime}
                    </Text>
                  </View>
                  <Text style={[styles.cardPhotoViewHint, { color: colors.textMuted }]}>
                    View ➔
                  </Text>
                </View>
                <Text style={[styles.cardPhotoUploader, { color: colors.text }]} numberOfLines={1}>
                  📷 Photo by{' '}
                  <Text style={{ fontWeight: '700', color: colors.primary }}>
                    {task.attachedByName ||
                      task.completedByName ||
                      (isAssignedToPartner ? partner?.name || 'Partner' : 'You')}
                  </Text>
                </Text>
              </View>
            </View>
          )}
        </Card>
      </TouchableOpacity>

      {/* Task Details & Photo Completion Modal */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: isDark ? '#14141C' : '#FFFFFF', borderColor: colors.border }]}>
            {/* Top Grab Handle */}
            <View style={[styles.grabHandle, { backgroundColor: colors.border }]} />

            {/* Sheet Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={2}>
                  {task.title}
                </Text>
                <View style={styles.sheetHeaderMeta}>
                  <View style={[styles.timeBadge, { backgroundColor: colors.primaryLight }]}>
                    <Clock size={12} color={colors.primary} />
                    <Text style={[styles.timeText, { color: colors.primary }]}>{task.time}</Text>
                  </View>
                  <Badge
                    label={getAssigneeLabel()}
                    variant={task.assignedTo === 'partner' ? 'primary' : 'secondary'}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetBody}>
              {/* Description / Notes */}
              {task.description ? (
                <View style={[styles.descBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                  <Text style={[styles.descLabel, { color: colors.textSecondary }]}>Notes & Idea:</Text>
                  <Text style={[styles.descText, { color: colors.text }]}>{task.description}</Text>
                </View>
              ) : null}

              {/* Status Section */}
              {task.isCompleted ? (
                <View style={styles.completedSection}>
                  <View style={styles.completedBanner}>
                    <CheckCircle2 size={16} color="#34C759" />
                    <Text style={styles.completedBannerText}>
                      Completed by {task.completedByName || (isAssignedToPartner ? partner?.name || 'Partner' : 'You')}
                    </Text>
                  </View>

                  {/* Attached Photo View */}
                  {task.photoUrl && (
                    <View style={styles.photoContainer}>
                      <View style={styles.photoSectionHeaderRow}>
                        <Text style={[styles.sectionHeading, { color: colors.text, marginBottom: 0 }]}>
                          Attached Moment Photo
                        </Text>
                        {formattedUploadTime && (
                          <View style={[styles.timeTag, { backgroundColor: colors.surfaceSubtle }]}>
                            <Clock size={11} color={colors.primary} />
                            <Text style={[styles.timeTagText, { color: colors.textSecondary }]}>
                              {formattedUploadTime}
                            </Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setPhotoModalVisible(true)}
                        style={styles.photoPreviewCard}
                      >
                        <Image source={{ uri: task.photoUrl }} style={styles.modalTaskPhoto} />
                        
                        {/* Top Time Overlay on Preview */}
                        <View style={styles.photoTopBadge}>
                          <Clock size={11} color="#FFFFFF" />
                          <Text style={styles.photoTopBadgeText}>
                            {formattedUploadTime ? `Added ${formattedUploadTime}` : 'Photo Proof'}
                          </Text>
                        </View>

                        <View style={styles.photoOverlayBadge}>
                          <Eye size={12} color="#FFFFFF" />
                          <Text style={styles.photoOverlayText}>Tap to View Full Screen</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Clear Attribution Card */}
                      <View
                        style={[
                          styles.photoAttributionCard,
                          {
                            backgroundColor: isDark ? '#191924' : '#F9FBF9',
                            borderColor: isDark ? '#2D2D3E' : '#E2E8F0',
                          },
                        ]}
                      >
                        <Heart size={14} color={colors.primary} fill={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.photoAttributionText, { color: colors.text }]}>
                            Photo proof uploaded by{' '}
                            <Text style={{ fontWeight: '800', color: colors.primary }}>
                              {task.attachedByName ||
                                task.completedByName ||
                                (isAssignedToPartner ? partner?.name || 'Partner' : 'You')}
                            </Text>
                          </Text>
                          {formattedUploadTime && (
                            <Text style={[styles.photoAttributionSubText, { color: colors.textSecondary }]}>
                              🕒 Time: {formattedUploadTime}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => setReopenConfirmVisible(true)}
                    style={[styles.reopenBtn, { borderColor: colors.border }]}
                  >
                    <Text style={[styles.reopenBtnText, { color: colors.textMuted }]}>
                      Mark as Incomplete
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* Task is Pending */
                <View style={styles.pendingSection}>
                  {isAssignedToPartner ? (
                    /* Assigned to Partner */
                    <View style={[styles.partnerWaitCard, { backgroundColor: isDark ? '#1C1520' : '#FFF0F5', borderColor: 'rgba(255,32,78,0.2)' }]}>
                      <Clock size={20} color={colors.primary} />
                      <Text style={[styles.partnerWaitTitle, { color: colors.text }]}>
                        Assigned to {partner?.name || 'Partner'}
                      </Text>
                      <Text style={[styles.partnerWaitDesc, { color: colors.textSecondary }]}>
                        Only {partner?.name || 'your partner'} can complete this task and attach the moment photo proof.
                      </Text>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handleNudge}
                        disabled={nudging}
                        style={[styles.modalNudgeBtn, { backgroundColor: colors.primary }]}
                      >
                        <Send size={15} color="#FFFFFF" />
                        <Text style={styles.modalNudgeText}>
                          {nudging ? 'Sending...' : `Tell ${partner?.name ? partner.name.split(' ')[0] : 'Partner'}`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    /* Assigned to Me or Both - User can complete with photo */
                    <View style={styles.uploadSection}>
                      <Text style={[styles.sectionHeading, { color: colors.text }]}>
                        Attach Moment Photo to Complete:
                      </Text>

                      {selectedPhotoUri ? (
                        <View style={[styles.pickedPhotoContainer, { borderColor: colors.border }]}>
                          <Image source={{ uri: selectedPhotoUri }} style={styles.pickedPhoto} />
                          <View style={[styles.photoActionsRow, { backgroundColor: colors.surfaceSubtle }]}>
                            <TouchableOpacity
                              onPress={handleTakePhoto}
                              style={[styles.changeSmallBtn, { backgroundColor: colors.surfaceSubtle }]}
                            >
                              <Camera size={14} color={colors.primary} />
                              <Text style={[styles.changeSmallText, { color: colors.primary }]}>Retake</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={handlePickImage}
                              style={[styles.changeSmallBtn, { backgroundColor: colors.surfaceSubtle }]}
                            >
                              <ImageIcon size={14} color={colors.primary} />
                              <Text style={[styles.changeSmallText, { color: colors.primary }]}>Gallery</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => setSelectedPhotoUri(null)}
                              style={[styles.changeSmallBtn, { backgroundColor: 'rgba(255, 59, 48, 0.12)' }]}
                            >
                              <Trash2 size={14} color="#FF3B30" />
                              <Text style={[styles.changeSmallText, { color: '#FF3B30' }]}>Remove</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.photoButtonsGrid}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handlePickImage}
                            style={[styles.selectPhotoBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                          >
                            <ImageIcon size={22} color={colors.primary} />
                            <Text style={[styles.selectPhotoBtnText, { color: colors.text }]}>
                              Pick from Gallery
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleTakePhoto}
                            style={[styles.selectPhotoBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                          >
                            <Camera size={22} color={colors.primary} />
                            <Text style={[styles.selectPhotoBtnText, { color: colors.text }]}>
                              Take Photo
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Submit & Complete Button */}
                      <Button
                        title="Submit & Complete Task"
                        onPress={handleSubmitCompletion}
                        loading={submitting}
                        variant="primary"
                        size="lg"
                        icon={<Check size={18} color="#FFFFFF" />}
                        style={styles.submitCompleteBtn}
                      />
                    </View>
                  )}
                </View>
              )}

              {/* Bottom Actions */}
              <View style={styles.sheetFooter}>
                <TouchableOpacity onPress={() => setDeleteConfirmVisible(true)} style={styles.deleteLink}>
                  <Trash2 size={15} color="#FF3B30" />
                  <Text style={styles.deleteLinkText}>Delete Task</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Styled Delete Task Modal */}
      <StyledAlertModal
        visible={deleteConfirmVisible}
        type="delete"
        title="Delete Daily Task?"
        message={`Are you sure you want to remove "${task.title}" from your daily rituals?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmVisible(false)}
        onClose={() => setDeleteConfirmVisible(false)}
      />

      {/* Styled Reopen Task Modal */}
      <StyledAlertModal
        visible={reopenConfirmVisible}
        type="warning"
        title="Reopen Task?"
        message={`Mark "${task.title}" as incomplete for today?`}
        confirmText="Reopen"
        cancelText="Cancel"
        onConfirm={handleConfirmReopen}
        onCancel={() => setReopenConfirmVisible(false)}
        onClose={() => setReopenConfirmVisible(false)}
      />

      {/* Styled Feedback Modal */}
      <StyledAlertModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* Full-Screen Image Viewer Modal */}
      {task.photoUrl && (
        <Modal
          visible={photoModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.modalTaskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
                <Text style={styles.modalTaskMeta}>
                  Uploaded by{' '}
                  {task.attachedByName ||
                    task.completedByName ||
                    (isAssignedToPartner ? partner?.name || 'Partner' : 'You')}
                  {formattedUploadTime ? ` • ${formattedUploadTime}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPhotoModalVisible(false)}
              >
                <X size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalImageContainer}>
              <Image source={{ uri: task.photoUrl }} style={styles.modalFullImage} />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => setPhotoModalVisible(false)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  photoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  photoBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#34C759',
  },
  arrowWrapper: {
    paddingLeft: 4,
  },
  cardPhotoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    padding: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cardPhotoThumbnail: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#000000',
  },
  cardPhotoBannerInfo: {
    flex: 1,
    gap: 3,
  },
  cardPhotoBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardPhotoTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  cardPhotoTimeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#34C759',
  },
  cardPhotoViewHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardPhotoUploader: {
    fontSize: 12,
  },
  // Modal Sheet Styles
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
    maxHeight: SCREEN_HEIGHT * 0.88,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  sheetHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  descBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  completedSection: {
    gap: 12,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  completedBannerText: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '700',
  },
  photoContainer: {
    marginTop: 6,
    gap: 10,
  },
  photoSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  timeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  photoPreviewCard: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#23232F',
  },
  photoTopBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    zIndex: 2,
  },
  photoTopBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalTaskPhoto: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  photoOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  photoOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  photoAttributionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  photoAttributionText: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  photoAttributionSubText: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  reopenBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 8,
  },
  reopenBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pendingSection: {
    marginTop: 4,
  },
  partnerWaitCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 8,
  },
  partnerWaitTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  partnerWaitDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  modalNudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  modalNudgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadSection: {
    gap: 10,
  },
  photoButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  selectPhotoBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  selectPhotoBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickedPhotoContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#23232F',
    marginBottom: 6,
  },
  pickedPhoto: {
    width: '100%',
    height: 160,
    resizeMode: 'cover',
  },
  photoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 8,
    backgroundColor: '#161620',
  },
  changeSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  changeSmallText: {
    fontSize: 11,
    fontWeight: '700',
  },
  submitCompleteBtn: {
    marginTop: Spacing.sm,
  },
  sheetFooter: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  deleteLinkText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  // Full-screen viewer
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.62,
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
