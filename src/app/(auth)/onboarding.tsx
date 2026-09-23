import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Utensils, Heart, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Culinary Sparks For Two',
    description: 'Discover the most intimate romantic dinners, hidden rooftop fondues, and cozy candlelit cafés.',
    icon: Utensils,
  },
  {
    id: '2',
    title: 'Match Your Tastes',
    description: 'Pair your flavor preferences together to generate personalized date night suggestions with 99% taste compatibility.',
    icon: Sparkles,
  },
  {
    id: '3',
    title: 'Cherish Every Bite',
    description: 'Save favorite spots, plan unforgettable memories, and keep your couple culinary bucket list alive.',
    icon: Heart,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar with Logo & Skip Button */}
      <View style={styles.topBar}>
        <View style={styles.topBarLogoWrapper}>
          <Logo size={42} rounded />
        </View>
        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <FlatList
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const IconComponent = item.icon;
          return (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <IconComponent size={56} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            </View>
          );
        }}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex ? colors.primary : colors.border,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {currentIndex === SLIDES.length - 1 ? (
          <Button
            title="Get Started with Love Bites"
            onPress={handleFinish}
            variant="primary"
            size="lg"
            style={styles.actionBtn}
          />
        ) : (
          <Button
            title="Next"
            onPress={() => setCurrentIndex((prev) => Math.min(prev + 1, SLIDES.length - 1))}
            variant="primary"
            size="lg"
            icon={<ChevronRight size={18} color="#FFFFFF" />}
            iconPosition="right"
            style={styles.actionBtn}
          />
        )}
      </View>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  topBarLogoWrapper: {
    padding: 2,
  },
  skipBtn: {
    padding: Spacing.xs,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomControls: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actionBtn: {
    width: '100%',
  },
});
