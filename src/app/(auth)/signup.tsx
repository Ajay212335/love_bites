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
import { Mail, Lock, User, ChevronLeft, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StyledAlertModal, AlertModalType } from '@/components/ui/StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { sendOtp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    type: AlertModalType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string, type: AlertModalType = 'error') => {
    setAlertModal({ visible: true, title, message, type });
  };

  const handleRequestOtp = async () => {
    if (!name.trim()) {
      showAlert('Name Required', 'Please enter your full name.', 'warning');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showAlert('Valid Email Required', 'Please enter a valid email address.', 'warning');
      return;
    }
    if (!password || password.length < 6) {
      showAlert('Password Length', 'Password must be at least 6 characters long.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Password Mismatch', 'Passwords do not match. Please check and re-enter.', 'error');
      return;
    }

    setLoading(true);
    const result = await sendOtp(name.trim(), email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password,
        },
      });
    } else {
      showAlert('Sign Up Error', result.error || 'Could not send verification code.', 'error');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar with Back Chevron & Centered Logo */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <ChevronLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.logoCenter}>
              <Logo size={42} rounded />
            </View>
            <View style={{ width: 32 }} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Create <Text style={{ color: colors.primary }}>Account</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign up with your email to receive an instant verification OTP.
            </Text>
          </View>

          {/* 3-Step Progress Indicator */}
          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberActive}>1</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.primary }]}>Details</Text>
            </View>

            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.stepNumberInactive, { color: colors.textMuted }]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>OTP Verify</Text>
            </View>

            <View style={[styles.stepLine, { backgroundColor: colors.border }]} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border, borderWidth: 1 }]}>
                <Text style={[styles.stepNumberInactive, { color: colors.textMuted }]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>Complete</Text>
            </View>
          </View>

          {/* Inputs */}
          <View style={styles.form}>
            <Input
              label="Your Full Name"
              placeholder="e.g. Alex Rivera"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon={<User size={18} color={colors.textMuted} />}
            />

            <Input
              label="Email Address"
              placeholder="alex@lovebites.app"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password (min 6 characters)"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={<Lock size={18} color={colors.textMuted} />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title="Submit"
              onPress={handleRequestOtp}
              loading={loading}
              variant="primary"
              size="lg"
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              iconPosition="right"
              style={styles.submitBtn}
            />

            {/* Switch to Login */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/login')}
              style={styles.toggleRow}
            >
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                Already have an account?
              </Text>
              <Text style={[styles.toggleLink, { color: colors.primary }]}>
                {' '}Log In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Styled Alert Modal */}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  logoCenter: {
    alignItems: 'center',
  },
  backBtn: {
    padding: Spacing.xs,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'left',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'left',
    lineHeight: 18,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stepNumberInactive: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  infoBadgeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  form: {
    marginTop: Spacing.xs,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  toggleText: {
    fontSize: 14,
  },
  toggleLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
