import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Heart,
  LogOut,
  Sparkles,
  X,
  UserX,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from './Button';
import { BorderRadius, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type AlertModalType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'logout'
  | 'delete'
  | 'unlink';

export interface StyledAlertModalProps {
  visible: boolean;
  type?: AlertModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose: () => void;
}

export const StyledAlertModal: React.FC<StyledAlertModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const { colors, isDark } = useTheme();

  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={32} color="#34C759" />,
          bgColor: 'rgba(52, 199, 89, 0.12)',
          borderColor: 'rgba(52, 199, 89, 0.3)',
        };
      case 'error':
        return {
          icon: <AlertCircle size={32} color="#FF3B30" />,
          bgColor: 'rgba(255, 59, 48, 0.12)',
          borderColor: 'rgba(255, 59, 48, 0.3)',
        };
      case 'logout':
        return {
          icon: <LogOut size={32} color="#FF3B30" />,
          bgColor: 'rgba(255, 59, 48, 0.12)',
          borderColor: 'rgba(255, 59, 48, 0.3)',
        };
      case 'delete':
        return {
          icon: <Trash2 size={32} color="#FF3B30" />,
          bgColor: 'rgba(255, 59, 48, 0.12)',
          borderColor: 'rgba(255, 59, 48, 0.3)',
        };
      case 'unlink':
        return {
          icon: <UserX size={32} color="#FF9500" />,
          bgColor: 'rgba(255, 149, 0, 0.12)',
          borderColor: 'rgba(255, 149, 0, 0.3)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={32} color="#FF9500" />,
          bgColor: 'rgba(255, 149, 0, 0.12)',
          borderColor: 'rgba(255, 149, 0, 0.3)',
        };
      case 'info':
      default:
        return {
          icon: <Heart size={32} color={colors.primary} fill={colors.primary} />,
          bgColor: colors.primaryLight,
          borderColor: 'rgba(255, 32, 78, 0.25)',
        };
    }
  };

  const iconConfig = getIconConfig();
  const isConfirmDialog = Boolean(onCancel || cancelText);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#161622' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Close Icon */}
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
          >
            <X size={16} color={colors.text} />
          </TouchableOpacity>

          {/* Icon Circle */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: iconConfig.bgColor,
                borderColor: iconConfig.borderColor,
              },
            ]}
          >
            {iconConfig.icon}
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {isConfirmDialog ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (onCancel) onCancel();
                    else onClose();
                  }}
                  style={[
                    styles.actionBtn,
                    styles.cancelBtn,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                    {cancelText || 'Cancel'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                  style={[
                    styles.actionBtn,
                    styles.confirmBtn,
                    {
                      backgroundColor:
                        type === 'logout' || type === 'delete'
                          ? '#FF3B30'
                          : colors.primary,
                    },
                  ]}
                >
                  <Text style={styles.confirmBtnText}>
                    {confirmText || 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Button
                title={confirmText || 'Got it'}
                onPress={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                variant="primary"
                size="md"
                style={{ width: '100%' }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: Spacing.xs,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {},
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
