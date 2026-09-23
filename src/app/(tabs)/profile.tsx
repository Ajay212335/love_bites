import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Image,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Heart,
  Moon,
  Bell,
  Sparkles,
  Calendar,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  UserPlus,
  Edit3,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/context/TaskContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StyledAlertModal, AlertModalType } from '@/components/ui/StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, partner, logout, updateUser } = useAuth();
  const { tasks, completedCount } = useTasks();

  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
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

  const handleSaveName = async () => {
    if (!newName.trim()) {
      showAlert('Name Required', 'Please enter a valid display name.', 'error');
      return;
    }
    await updateUser({ name: newName.trim() });
    setEditNameModalVisible(false);
    showAlert('Profile Updated! 🎉', `Your display name is now updated to ${newName.trim()}!`, 'success');
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile & Pair</Text>
        </View>

        {/* User Card */}
        <Card style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarBorder, { borderColor: colors.primary }]}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: '#800020' }]}>
                    <Text style={styles.avatarInitial}>
                      {user?.name ? user.name.charAt(0) : 'U'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setNewName(user?.name || '');
                    setEditNameModalVisible(true);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}
                >
                  <Text style={[styles.name, { color: colors.text }]}>
                    {user?.name || 'Your Account'}
                  </Text>
                  <Edit3 size={14} color={colors.primary} />
                </TouchableOpacity>
                <View
                  style={[
                    styles.pairedBadge,
                    { backgroundColor: partner ? colors.primary : colors.surfaceSubtle },
                  ]}
                >
                  <Text style={[styles.pairedBadgeText, { color: partner ? '#FFFFFF' : colors.textMuted }]}>
                    {partner ? 'Paired' : 'Single'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.email, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
              {user?.id && (
                <Text style={[styles.userIdText, { color: colors.textMuted }]}>
                  ID: {user.id}
                </Text>
              )}
              {partner && (
                <Text style={[styles.partnerNotice, { color: colors.primary }]}>
                  💖 Connected with {partner.name}
                </Text>
              )}
            </View>
          </View>

          {/* Stats Bar */}
          <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {tasks.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Daily Tasks
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {completedCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: partner ? colors.primary : colors.textMuted }]}>
                {partner ? 'Paired' : '1 / 2'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Partner Status
              </Text>
            </View>
          </View>
        </Card>

        {/* Partner Management Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Partner Connection</Text>
        <Card style={styles.partnerCard}>
          {partner ? (
            <View>
              <View style={styles.partnerDetailRow}>
                <View style={[styles.partnerIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Heart size={20} color={colors.primary} fill={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.partnerCardTitle, { color: colors.text }]}>
                    {partner.name}
                  </Text>
                  <Text style={[styles.partnerCardEmail, { color: colors.textSecondary }]}>
                    {partner.email}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/partner/add')}
                  style={[styles.manageBtn, { backgroundColor: colors.surfaceSubtle }]}
                >
                  <Text style={[styles.manageBtnText, { color: colors.text }]}>Manage</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noPartnerBox}>
              <Text style={[styles.noPartnerText, { color: colors.textSecondary }]}>
                No partner linked yet. Connect with email and password to share tasks!
              </Text>
              <Button
                title="+ Add Partner Account"
                onPress={() => router.push('/partner/add')}
                variant="primary"
                size="sm"
                icon={<UserPlus size={16} color="#FFFFFF" />}
                style={{ marginTop: 10 }}
              />
            </View>
          )}
        </Card>

        {/* Shared Couple Memories & Special Dates */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Shared Memories & Notes</Text>
        <Card style={styles.menuCard}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => router.push('/special-dates')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.primaryLight }]}>
                <Heart size={18} color={colors.primary} fill={colors.primary} />
              </View>
              <View>
                <Text style={[styles.menuText, { color: colors.text }]}>
                  Special Dates & Milestones
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                  Anniversaries, birthdays & private memories
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Notifications & Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences & Settings</Text>
        <Card style={styles.menuCard}>
          {/* Notification Center Trigger */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Bell size={18} color={colors.text} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>
                Notification Center Logs
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Dark Mode Toggle */}
          <View style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: colors.border }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <Moon size={18} color={colors.text} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Log Out */}
        <Card style={[styles.menuCard, { marginTop: Spacing.sm }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.menuItem}
            onPress={() => setLogoutModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.surfaceSubtle }]}>
                <LogOut size={18} color={colors.error} />
              </View>
              <Text style={[styles.menuText, { color: colors.error }]}>
                Log Out
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            Love Bites • Couple Tasks & Timed Reminders v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Edit Profile Name Modal */}
      <Modal
        visible={editNameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#14141C' : '#FFFFFF', borderColor: colors.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={[styles.modalIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Edit3 size={18} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Display Name</Text>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              This name will be shown on your couple tasks, profile, and email notifications.
            </Text>

            <TextInput
              style={[
                styles.nameInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Enter your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setEditNameModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.surfaceSubtle }]}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveName}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Name</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Styled Log Out Confirmation Modal */}
      <StyledAlertModal
        visible={logoutModalVisible}
        type="logout"
        title="Log Out of Love Bites?"
        message="Are you sure you want to log out? Your tasks, streaks, and memories remain safely saved in your couple cloud database."
        confirmText="Yes, Log Out"
        cancelText="Stay Logged In"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutModalVisible(false)}
        onClose={() => setLogoutModalVisible(false)}
      />

      {/* Styled General Alert Modal */}
      <StyledAlertModal
        visible={alertModal.visible}
        type={alertModal.type}
        title={alertModal.title}
        message={alertModal.message}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  profileCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  pairedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pairedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  email: {
    fontSize: 13,
  },
  userIdText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  partnerNotice: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  partnerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  partnerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  partnerCardEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  manageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noPartnerBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  noPartnerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  menuCard: {
    padding: 0,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  versionText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalBox: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  modalIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
});
