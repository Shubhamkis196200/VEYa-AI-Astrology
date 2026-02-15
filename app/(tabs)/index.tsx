/**
 * VEYa — Today Tab (Home) — REDESIGNED FOR DISCOVERABILITY
 * 
 * Phase 2 Update: Navigation & Feature Discovery
 * 
 * Design Principles (inspired by Co-Star, The Pattern, Sanctuary):
 * - Every feature visible in 2 taps max
 * - Clear section headers with icons
 * - Visual feature cards with clear labels
 * - Quick actions grid for frequent tasks
 */
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Pressable,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
} from 'react-native-reanimated';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useReadingStore } from '@/stores/readingStore';
import { useStreakStore } from '@/stores/streakStore';
import type { ZodiacSign } from '@/types';
import OneInsightCard from '@/components/home/OneInsightCard';
import DailyBriefingCard from '@/components/home/DailyBriefingCard';
import StreakCounter from '@/components/home/StreakCounter';
import EnergyMeter from '@/components/home/EnergyMeter';
import DoAndDontCard from '@/components/home/DoAndDontCard';
import TransitHighlights from '@/components/home/TransitHighlights';
import CosmicWeatherWidget from '@/components/home/CosmicWeatherWidget';
import DailyAffirmation from '@/components/home/DailyAffirmation';
import ShareableCard from '@/components/shared/ShareableCard';
import VoiceInterface from '@/components/voice/VoiceInterface';
import AstroStories from '@/components/stories/AstroStories';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { shareReading, captureAndShare } from '@/services/shareService';
import { getMoonPhase } from '@/services/astroEngine';
import MomentCaptureButton from '@/components/shared/MomentCaptureButton';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// ═══════════════════════════════════════════════════════════════
// FEATURE DISCOVERY CARDS — Quick access to all features
// ═══════════════════════════════════════════════════════════════

interface QuickFeatureProps {
  icon: string;
  label: string;
  sublabel?: string;
  gradient: readonly [string, string];
  onPress: () => void;
  delay?: number;
}

function QuickFeatureCard({ icon, label, sublabel, gradient, onPress, delay = 0 }: QuickFeatureProps) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(delay)} style={styles.quickFeatureWrapper}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.quickFeatureCard, { opacity: pressed ? 0.9 : 1 }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.quickFeatureGradient}
        >
          <Text style={styles.quickFeatureIcon}>{icon}</Text>
          <Text style={styles.quickFeatureLabel}>{label}</Text>
          {sublabel && <Text style={styles.quickFeatureSublabel}>{sublabel}</Text>}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER — Consistent styling
// ═══════════════════════════════════════════════════════════════

interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

