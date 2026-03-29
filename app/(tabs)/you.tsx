/**
 * VEYa — You Tab: Profile & Settings 👤
 * User's cosmic identity hub with profile data, chart, stats, subscription, settings.
 * Reads from onboarding store for user data.
 */

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  interpolate,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
// Haptics loaded dynamically (Expo Go safe)
async function hapticImpact(style: 'Light' | 'Medium' = 'Light') {
  try {
    const Haptics = await import('expo-haptics');
    await Haptics.impactAsync(
      style === 'Light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
  } catch {}
}
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import { useJournalStore } from '../../src/stores/journalStore';
import { useAchievementStore, ACHIEVEMENTS } from '../../src/stores/achievementStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { useRouter } from 'expo-router';
import AnimatedPressable from '@/components/ui/AnimatedPressable';
// Rituals section moved to dedicated Rituals tab
import { 
  colors as themeColors, 
  typography as themeTypography, 
  spacing as themeSpacing, 
  borderRadius as themeBorderRadius 
} from '@/theme/design-system';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS (Extended from design-system.ts)
// ─────────────────────────────────────────────────────────────

const colors = {
  ...themeColors,
  premiumGold: '#C9A84C',
  premiumGoldDark: '#B8923E',
  doGreen: '#4A9D6E',
  danger: '#E8664D',
  cardBorder: 'rgba(212, 165, 71, 0.12)',
  cardShadow: 'rgba(139, 92, 246, 0.08)',
  switchTrack: '#E0D8CC',
  switchTrackActive: 'rgba(139, 92, 246, 0.3)',
} as const;

const typography = {
  fonts: themeTypography.fonts,
  sizes: {
    display1: themeTypography.sizes.display1,
    display2: themeTypography.sizes.display2,
    heading2: themeTypography.sizes.heading1,
    heading3: themeTypography.sizes.heading3,
    body: themeTypography.sizes.body,
    bodySmall: themeTypography.sizes.bodySmall,
    caption: themeTypography.sizes.caption,
    tiny: themeTypography.sizes.tiny,
  },
} as const;

const spacing = themeSpacing;

const borderRadius = {
  ...themeBorderRadius,
  xl: 20,
} as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_PADDING = spacing.lg;
const CARD_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;


// ─────────────────────────────────────────────────────────────
// MOCK DATA (cosmic placements, stats, subscription)
// ─────────────────────────────────────────────────────────────

const MOCK_COSMIC = {
  bigThree: {
    sun: { sign: 'Scorpio', symbol: '☉' },
    moon: { sign: 'Pisces', symbol: '☽' },
    rising: { sign: 'Leo', symbol: '↑' },
  },
  zodiacEmoji: '♏',
  memberSince: 'February 2026',
  memoryCount: 47,
  stats: [
    { id: 'readings', label: 'Readings', value: '12', icon: '📖' },
    { id: 'journal', label: 'Journal entries', value: '8', icon: '✍️' },
    { id: 'tarot', label: 'Tarot pulls', value: '3', icon: '🃏' },
    { id: 'streak', label: 'Day streak', value: '7', icon: '🔥' },
    { id: 'topic', label: 'Favorite topic', value: 'Love', icon: '💕' },
    { id: 'active', label: 'Most active', value: 'Mornings', icon: '☀️' },
  ],
  subscription: {
    plan: 'free' as const,
    price: '$9.99/month',
    annualPrice: '$79.99/year',
  },
  appVersion: '1.0.0',
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function hapticLight() {
  if (Platform.OS === 'ios') await hapticImpact('Light');
}
async function hapticMedium() {
  if (Platform.OS === 'ios') await hapticImpact('Medium');
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: What's Here Section (Feature Discovery)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// COMPONENT: Profile Header
// ─────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  userName: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
}

// Zodiac sign to emoji mapping
const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

function ProfileHeader({ userName, sunSign, moonSign, risingSign }: ProfileHeaderProps) {
  const borderRotate = useSharedValue(0);
  const memoryCounterScale = useSharedValue(0);
  
  const zodiacEmoji = ZODIAC_EMOJIS[sunSign || ''] || '✨';

  useEffect(() => {
    borderRotate.value = withTiming(360, { duration: 12000, easing: Easing.linear });
    memoryCounterScale.value = withDelay(800, withSpring(1, { damping: 10, stiffness: 120, mass: 0.8 }));
  }, []);

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${borderRotate.value}deg` }],
  }));

  const memoryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: memoryCounterScale.value }],
    opacity: memoryCounterScale.value,
  }));

  const AVATAR_BORDER_SIZE = 96;

  return (
    <Animated.View entering={FadeIn.duration(800).delay(100)} style={styles.profileHeaderContainer}>
      <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
          <Animated.View style={[styles.avatarBorderRing, borderAnimatedStyle]}>
            <Svg width={AVATAR_BORDER_SIZE} height={AVATAR_BORDER_SIZE}>
              <Defs>
                <SvgLinearGradient id="avatarBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={colors.accentGold} stopOpacity="0.8" />
                  <Stop offset="33%" stopColor={colors.primary} stopOpacity="0.6" />
                  <Stop offset="66%" stopColor={colors.accentRose} stopOpacity="0.5" />
                  <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0.8" />
                </SvgLinearGradient>
              </Defs>
              <Circle
                cx={AVATAR_BORDER_SIZE / 2}
                cy={AVATAR_BORDER_SIZE / 2}
                r={(AVATAR_BORDER_SIZE - 4) / 2}
                stroke="url(#avatarBorderGrad)"
                strokeWidth={2.5}
                fill="none"
                strokeDasharray="8, 4"
              />
            </Svg>
          </Animated.View>
          <View style={styles.avatarCircle}>
            <LinearGradient colors={['#F0E6FF', '#EDE9FE', '#FDF4E3']} style={styles.avatarGradient}>
              <Text style={styles.avatarZodiac}>{zodiacEmoji}</Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      <Animated.Text entering={FadeInDown.duration(500).delay(300)} style={styles.profileName}>
        {userName || 'Cosmic Soul'}
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.bigThreeRow}>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>☉</Text>
          <Text style={styles.bigThreeSign}>{sunSign || 'Unknown'}</Text>
        </View>
        <Text style={styles.bigThreeSeparator}>·</Text>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>☽</Text>
          <Text style={styles.bigThreeSign}>{moonSign || 'Unknown'}</Text>
        </View>
        <Text style={styles.bigThreeSeparator}>·</Text>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>↑</Text>
          <Text style={styles.bigThreeSign}>{risingSign || 'Unknown'}</Text>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(400).delay(500)} style={styles.memberSince}>
        Welcome to VEYa ✨
      </Animated.Text>

      <Animated.View style={[styles.memoryCounterBadge, memoryAnimatedStyle]}>
        <Text style={styles.memoryCounterText}>
          ✨ Your cosmic journey is just beginning
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Cosmic Stats Card
// ─────────────────────────────────────────────────────────────

function CosmicStatsCard() {
  return (
    <Animated.View entering={FadeInDown.duration(600).delay(600)}>
      <View style={[styles.card, styles.statsCard]}>
        <Text style={styles.statsTitle}>Your Cosmic Stats</Text>
        <View style={styles.statsGrid}>
          {MOCK_COSMIC.stats.map((stat, index) => (
            <Animated.View key={stat.id} entering={FadeInDown.duration(400).delay(700 + index * 80)} style={styles.statItem}>
              <View style={styles.statIconCircle}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: My Chart Summary
// ─────────────────────────────────────────────────────────────

interface MyChartSummaryProps {
  birthDate: Date | string | null;
  birthPlace: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
}

function MyChartSummary({ birthDate, birthPlace, sunSign, moonSign, risingSign }: MyChartSummaryProps) {
  const displayDate = birthDate ? new Date(birthDate as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not set';
  const displayPlace = birthPlace || 'Not set';

  const placements = [
    { symbol: '☉', label: 'Sun', sign: sunSign || 'Unknown' },
    { symbol: '☽', label: 'Moon', sign: moonSign || 'Unknown' },
    { symbol: '↑', label: 'Rising', sign: risingSign || 'Unknown' },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(900)}>
      <View style={[styles.card, styles.chartCard]}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>My Chart</Text>
          <Pressable onPress={() => hapticLight()} style={styles.editLink}>
            <Text style={styles.editLinkText}>Edit birth data →</Text>
          </Pressable>
        </View>

        <View style={styles.chartPlacements}>
          {placements.map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={styles.chartPlacementDivider} />}
              <View style={styles.chartPlacementRow}>
                <Text style={styles.chartPlacementSymbol}>{item.symbol}</Text>
                <Text style={styles.chartPlacementLabel}>{item.label}</Text>
                <Text style={styles.chartPlacementSign}>{item.sign}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={styles.chartBirthData}>
          <View style={styles.chartBirthRow}>
            <Text style={styles.chartBirthLabel}>Born</Text>
            <Text style={styles.chartBirthValue}>{displayDate}</Text>
          </View>
          <View style={styles.chartBirthRow}>
            <Text style={styles.chartBirthLabel}>Place</Text>
            <Text style={styles.chartBirthValue}>{displayPlace}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}


// ─────────────────────────────────────────────────────────────
// COMPONENT: Journal Section
// ─────────────────────────────────────────────────────────────

function getPreview(text: string, max = 72) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function JournalSection() {
  const entries = useJournalStore((s) => s.entries);
  const router = useRouter();
  const recentEntries = entries.slice(0, 3);

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(900)} style={styles.sectionBlock}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Journal</Text>
        <Pressable onPress={() => router.push('/(tabs)/rituals')} style={styles.sectionActionPill}>
          <Text style={styles.sectionActionText}>Write</Text>
        </Pressable>
      </View>

      {recentEntries.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateEmoji}>📓</Text>
          <Text style={styles.emptyStateText}>Start a reflection and track your cosmic growth.</Text>
        </View>
      ) : (
        <View style={styles.journalList}>
          {recentEntries.map((entry) => (
            <View key={entry.id} style={styles.journalCard}>
              <View style={styles.journalCardHeader}>
                <Text style={styles.journalDate}>{entry.dateLabel}</Text>
                <Text style={styles.journalMood}>{entry.mood}</Text>
              </View>
              <Text style={styles.journalPreview}>{getPreview(entry.text)}</Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Achievement Badges
// ─────────────────────────────────────────────────────────────

function AchievementsSection() {
  const { progress } = useAchievementStore();
  const { currentStreak, totalCheckIns } = useStreakStore();

  const featuredAchievements = useMemo(() => {
    const ids = ['first_reflection', 'cosmic_curious', 'morning_star'];
    return ids.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);
  }, []);

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1050)} style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Achievement Badges</Text>
      <View style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Days with VEYa</Text>
          <Text style={styles.progressValue}>{totalCheckIns}</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(totalCheckIns / 30, 1) * 100}%` }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Current streak</Text>
          <Text style={styles.progressValue}>{currentStreak} days</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(currentStreak / 14, 1) * 100}%` }]} />
        </View>
      </View>

      <View style={styles.badgesRow}>
        {featuredAchievements.map((achievement) => {
          if (!achievement) return null;
          const current = progress[achievement.id]?.current || 0;
          const unlocked = progress[achievement.id]?.unlocked || false;
          const percent = Math.min((current / achievement.requirement) * 100, 100);
          return (
            <View key={achievement.id} style={styles.badgeCard}>
              <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
              <Text style={styles.badgeTitle}>{achievement.name}</Text>
              <Text style={styles.badgeSubtitle}>{unlocked ? 'Unlocked' : `${current}/${achievement.requirement}`}</Text>
              <View style={styles.badgeProgressTrack}>
                <View style={[styles.badgeProgressFill, { width: `${percent}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Subscription Card
// ─────────────────────────────────────────────────────────────

function SubscriptionCard() {
  const ctaScale = useSharedValue(1);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withSequence(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
    );
  }, []);

  const handleUpgradePress = async () => {
    await hapticMedium();
    ctaScale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  };

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.85, 1]),
  }));

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1100)}>
      <Animated.View style={[styles.card, styles.subscriptionCard, shimmerStyle]}>
        <LinearGradient
          colors={['rgba(212, 165, 71, 0.3)', 'rgba(139, 92, 246, 0.15)', 'rgba(212, 165, 71, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.subscriptionGradientStrip}
        />
        <View style={styles.subscriptionContent}>
          <View style={styles.subscriptionHeader}>
            <View>
              <Text style={styles.subscriptionUpgradeTitle}>Unlock VEYa's Full Potential ✨</Text>
              <Text style={styles.subscriptionUpgradeSubtitle}>Your cosmic journey awaits</Text>
            </View>
            <View style={styles.planBadgeFree}>
              <Text style={styles.planBadgeFreeText}>Free</Text>
            </View>
          </View>

          <View style={styles.benefitsList}>
            {[
              { icon: '💬', text: 'Unlimited AI conversations' },
              { icon: '🎙️', text: 'Voice AI with VEYa' },
              { icon: '🧠', text: 'RAG Memory — VEYa remembers you' },
              { icon: '💕', text: 'Full compatibility readings' },
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{MOCK_COSMIC.subscription.price}</Text>
            <Text style={styles.priceAnnual}>or {MOCK_COSMIC.subscription.annualPrice} (save 33%)</Text>
          </View>

          <AnimatedPressable onPress={handleUpgradePress} style={[styles.upgradeButton, ctaAnimatedStyle]}>
            <LinearGradient
              colors={[colors.accentGold, colors.premiumGoldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Settings Section
// ─────────────────────────────────────────────────────────────

function SettingsSection({ focusAreas }: { focusAreas: string[] }) {
  const [notifications, setNotifications] = React.useState(true);
  const [autoSpeak, setAutoSpeak] = React.useState(false);
  const [houseSystem, setHouseSystem] = React.useState<'placidus' | 'whole-sign'>('placidus');

  const displayFocusAreas = focusAreas.length > 0 ? focusAreas.join(', ') : 'Love & Relationships, Career, Personal Growth';

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1300)} style={styles.settingsSection}>
      <Text style={styles.settingsSectionTitle}>Settings</Text>

      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🔔</Text>
            <View>
              <Text style={styles.settingsRowLabel}>Notifications</Text>
              <Text style={styles.settingsRowHint}>Daily briefings & transit alerts</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={(v) => { hapticLight(); setNotifications(v); }}
            trackColor={{ false: colors.switchTrack, true: colors.switchTrackActive }}
            thumbColor={notifications ? colors.primary : colors.white}
            ios_backgroundColor={colors.switchTrack}
          />
        </View>

        <View style={styles.settingsDivider} />

        <Pressable onPress={() => { hapticLight(); setHouseSystem(h => h === 'placidus' ? 'whole-sign' : 'placidus'); }} style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🏛️</Text>
            <View>
              <Text style={styles.settingsRowLabel}>House System</Text>
              <Text style={styles.settingsRowHint}>Currently: {houseSystem === 'placidus' ? 'Placidus' : 'Whole Sign'}</Text>
            </View>
          </View>
          <View style={styles.houseSystemToggle}>
            <Text style={[styles.houseSystemOption, houseSystem === 'placidus' && styles.houseSystemOptionActive]}>Placidus</Text>
            <Text style={[styles.houseSystemOption, houseSystem === 'whole-sign' && styles.houseSystemOptionActive]}>Whole Sign</Text>
          </View>
        </Pressable>

        <View style={styles.settingsDivider} />

        <Pressable onPress={() => hapticLight()} style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🎯</Text>
            <View>
              <Text style={styles.settingsRowLabel}>Focus Areas</Text>
              <Text style={styles.settingsRowHint}>{displayFocusAreas}</Text>
            </View>
          </View>
          <Text style={styles.settingsRowChevron}>›</Text>
        </Pressable>

        <View style={styles.settingsDivider} />

        <View style={styles.settingsRow}>
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🎙️</Text>
            <View>
              <Text style={styles.settingsRowLabel}>VEYa's Voice: Nova ✨</Text>
              <Text style={styles.settingsRowHint}>Auto-speak responses</Text>
            </View>
          </View>
          <Switch
            value={autoSpeak}
            onValueChange={(v) => { hapticLight(); setAutoSpeak(v); }}
            trackColor={{ false: colors.switchTrack, true: colors.switchTrackActive }}
            thumbColor={autoSpeak ? colors.primary : colors.white}
            ios_backgroundColor={colors.switchTrack}
          />
        </View>

        <View style={styles.settingsDivider} />

        <View style={[styles.settingsRow, { opacity: 0.7 }]}>
          <View style={styles.settingsRowLeft}>
            <Text style={[styles.settingsRowIcon, { opacity: 0.4 }]}>🌗</Text>
            <View>
              <Text style={[styles.settingsRowLabel, { opacity: 0.4 }]}>Dark Mode</Text>
              <Text style={[styles.settingsRowHint, { fontStyle: 'italic' }]}>Coming soon</Text>
            </View>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </View>
      </View>

      <View style={[styles.settingsCard, { marginTop: spacing.md }]}>
        {[
          { icon: '🔒', label: 'Privacy Policy' },
          { icon: '📜', label: 'Terms of Service' },
          { icon: '💬', label: 'Support' },
        ].map((link, index) => (
          <React.Fragment key={link.label}>
            {index > 0 && <View style={styles.settingsDivider} />}
            <Pressable onPress={() => hapticLight()} style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Text style={styles.settingsRowIcon}>{link.icon}</Text>
                <Text style={styles.settingsRowLabel}>{link.label}</Text>
              </View>
              <Text style={styles.settingsRowChevron}>›</Text>
            </Pressable>
          </React.Fragment>
        ))}
      </View>

      <Pressable onPress={() => hapticMedium()} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
      <Text style={styles.appVersion}>VEYa v4.0.0</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN: ProfileScreen
// ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useOnboardingStore();

  // Use onboarding store data with fallbacks
  const userName = data.name || 'Cosmic Soul';
  const birthDate = data.birthDate;
  const birthPlace = data.birthPlace || '';
  const focusAreas = data.focusAreas || [];
  const sunSign = data.sunSign;
  const moonSign = data.moonSign;
  const risingSign = data.risingSign;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FDFBF7', '#F8F4EC', '#FDFBF7']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <ProfileHeader userName={userName} sunSign={sunSign} moonSign={moonSign} risingSign={risingSign} />
        <MyChartSummary birthDate={birthDate} birthPlace={birthPlace} sunSign={sunSign} moonSign={moonSign} risingSign={risingSign} />
        <JournalSection />
        <AchievementsSection />
        {/* SubscriptionCard hidden — all features unlocked */}
        <SettingsSection focusAreas={focusAreas} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: CONTENT_PADDING, paddingBottom: 120 },

  // Profile Header
  profileHeaderContainer: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
  avatarSection: { marginBottom: spacing.md },
  avatarContainer: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  avatarBorderRing: { position: 'absolute' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  avatarGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarZodiac: { fontSize: 36 },
  profileName: {
    fontFamily: typography.fonts.display, fontSize: typography.sizes.display1, color: colors.textPrimary,
    letterSpacing: 0.3, marginBottom: spacing.sm,
    ...Platform.select({
      ios: { textShadowColor: 'rgba(212, 165, 71, 0.08)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
      android: {},
    }),
  },
  bigThreeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  bigThreeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bigThreeSymbol: { fontFamily: typography.fonts.body, fontSize: typography.sizes.body, color: colors.primary },
  bigThreeSign: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.2 },
  bigThreeSeparator: { fontFamily: typography.fonts.body, fontSize: typography.sizes.body, color: colors.textMuted, marginHorizontal: spacing.xs },
  memberSince: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted, marginBottom: spacing.sm },
  memoryCounterBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.1)' },
  memoryCounterText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.primary, letterSpacing: 0.2 },

  // Card base
  card: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.cardBorder,
    ...Platform.select({
      ios: { shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  
  // What's Here (Feature Discovery)
  whatsHereCard: { padding: spacing.md, marginBottom: spacing.md },
  whatsHereTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.body, color: colors.textPrimary, marginBottom: spacing.xs },
  whatsHereDesc: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textSecondary, lineHeight: 18, marginBottom: spacing.md },
  whatsHereFeatures: { flexDirection: 'row', justifyContent: 'space-around' },
  whatsHereFeatureItem: { alignItems: 'center' },
  whatsHereFeatureEmoji: { fontSize: 20, marginBottom: 4 },
  whatsHereFeatureLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny, color: colors.textMuted },

  // Stats
  statsCard: { padding: spacing.lg, marginBottom: spacing.md },
  statsTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  statItem: { width: (CARD_WIDTH - spacing.lg * 2 - spacing.xs * 2) / 3, alignItems: 'center', paddingVertical: spacing.sm },
  statIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statIcon: { fontSize: 18 },
  statValue: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, marginBottom: 2 },
  statLabel: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, textAlign: 'center', lineHeight: 14.3 },

  // Chart
  chartCard: { padding: spacing.lg, marginBottom: spacing.md },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chartTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2 },
  editLink: { paddingVertical: 4, paddingHorizontal: spacing.xs },
  editLinkText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.primary, letterSpacing: 0.2 },
  chartPlacements: { backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  chartPlacementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  chartPlacementSymbol: { fontFamily: typography.fonts.body, fontSize: typography.sizes.heading3, color: colors.primary, width: 28, textAlign: 'center' },
  chartPlacementLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, marginLeft: spacing.sm, flex: 1 },
  chartPlacementSign: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.2 },
  chartPlacementDivider: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.04)', marginLeft: 40 },
  chartBirthData: { gap: spacing.xs },
  chartBirthRow: { flexDirection: 'row', alignItems: 'center' },
  chartBirthLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted, width: 44 },
  chartBirthValue: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textSecondary, flex: 1 },



  // Journal + Achievements
  sectionBlock: { marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2 },
  sectionActionPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.primaryLight },
  sectionActionText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, color: colors.primary },
  emptyStateCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder },
  emptyStateEmoji: { fontSize: 26, marginBottom: spacing.xs },
  emptyStateText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  journalList: { gap: spacing.sm },
  journalCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  journalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  journalDate: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted },
  journalMood: { fontSize: 16 },
  journalPreview: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, lineHeight: 18 },
  progressCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressLabel: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted },
  progressValue: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.caption, color: colors.textPrimary },
  progressBarTrack: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999, marginBottom: spacing.sm },
  progressBarFill: { height: 6, backgroundColor: colors.primary, borderRadius: 999 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard: { width: (CARD_WIDTH - spacing.sm) / 2, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  badgeEmoji: { fontSize: 24, marginBottom: spacing.xs },
  badgeTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, marginBottom: 2 },
  badgeSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, marginBottom: spacing.xs },
  badgeProgressTrack: { height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 999 },
  badgeProgressFill: { height: 6, backgroundColor: colors.accentGold, borderRadius: 999 },
  // Subscription
  subscriptionCard: { marginBottom: spacing.md, overflow: 'hidden' },
  subscriptionGradientStrip: { height: 3, width: '100%' },
  subscriptionContent: { padding: spacing.lg },
  subscriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  subscriptionUpgradeTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: 2 },
  subscriptionUpgradeSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted },
  planBadgeFree: { backgroundColor: colors.surface, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.surfaceAlt },
  planBadgeFreeText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.tiny, color: colors.textMuted, letterSpacing: 0.3 },
  benefitsList: { marginBottom: spacing.md, gap: spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitIcon: { fontSize: 16, marginRight: spacing.sm, width: 24, textAlign: 'center' },
  benefitText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, lineHeight: 19.6 },
  priceRow: { alignItems: 'center', marginBottom: spacing.md },
  priceAmount: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading2, color: colors.textPrimary, marginBottom: 2 },
  priceAnnual: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted },
  upgradeButton: { borderRadius: borderRadius.full, overflow: 'hidden' },
  upgradeButtonGradient: { paddingVertical: spacing.md, borderRadius: borderRadius.full, alignItems: 'center' },
  upgradeButtonText: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.body, color: colors.white, letterSpacing: 0.5 },

  // Settings
  settingsSection: { marginBottom: spacing.md },
  settingsSectionTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: spacing.sm },
  settingsCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 56 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  settingsRowIcon: { fontSize: 18, marginRight: spacing.sm, width: 24, textAlign: 'center' },
  settingsRowLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.1 },
  settingsRowHint: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, marginTop: 1 },
  settingsRowChevron: { fontFamily: typography.fonts.body, fontSize: 22, color: colors.textMuted },
  settingsDivider: { height: 1, backgroundColor: 'rgba(0, 0, 0, 0.04)', marginLeft: spacing.lg + 24 + spacing.sm },
  houseSystemToggle: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: borderRadius.sm, padding: 2 },
  houseSystemOption: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.tiny, color: colors.textMuted, paddingHorizontal: spacing.xs, paddingVertical: 4, borderRadius: borderRadius.sm - 2, overflow: 'hidden' },
  houseSystemOptionActive: {
    backgroundColor: colors.white, color: colors.primary, fontFamily: typography.fonts.bodySemiBold,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  comingSoonBadge: { backgroundColor: colors.surface, paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: borderRadius.full },
  comingSoonText: { fontFamily: typography.fonts.bodyMedium, fontSize: 9, color: colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  signOutButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.lg },
  signOutText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.danger, letterSpacing: 0.2 },
  appVersion: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.md },
});
