import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, ArrowRight, RefreshCw, ChevronLeft, Mail, Inbox } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { StyledAlertModal, AlertModalType } from '@/components/ui/StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { verifyOtp, sendOtp } = useAuth();
  const params = useLocalSearchParams<{
    email: string;
    name: string;
    password?: string;
  }>();

  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
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

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newValues = [...otpValues];

    if (cleaned.length > 1) {
      // Handle paste of 6-digit code
      const pasted = cleaned.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newValues[i] = pasted[i] || '';
      }
      setOtpValues(newValues);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }

    newValues[index] = cleaned;
    setOtpValues(newValues);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otpValues.join('');
    if (enteredOtp.length !== 6) {
      showAlert('Incomplete Code', 'Please enter the full 6-digit verification code sent to your email.', 'warning');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(params.email, enteredOtp, params.name, params.password);
    setLoading(false);

    if (result.success) {
      showAlert(
        'Verified & Activated! 🎉',
        `Welcome to Love Bites, ${params.name || 'Foodie'}! Your email is verified and your account is ready.`,
        'success',
        () => router.replace('/(tabs)')
      );
    } else {
      showAlert(
        'Verification Failed',
        result.error || 'Invalid or expired OTP code. Please check your email and try again.',
        'error'
      );
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    const result = await sendOtp(params.name, params.email, params.password);
    setResending(false);

    if (result.success) {
      setTimer(60);
      showAlert(
        'OTP Dispatched! ✉️',
        `A fresh 6-digit verification code has been sent to ${params.email}. Please check your inbox or spam folder.`,
        'info'
      );
    } else {
      showAlert('Resend Failed', result.error || 'Could not resend code. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top Bar */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <ShieldCheck size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Check Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a 6-digit security code to
            </Text>
            <View style={styles.emailBadge}>
              <Mail size={14} color={colors.primary} />
              <Text style={[styles.emailText, { color: colors.primary }]}>{params.email}</Text>
            </View>
          </View>

          {/* Inbox Notice Card */}
          <View
            style={[
              styles.inboxNotice,
              { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
            ]}
          >
            <Inbox size={18} color={colors.primary} />
            <Text style={[styles.inboxNoticeText, { color: colors.textSecondary }]}>
              Please check your email inbox (and spam/junk folder). Enter the 6-digit verification code below to verify your account.
            </Text>
          </View>

          {/* 6-Digit OTP Inputs */}
          <View style={styles.otpInputsContainer}>
            {otpValues.map((val, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => {
                  inputRefs.current[idx] = ref;
                }}
                value={val}
                onChangeText={(text) => handleOtpChange(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                style={[
                  styles.otpBox,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: val ? colors.primary : colors.border,
                    color: colors.text,
                  },
                ]}
              />
            ))}
          </View>

          {/* Verify Button */}
          <Button
            title="Sumbit"
            onPress={handleVerify}
            loading={loading}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            iconPosition="right"
            style={styles.verifyBtn}
          />

          {/* Resend Timer */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn&apos;t receive code?
            </Text>
            <TouchableOpacity
              disabled={timer > 0 || resending}
              onPress={handleResend}
              style={styles.resendButton}
            >
              <RefreshCw
                size={14}
                color={timer > 0 ? colors.textMuted : colors.primary}
              />
              <Text
                style={[
                  styles.resendAction,
                  { color: timer > 0 ? colors.textMuted : colors.primary },
                ]}
              >
                {timer > 0 ? ` Resend in ${timer}s` : ' Resend Code'}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xxl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  emailText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inboxNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginVertical: Spacing.sm,
  },
  inboxNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  otpInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: Spacing.lg,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  verifyBtn: {
    marginTop: Spacing.sm,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.xl,
  },
  resendText: {
    fontSize: 13,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendAction: {
    fontSize: 13,
    fontWeight: '700',
  },
});