function SectionHeader({ icon, title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {action && (
        <Pressable onPress={action.onPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action.label} →</Text>
        </Pressable>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURE HUB — Grid of all features
// ═══════════════════════════════════════════════════════════════

interface FeatureHubProps {
  onOpenVoice: () => void;
  moonPhase?: { name: string; emoji: string };
}

function FeatureHub({ onOpenVoice, moonPhase }: FeatureHubProps) {
  const navigateToDiscover = (section?: string) => {
    // Navigate to discover tab with optional section scroll
    router.push('/(tabs)/discover');
  };

  const navigateToChat = () => {
    router.push('/(tabs)/chat');
  };

  const navigateToProfile = () => {
    router.push('/(tabs)/you');
  };

  return (
    <Animated.View entering={FadeIn.duration(500).delay(200)} style={styles.featureHub}>
      <SectionHeader
        icon="✨"
        title="Explore VEYa"
        subtitle="Tap any feature to dive in"
      />
      
      {/* Row 1: Voice & Chat */}
      <View style={styles.featureRow}>
        <QuickFeatureCard
          icon="🎙️"
          label="Talk to VEYa"
          sublabel="Voice AI"
          gradient={['#8B5CF6', '#6D28D9']}
          onPress={onOpenVoice}
          delay={100}
        />
        <QuickFeatureCard
          icon="💬"
          label="AI Chat"
          sublabel="Ask anything"
          gradient={['#6366F1', '#4F46E5']}
          onPress={navigateToChat}
          delay={150}
        />
      </View>

      {/* Row 2: Chart & Tarot */}
      <View style={styles.featureRow}>
        <QuickFeatureCard
          icon="⭐"
          label="Birth Chart"
          sublabel="Your blueprint"
          gradient={['#D4A547', '#B8860B']}
          onPress={() => navigateToDiscover('chart')}
          delay={200}
        />
        <QuickFeatureCard
          icon="🃏"
          label="Daily Tarot"
          sublabel="Pull a card"
          gradient={['#9333EA', '#7C3AED']}
          onPress={() => navigateToDiscover('tarot')}
          delay={250}
        />
      </View>

      {/* Row 3: Moon & Compatibility */}
      <View style={styles.featureRow}>
        <QuickFeatureCard
          icon={moonPhase?.emoji || "🌙"}
          label="Moon Phase"
          sublabel={moonPhase?.name || "Track tonight"}
          gradient={['#1E3A5F', '#2D4A6F']}
          onPress={() => navigateToDiscover('moon')}
          delay={300}
        />
        <QuickFeatureCard
          icon="💕"
          label="Compatibility"
          sublabel="Match signs"
          gradient={['#EC4899', '#DB2777']}
          onPress={() => navigateToDiscover('compatibility')}
          delay={350}
        />
      </View>

      {/* Row 4: Transits & Journal */}
      <View style={styles.featureRow}>
        <QuickFeatureCard
          icon="📅"
          label="Transits"
          sublabel="Cosmic calendar"
          gradient={['#059669', '#047857']}
          onPress={() => navigateToDiscover('transits')}
          delay={400}
        />
        <QuickFeatureCard
          icon="📔"
          label="Journal"
          sublabel="Reflect & grow"
          gradient={['#F59E0B', '#D97706']}
          onPress={navigateToProfile}
          delay={450}
        />
      </View>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUICK ACTIONS BAR — Most used features
// ═══════════════════════════════════════════════════════════════

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

function QuickAction({ icon, label, onPress, color = '#8B5CF6' }: QuickActionProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.8 : 1 }]}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function QuickActionsBar({ onOpenVoice }: { onOpenVoice: () => void }) {
  return (
    <Animated.View entering={FadeInRight.duration(400).delay(100)} style={styles.quickActionsBar}>
      <QuickAction
        icon="mic"
        label="Voice"
        onPress={onOpenVoice}
        color="#8B5CF6"
      />
      <QuickAction
        icon="moon"
        label="Moon"
        onPress={() => router.push('/(tabs)/discover')}
        color="#1E3A5F"
      />
      <QuickAction
        icon="layers"
        label="Tarot"
        onPress={() => router.push('/(tabs)/discover')}
        color="#9333EA"
      />
      <QuickAction
        icon="heart"
        label="Match"
        onPress={() => router.push('/(tabs)/discover')}
        color="#EC4899"
      />
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();
  const { generatedReading, ensureGeneratedReading, isLoading: readingLoading } = useReadingStore();
  const { currentStreak, isLoading: streakLoading, performCheckIn, loadStreak } = useStreakStore();

  const [showVoice, setShowVoice] = useState(false);
  const shareRef = useRef<ViewShot | null>(null);

  const demoUserId = 'demo-user-001';
  const sunSign: ZodiacSign = (data?.sunSign as ZodiacSign) || 'Scorpio';

  const currentMoon = useMemo(() => {
    const moon = getMoonPhase(new Date());
    return { name: moon.phaseName, emoji: moon.emoji };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await ensureGeneratedReading(sunSign);
      } catch (e) {
        console.warn('[Reading] error', e);
      }
    })();
  }, [ensureGeneratedReading, sunSign]);

  useEffect(() => {
    (async () => {
      try {
        await loadStreak(demoUserId);
        await performCheckIn(demoUserId);
      } catch {
        // Silent fail
      }
    })();
  }, [loadStreak, performCheckIn]);

  const greeting = useMemo(() => getGreeting(), []);
  const dateDisplay = useMemo(() => getDateDisplay(), []);
  const r = generatedReading;

  const shareData = useMemo(() => (r ? shareReading(r, sunSign) : null), [r, sunSign]);

  const handleShare = useCallback(async () => {
    if (!shareData) return;
    const success = await captureAndShare(shareRef);
    if (!success) {
      Alert.alert('Share failed', 'Unable to share this card right now. Please try again.');
    }
  }, [shareData]);

  const handleOpenVoice = useCallback(async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Mic needed', 'Please enable microphone access');
        return;
      }
      setShowVoice(true);
    } catch {
      Alert.alert('Mic needed', 'Please enable microphone access');
    }
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <StatusBar style="dark" />
      
      {/* Hidden share view */}
      {shareData && (
        <ViewShot ref={shareRef} style={styles.shareShot}>
          <ShareableCard
            title={shareData.title}
            body={shareData.body}
            signName={shareData.signName}
            date={shareData.date}
          />
        </ViewShot>
      )}

      {/* Voice Interface Modal */}
      <Modal visible={showVoice} animationType="slide" presentationStyle="fullScreen">
        <VoiceInterface onClose={() => setShowVoice(false)} />
      </Modal>

      {/* Story Viewer Modal */}
      <StoryViewer />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ─────────────────────────────────────────────────────────── */}
        {/* HEADER SECTION */}
        {/* ─────────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={styles.greeting}>{greeting}, {data?.name || 'Star Child'} ☉</Text>
          <Text style={styles.subtitle}>{dateDisplay} · {sunSign}</Text>
        </Animated.View>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* QUICK ACTIONS BAR — Most used features at top */}
        {/* ─────────────────────────────────────────────────────────── */}
        <QuickActionsBar onOpenVoice={handleOpenVoice} />

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ASTRO STORIES — Instagram-style daily content */}
        {/* ─────────────────────────────────────────────────────────── */}
        <AstroStories />

        {/* ─────────────────────────────────────────────────────────── */}
        {/* STREAK & ENGAGEMENT */}
        {/* ─────────────────────────────────────────────────────────── */}
        <StreakCounter currentStreak={currentStreak} isLoading={streakLoading} />

        {/* ─────────────────────────────────────────────────────────── */}
        {/* HERO SECTION — Talk to VEYa CTA */}
        {/* ─────────────────────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Pressable onPress={handleOpenVoice} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9', '#5B21B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.talkCard}
            >
              <View style={styles.talkCardContent}>
                <Ionicons name="mic" size={28} color="#FFFFFF" />
                <View style={styles.talkCardText}>
                  <Text style={styles.talkCardTitle}>Talk to VEYa ✨</Text>
                  <Text style={styles.talkCardSubtitle}>Your AI astrologer is ready to chat</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TODAY'S INSIGHT SECTION */}
        {/* ─────────────────────────────────────────────────────────── */}
        <SectionHeader
          icon="🌟"
          title="Today's Insight"
          subtitle="Your personalized cosmic reading"
        />
        <OneInsightCard />

        {/* ─────────────────────────────────────────────────────────── */}
        {/* COSMIC WEATHER */}
        {/* ─────────────────────────────────────────────────────────── */}
        <SectionHeader
          icon="🌤️"
          title="Cosmic Weather"
          subtitle="Current planetary influences"
        />
        <CosmicWeatherWidget />

        {/* ─────────────────────────────────────────────────────────── */}
        {/* FEATURE HUB — All features in one place */}
        {/* ─────────────────────────────────────────────────────────── */}
        <FeatureHub onOpenVoice={handleOpenVoice} moonPhase={currentMoon || undefined} />

        {/* ─────────────────────────────────────────────────────────── */}
        {/* DAILY AFFIRMATION */}
        {/* ─────────────────────────────────────────────────────────── */}
        <SectionHeader
          icon="💫"
          title="Daily Affirmation"
          subtitle="Words to carry with you"
        />
        <DailyAffirmation sunSign={sunSign} />

        {/* ─────────────────────────────────────────────────────────── */}
        {/* LOADING STATE */}
        {/* ─────────────────────────────────────────────────────────── */}
        {readingLoading && !r && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#8B5CF6" />
            <Text style={styles.loadingText}>Consulting the stars...</Text>
          </View>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* MOON PHASE BADGE */}
        {/* ─────────────────────────────────────────────────────────── */}
        {r?.moonPhase && (
          <>
            <SectionHeader
              icon="🌙"
              title="Tonight's Moon"
              action={{ label: 'Full tracker', onPress: () => router.push('/(tabs)/discover') }}
            />
            <Pressable onPress={() => router.push('/(tabs)/discover')}>
              <View style={styles.moonBadge}>
                <Text style={styles.moonEmoji}>{r.moonPhase.emoji}</Text>
                <View style={styles.moonTextWrap}>
                  <Text style={styles.moonName}>{r.moonPhase.name} · {r.moonPhase.illumination}% illuminated</Text>
                  <Text style={styles.moonGuidance}>{r.moonPhase.guidance}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#D4A547" />
              </View>
            </Pressable>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ENERGY METER */}
        {/* ─────────────────────────────────────────────────────────── */}
        {r && (
          <>
            <SectionHeader
              icon="⚡"
              title="Energy Level"
              subtitle="Your cosmic vitality today"
            />
            <View style={styles.card}>
              <EnergyMeter score={r.energyScore} />
            </View>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* DAILY BRIEFING */}
        {/* ─────────────────────────────────────────────────────────── */}
        {r?.briefing && (
          <>
            <SectionHeader
              icon="📜"
              title="Daily Briefing"
              subtitle="Your cosmic overview"
              action={shareData ? { label: 'Share', onPress: handleShare } : undefined}
            />
            <DailyBriefingCard
              briefing={r.briefing}
              onShare={shareData ? handleShare : undefined}
            />
          </>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* DO'S AND DON'TS */}
        {/* ─────────────────────────────────────────────────────────── */}
        {r?.dos && r?.donts && (
          <>
            <SectionHeader
              icon="✅"
              title="Do's & Don'ts"
              subtitle="Navigate today wisely"
            />
            <DoAndDontCard dos={r.dos} donts={r.donts} />
          </>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TRANSIT HIGHLIGHTS */}
        {/* ─────────────────────────────────────────────────────────── */}
        {r?.transits && (
          <>
            <SectionHeader
              icon="🪐"
              title="Active Transits"
              subtitle="Planetary movements affecting you"
              action={{ label: 'Full calendar', onPress: () => router.push('/(tabs)/discover') }}
            />
            <TransitHighlights transits={r.transits} />
          </>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* LUCKY ELEMENTS */}
        {/* ─────────────────────────────────────────────────────────── */}
        {r && (
          <>
            <SectionHeader
              icon="🍀"
              title="Lucky Elements"
              subtitle="Fortune favors these today"
            />
            <View style={styles.card}>
              <View style={styles.luckyGrid}>
                <View style={styles.luckyItem}>
                  <Text style={styles.luckyIcon}>🎨</Text>
                  <Text style={styles.luckyLabel}>Color</Text>
                  <Text style={styles.luckyValue}>{r.luckyColor}</Text>
                </View>
                <View style={styles.luckyItem}>
                  <Text style={styles.luckyIcon}>🔢</Text>
                  <Text style={styles.luckyLabel}>Number</Text>
                  <Text style={styles.luckyValue}>{r.luckyNumber}</Text>
                </View>
                <View style={styles.luckyItem}>
                  <Text style={styles.luckyIcon}>⏰</Text>
                  <Text style={styles.luckyLabel}>Time</Text>
                  <Text style={styles.luckyValue}>{r.luckyTime}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* COSMIC ALLIES / COMPATIBILITY */}
        {/* ─────────────────────────────────────────────────────────── */}
        {r?.compatibility && (
          <>
            <SectionHeader
              icon="💫"
              title="Cosmic Allies"
              subtitle="Best connections today"
              action={{ label: 'Full compatibility', onPress: () => router.push('/(tabs)/discover') }}
            />
            <Pressable onPress={() => router.push('/(tabs)/discover')}>
              <View style={styles.card}>
                <Text style={styles.compatText}>Best match: <Text style={styles.compatSign}>{r.compatibility.best}</Text></Text>
                <Text style={styles.compatText}>Rising connection: <Text style={styles.compatSign}>{r.compatibility.rising}</Text></Text>
                <View style={styles.compatCta}>
                  <Text style={styles.compatCtaText}>Check your compatibility →</Text>
                </View>
              </View>
            </Pressable>
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Moment Capture Button */}
      <MomentCaptureButton />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

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

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textMuted,
    marginTop: 1,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },

  // Quick Actions Bar
  quickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.12)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  quickAction: {
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },

  // Feature Hub
  featureHub: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  quickFeatureWrapper: {
    flex: 1,
  },
  quickFeatureCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  quickFeatureGradient: {
    padding: spacing.md,
    minHeight: 90,
    justifyContent: 'center',
  },
  quickFeatureIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  quickFeatureLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  quickFeatureSublabel: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Talk Card (Hero CTA)
  talkCard: { 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg, 
    marginBottom: spacing.md,
  },
  talkCardContent: { 
    flexDirection: 'row', 
    alignItems: 'center',
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

  // Loading
  loadingCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    backgroundColor: '#FFFFFF', 
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

  // Moon Badge
  moonBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(212,165,71,0.08)', 
    borderRadius: borderRadius.md, 
    padding: spacing.md, 
    marginBottom: spacing.md, 
    borderWidth: 1, 
    borderColor: 'rgba(212,165,71,0.15)',
  },
  moonEmoji: { 
    fontSize: 28, 
    marginRight: 12,
  },
  moonTextWrap: { 
    flex: 1,
  },
  moonName: { 
    fontSize: 14, 
    fontFamily: 'Inter-SemiBold', 
    color: colors.accentGold, 
    marginBottom: 4,
  },
  moonGuidance: { 
    fontSize: 13, 
    fontFamily: 'Inter-Regular', 
    color: colors.textSecondary, 
    lineHeight: 19,
  },

  // Generic Card
  card: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: borderRadius.lg, 
    padding: spacing.lg, 
    marginBottom: spacing.md, 
    borderWidth: 1, 
    borderColor: 'rgba(212,165,71,0.12)', 
    ...Platform.select({ 
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }, 
      android: { elevation: 2 },
    }),
  },

  // Lucky Elements
  luckyGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
  },
  luckyItem: { 
    alignItems: 'center', 
    flex: 1,
  },
  luckyIcon: { 
    fontSize: 22, 
    marginBottom: 4,
  },
  luckyLabel: { 
    fontSize: 11, 
    fontFamily: 'Inter-Regular', 
    color: colors.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5, 
    marginBottom: 2,
  },
  luckyValue: { 
    fontSize: 13, 
    fontFamily: 'Inter-SemiBold', 
    color: colors.textPrimary, 
    textAlign: 'center',
  },

  // Compatibility
  compatText: { 
    fontSize: 14, 
    fontFamily: 'Inter-Regular', 
    color: colors.textSecondary, 
    marginBottom: 6,
  },
  compatSign: { 
    fontFamily: 'Inter-SemiBold', 
    color: colors.accentGold,
  },
  compatCta: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212,165,71,0.1)',
  },
  compatCtaText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: colors.primary,
    textAlign: 'center',
  },

  // Share Shot (hidden)
  shareShot: { 
    position: 'absolute', 
    left: -2000, 
    top: 0, 
    width: 1080, 
    height: 1920,
  },
});
