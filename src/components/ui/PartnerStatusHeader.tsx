import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, UserPlus, Sparkles } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';

export const PartnerStatusHeader: React.FC = () => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, partner } = useAuth();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.pairRow}>
        {/* Current User Avatar */}
        <View style={styles.avatarGroup}>
          <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: '#800020' }]}>
                <Text style={styles.fallbackText}>
                  {user?.name ? user.name.charAt(0) : 'U'}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
            {user?.name ? user.name.split(' ')[0] : 'You'}
          </Text>
        </View>

        {/* Heart Connector */}
        <View style={styles.connector}>
          <View style={[styles.heartCircle, { backgroundColor: colors.primary }]}>
            <Heart size={16} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>

        {/* Partner Avatar or Add Partner Button */}
        {partner ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/partner/add')}
            style={styles.avatarGroup}
          >
            <View style={[styles.avatarWrapper, { borderColor: colors.primary }]}>
              {partner.avatarUrl ? (
                <Image source={{ uri: partner.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: '#C40C30' }]}>
                  <Text style={styles.fallbackText}>
                    {partner.name ? partner.name.charAt(0) : 'P'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {partner.name.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/partner/add')}
            style={styles.avatarGroup}
          >
            <View style={[styles.addPartnerCircle, { borderColor: colors.primary, backgroundColor: colors.surface }]}>
              <UserPlus size={18} color={colors.primary} />
            </View>
            <Text style={[styles.addPartnerText, { color: colors.primary }]}>
              + Add Partner
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {partner ? (
        <View style={styles.statusFooter}>
          <Sparkles size={13} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Paired with {partner.name} • Shared Tasks Active
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/partner/add')}
          style={styles.invitePrompt}
        >
          <Text style={[styles.invitePromptText, { color: colors.primary }]}>
            Link with your partner by Email & Password to share daily tasks ✨
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  avatarGroup: {
    alignItems: 'center',
    width: 80,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userName: {
    fontSize: 12,
    fontWeight: '700',
  },
  connector: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addPartnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addPartnerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 51, 102, 0.15)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  invitePrompt: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 51, 102, 0.15)',
    alignItems: 'center',
  },
  invitePromptText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
