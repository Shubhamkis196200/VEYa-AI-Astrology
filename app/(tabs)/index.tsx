import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Pressable,
  Modal,
  InteractionManager,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AstroStories from '@/components/stories/AstroStories';
import { StoryViewer } from '@/components/stories/StoryViewer';
import Animated from 'react-native-reanimated';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useReadingStore } from '@/stores/readingStore';
import { useStreakStore } from '@/stores/streakStore';
import { useUserStore } from '@/stores/userStore';
import type { ZodiacSign } from '@/types';
import OneInsightCard from '@/components/home/OneInsightCard';
import DoAndDontCard from '@/components/home/DoAndDontCard';
import CosmicWeatherWidget from '@/components/home/CosmicWeatherWidget';
import VoiceInterface from '@/components/voice/VoiceInterface';
import { getMoonPhase } from '@/services/astroEngine';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Quiet hours';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Sweet night';
}

function getDateDisplay(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();
  const { generatedReading, ensureGeneratedReading, isLoading: readingLoading } = useReadingStore();
  const { currentStreak, isLoading: streakLoading, performCheckIn, loadStreak } = useStreakStore();
  const { user } = useUserStore();

  const [showVoice, setShowVoice] = useState(false);
  const [showDeferred, setShowDeferred] = useState(false);
  const [currentMoon, setCurrentMoon] = useState<{ name: string; emoji: string } | undefined>(undefined);

  const userId = user?.user_id || 'demo-user-001';
  const sunSign: ZodiacSign = (data?.sunSign as ZodiacSign) || 'Scorpio';

  useEffect(() => {
    const timer = setTimeout(() => setShowDeferred(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showDeferred) return;
    try {
      const moon = getMoonPhase(new Date());
      setCurrentMoon({ name: moon.phaseName, emoji: moon.emoji });
    } catch {
      // silent
    }
  }, [showDeferred]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        await ensureGeneratedReading(sunSign);
      } catch (e) {
        console.warn('[Reading] error', e);
      }
    });
    return () => task.cancel();
  }, [ensureGeneratedReading, sunSign]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        await loadStreak(userId);
        await performCheckIn(userId);
      } catch {
        // silent
      }
    });
    return () => task.cancel();
  }, [loadStreak, performCheckIn, userId]);

  const greeting = useMemo(() => getGreeting(), []);
  const dateDisplay = useMemo(() => getDateDisplay(), []);
  const r = generatedReading;

  const handleOpenVoice = useCallback(() => {
    setShowVoice(true);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />

      <Modal visible={showVoice} animationType="slide" presentationStyle="fullScreen" transparent={false}>
        <VoiceInterface onClose={() => setShowVoice(false)} />
      </Modal>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting}, {data?.name || 'Star Child'} ☉</Text>
            <Text style={styles.subtitle}>{dateDisplay} · {sunSign}</Text>
          </View>
          {!streakLoading && currentStreak > 0 && (
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 {currentStreak}</Text>
            </View>
          )}
        </View>

        {/* ── STORIES ────────────────────────────────────────────── */}
        <AstroStories />

        {/* ── HERO: ONE INSIGHT CARD ─────────────────────────────── */}
        <Animated.View style={styles.heroCard}>
          <OneInsightCard />
        </Animated.View>

        {/* Loading state */}
        {readingLoading && !r && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.loadingText}>Consulting the stars...</Text>
          </View>
        )}

        {/* ── COMPACT INFO ROW: moon + energy ────────────────────── */}
        {showDeferred && (currentMoon || r) && (
          <View style={styles.compactRow}>
            {currentMoon && (
              <View style={styles.moonPill}>
                <Text style={styles.moonPillEmoji}>{currentMoon.emoji}</Text>
                <Text style={styles.moonPillName}>{currentMoon.name}</Text>
              </View>
            )}
            {r && (
              <View style={styles.energyPill}>
                <Text style={styles.energyPillLabel}>⚡ Energy</Text>
                <Text style={styles.energyPillScore}>{r.energyScore}<Text style={styles.energyPillMax}>/10</Text></Text>
              </View>
            )}
          </View>
        )}

        {/* ── COSMIC WEATHER ─────────────────────────────────────── */}
        <CosmicWeatherWidget />

        {/* ── DO'S & DON'TS ──────────────────────────────────────── */}
        {showDeferred && r?.dos && r?.donts && (
          <DoAndDontCard dos={r.dos.slice(0, 2)} donts={r.donts.slice(0, 2)} />
        )}

        {/* ── TALK TO VEYA CTA ───────────────────────────────────── */}
        <Pressable onPress={handleOpenVoice} style={({ pressed }) => [styles.ctaWrapper, { opacity: pressed ? 0.9 : 1 }]}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9', '#5B21B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.talkCard}
          >
            <View style={styles.talkCardContent}>
              <View style={styles.talkMicWrapper}>
                <Ionicons name="mic" size={26} color="#FFFFFF" />
              </View>
              <View style={styles.talkCardText}>
                <Text style={styles.talkCardTitle}>Talk to VEYa ✨</Text>
                <Text style={styles.talkCardSubtitle}>Your AI astrologer is ready</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.65)" />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>

      <StoryViewer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  greeting: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textMuted,
    marginBottom: 16,
  },
  streakPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 4,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },

  // Hero card spacing
  heroCard: {
    marginTop: 12,
    marginBottom: 16,
  },

  // Loading
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212,165,71,0.12)',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },

  // Compact info row
  compactRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  moonPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.15)',
  },
  moonPillEmoji: {
    fontSize: 20,
  },
  moonPillName: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
    flexShrink: 1,
  },
  energyPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
  },
  energyPillLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  energyPillScore: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#A78BFA',
  },
  energyPillMax: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: colors.textMuted,
  },

  // Talk to VEYa CTA
  ctaWrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  talkCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  talkCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  talkMicWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  talkCardText: {
    flex: 1,
    marginLeft: 14,
  },
  talkCardTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  talkCardSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
});
