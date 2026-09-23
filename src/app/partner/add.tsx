import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus, Mail, Lock, User, Heart, ChevronLeft, Sparkles, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StyledAlertModal, AlertModalType } from '@/components/ui/StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function AddPartnerScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { addPartner, user, partner, unlinkPartner } = useAuth();

  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [showPartnerPassword, setShowPartnerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unlinkConfirmVisible, setUnlinkConfirmVisible] = useState(false);
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

  const handleAddPartner = async () => {
    if (!partnerEmail.trim() || !partnerEmail.includes('@')) {
      showAlert('Email Required', 'Please enter a valid email address for your partner.', 'warning');
      return;
    }
    if (!partnerPassword || partnerPassword.length < 6) {
      showAlert('Password Required', 'Please set a password of at least 6 characters for the partner account.', 'warning');
      return;
    }

    setLoading(true);
    const result = await addPartner(partnerEmail, partnerPassword, partnerName);
    setLoading(false);

    if (result.success) {
      showAlert(
        'Partner Linked! 💖',
        `Successfully connected with ${partnerName || partnerEmail}! An invitation email has been sent to ${partnerEmail} notifying them that you linked them as your partner.`,
        'success',
        () => router.back()
      );
    } else {
      showAlert('Failed to Link', result.error || 'Could not add partner.', 'error');
    }
  };

  const handleConfirmUnlink = async () => {
    setUnlinkConfirmVisible(false);
    await unlinkPartner();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.screenTitle, { color: colors.text }]}>
              {partner ? 'Manage Partner' : 'Add Partner'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* If already linked, display partner status card */}
          {partner && (
            <Card style={styles.linkedCard}>
              <View style={styles.linkedHeader}>
                <View style={[styles.linkedIconBox, { backgroundColor: colors.primaryLight }]}>
                  <Heart size={24} color={colors.primary} fill={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.linkedTitle, { color: colors.text }]}>
                    Currently Paired With
                  </Text>
                  <Text style={[styles.linkedName, { color: colors.primary }]}>
                    {partner.name}
                  </Text>
                  <Text style={[styles.linkedEmail, { color: colors.textSecondary }]}>
                    {partner.email}
                  </Text>
                </View>
              </View>

              <View style={[styles.syncStatus, { borderTopColor: colors.border }]}>
                <ShieldCheck size={16} color={colors.success} />
                <Text style={[styles.syncText, { color: colors.textSecondary }]}>
                  Shared Tasks & Notifications Active
                </Text>
              </View>

              <Button
                title="Unlink Partner"
                onPress={() => setUnlinkConfirmVisible(true)}
                variant="outline"
                size="sm"
                style={styles.unlinkBtn}
              />
            </Card>
          )}

          {/* Add / Link Form Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <UserPlus size={36} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              {partner ? 'Link Another Partner Account' : 'Connect Your Partner'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your partner&apos;s email ID. Once linked, an automated partner notification email will be sent to their inbox, and both of you can assign daily tasks and send each other timed reminders.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Partner's Name"
              placeholder="e.g. Maya Chen"
              value={partnerName}
              onChangeText={setPartnerName}
              autoCapitalize="words"
              leftIcon={<User size={18} color={colors.textMuted} />}
            />

            <Input
              label="Partner's Email ID"
              placeholder="partner@lovebites.app"
              keyboardType="email-address"
              autoCapitalize="none"
              value={partnerEmail}
              onChangeText={setPartnerEmail}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <Input
              label="Partner's Account Password"
              placeholder="••••••••"
              secureTextEntry={!showPartnerPassword}
              value={partnerPassword}
              onChangeText={setPartnerPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPartnerPassword(!showPartnerPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  {showPartnerPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title="Add & Link Partner"
              onPress={handleAddPartner}
              loading={loading}
              variant="primary"
              size="lg"
              icon={<Sparkles size={18} color="#FFFFFF" />}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Styled Unlink Confirmation Modal */}
      <StyledAlertModal
        visible={unlinkConfirmVisible}
        type="unlink"
        title="Unlink Partner Account?"
        message={`Are you sure you want to disconnect from ${partner?.name || 'your partner'}? You will no longer share tasks and reminders.`}
        confirmText="Yes, Unlink"
        cancelText="Cancel"
        onConfirm={handleConfirmUnlink}
        onCancel={() => setUnlinkConfirmVisible(false)}
        onClose={() => setUnlinkConfirmVisible(false)}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  linkedCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  linkedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkedIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  linkedName: {
    fontSize: 16,
    fontWeight: '700',
  },
  linkedEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  syncText: {
    fontSize: 12,
  },
  unlinkBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  form: {
    marginTop: Spacing.sm,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
});
