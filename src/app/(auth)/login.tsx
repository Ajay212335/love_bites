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
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StyledAlertModal, AlertModalType } from '@/components/ui/StyledAlertModal';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, login } = useAuth();

  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async () => {
    if (!email.trim()) {
      showAlert('Email Required', 'Please enter your registered email address.', 'warning');
      return;
    }
    if (!password) {
      showAlert('Password Required', 'Please enter your password.', 'warning');
      return;
    }

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      showAlert(
        'Login Failed',
        result.error || 'Invalid email or password. Please check your credentials and try again.',
        'error'
      );
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
          <View style={{ height: Spacing.md }} />

          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoWrapper}>
              <Logo size={92} rounded />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Log In to <Text style={{ color: colors.primary }}>Love Bites</Text>
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Welcome back! Sign in to continue to your couple tasks and romantic moments.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="you@lovebites.app"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={colors.textMuted} />}
            />

            <Input
              label="Password"
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

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="lg"
              icon={<LogIn size={18} color="#FFFFFF" />}
              style={styles.submitBtn}
            />

            {/* Switch to Sign Up with OTP */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/(auth)/signup')}
              style={styles.toggleRow}
            >
              <Text style={[styles.toggleText, { color: colors.textSecondary }]}>
                Don&apos;t have an account yet?
              </Text>
              <Text style={[styles.toggleLink, { color: colors.primary }]}>
                {' '}Sign Up
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
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  logoWrapper: {
    padding: 6,
    borderRadius: 56,
    backgroundColor: 'rgba(255, 32, 78, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 32, 78, 0.25)',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
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
