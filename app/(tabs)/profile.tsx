/**
 * VEYa — You Tab: Profile & Settings 👤
 * User's cosmic identity hub with profile data, chart, stats, journal, achievements, timeline, settings.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Line,
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
import {
  colors as themeColors,
  typography as themeTypography,
  spacing as themeSpacing,
  borderRadius as themeBorderRadius,
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

const SETTINGS_STORAGE_KEY = 'veya-profile-settings';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function hapticLight() {
  if (Platform.OS === 'ios') await hapticImpact('Light');
}

function formatLongDate(dateValue: Date | string | null) {
  if (!dateValue) return 'Birth date not set';
  const date = new Date(dateValue as string);
  if (Number.isNaN(date.getTime())) return 'Birth date not set';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTimeLabel(dateValue: Date | string | null) {
  if (!dateValue) return 'Unknown time';
  const date = new Date(dateValue as string);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTitleFromEntry(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 'Untitled Reflection';
  const firstLine = trimmed.split('\n')[0];
  const words = firstLine.split(' ').filter(Boolean).slice(0, 5).join(' ');
  return words.length > 0 ? words : 'Untitled Reflection';
}

function getPreview(text: string) {
  return text.replace(/\n/g, ' ').slice(0, 96).trim();
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Profile Header
// ─────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  userName: string;
  birthDate: Date | string | null;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
}

// Zodiac sign to emoji mapping
const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

function ProfileHeader({ userName, birthDate, sunSign, moonSign, risingSign }: ProfileHeaderProps) {
  const borderRotate = useSharedValue(0);
  const memoryCounterScale = useSharedValue(0);

  const zodiacEmoji = ZODIAC_EMOJIS[sunSign || ''] || '✨';
  const birthDateLabel = formatLongDate(birthDate);

  useEffect(() => {
    borderRotate.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );
    memoryCounterScale.value = withDelay(800, withSpring(1, { damping: 10, stiffness: 120, mass: 0.8 }));
  }, []);

  const borderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${borderRotate.value}deg` }],
  }));

  const memoryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: memoryCounterScale.value }],
    opacity: memoryCounterScale.value,
  }));

  const AVATAR_BORDER_SIZE = 104;

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
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.25)', 'rgba(212, 165, 71, 0.08)']}
            style={styles.avatarAura}
          />
        </View>
      </View>

      <Animated.Text entering={FadeInDown.duration(500).delay(300)} style={styles.profileName}>
        {userName || 'Cosmic Soul'}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.duration(450).delay(350)} style={styles.profileBirthDate}>
        Born {birthDateLabel}
      </Animated.Text>

      <Animated.View entering={FadeInDown.duration(500).delay(400)} style={styles.bigThreeRow}>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>☉</Text>
          <Text style={styles.bigThreeSign}>{sunSign || 'Unknown'}</Text>
          <Text style={styles.bigThreeEmoji}>{ZODIAC_EMOJIS[sunSign || ''] || '✨'}</Text>
        </View>
        <Text style={styles.bigThreeSeparator}>·</Text>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>☽</Text>
          <Text style={styles.bigThreeSign}>{moonSign || 'Unknown'}</Text>
          <Text style={styles.bigThreeEmoji}>{ZODIAC_EMOJIS[moonSign || ''] || '🌙'}</Text>
        </View>
        <Text style={styles.bigThreeSeparator}>·</Text>
        <View style={styles.bigThreeBadge}>
          <Text style={styles.bigThreeSymbol}>↑</Text>
          <Text style={styles.bigThreeSign}>{risingSign || 'Unknown'}</Text>
          <Text style={styles.bigThreeEmoji}>{ZODIAC_EMOJIS[risingSign || ''] || '🌟'}</Text>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(400).delay(500)} style={styles.memberSince}>
        Welcome to VEYa ✨
      </Animated.Text>

      <Animated.View style={[styles.memoryCounterBadge, memoryAnimatedStyle]}>
        <Text style={styles.memoryCounterText}>Your cosmic journey is just beginning</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Chart Summary
// ─────────────────────────────────────────────────────────────

interface ChartSummaryProps {
  birthDate: Date | string | null;
  birthTime: Date | string | null;
  birthPlace: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
}

function ChartSummaryCard({ birthDate, birthTime, birthPlace, sunSign, moonSign, risingSign }: ChartSummaryProps) {
  const router = useRouter();
  const displayDate = formatLongDate(birthDate);
  const displayTime = formatTimeLabel(birthTime);
  const displayPlace = birthPlace || 'Not set';

  const placements = [
    { symbol: '☉', label: 'Sun', sign: sunSign || 'Unknown' },
    { symbol: '☽', label: 'Moon', sign: moonSign || 'Unknown' },
    { symbol: '↑', label: 'Rising', sign: risingSign || 'Unknown' },
    { symbol: '☿', label: 'Mercury', sign: sunSign || 'Unknown' },
    { symbol: '♀', label: 'Venus', sign: moonSign || 'Unknown' },
    { symbol: '♂', label: 'Mars', sign: risingSign || 'Unknown' },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(900)}>
      <Pressable
        onPress={() => router.push('/(tabs)/discover')}
        style={[styles.card, styles.chartCard]}
      >
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>My Chart</Text>
          <Text style={styles.chartTapHint}>Tap for full chart →</Text>
        </View>

        <View style={styles.chartContentRow}>
          <View style={styles.miniChartWrap}>
            <LinearGradient colors={['#EFE7FF', '#F6F1FF']} style={styles.miniChartGradient}>
              <Svg width={120} height={120}>
                <Defs>
                  <SvgLinearGradient id="miniChartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.4" />
                    <Stop offset="100%" stopColor={colors.accentGold} stopOpacity="0.5" />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx={60} cy={60} r={50} stroke="url(#miniChartGrad)" strokeWidth={2} fill="none" />
                <Circle cx={60} cy={60} r={32} stroke="rgba(139, 92, 246, 0.25)" strokeWidth={1.5} fill="none" />
                <Line x1={60} y1={10} x2={60} y2={110} stroke="rgba(139, 92, 246, 0.2)" />
                <Line x1={10} y1={60} x2={110} y2={60} stroke="rgba(139, 92, 246, 0.2)" />
                <Circle cx={60} cy={18} r={3} fill={colors.accentGold} />
                <Circle cx={90} cy={44} r={3} fill={colors.primary} />
                <Circle cx={36} cy={88} r={3} fill={colors.accentRose} />
              </Svg>
            </LinearGradient>
          </View>

          <View style={styles.chartPlacements}>
            {placements.map((item, i) => (
              <View key={item.label} style={[styles.chartPlacementRow, i > 0 && styles.chartPlacementRowTight]}>
                <Text style={styles.chartPlacementSymbol}>{item.symbol}</Text>
                <Text style={styles.chartPlacementLabel}>{item.label}</Text>
                <Text style={styles.chartPlacementSign}>{item.sign}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartBirthData}>
          <View style={styles.chartBirthRow}>
            <Text style={styles.chartBirthLabel}>Born</Text>
            <Text style={styles.chartBirthValue}>{displayDate}</Text>
          </View>
          <View style={styles.chartBirthRow}>
            <Text style={styles.chartBirthLabel}>Time</Text>
            <Text style={styles.chartBirthValue}>{displayTime}</Text>
          </View>
          <View style={styles.chartBirthRow}>
            <Text style={styles.chartBirthLabel}>Place</Text>
            <Text style={styles.chartBirthValue}>{displayPlace}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Journal Section
// ─────────────────────────────────────────────────────────────

const MOOD_OPTIONS = ['😊', '😌', '✨', '🌙', '🔥', '💖'];

function JournalSection() {
  const { entries, addEntry } = useJournalStore();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftMood, setDraftMood] = useState(MOOD_OPTIONS[0]);

  const selectedEntry = entries.find((entry) => entry.id === selectedEntryId) || null;

  const handleSave = () => {
    if (!draftText.trim()) return;
    addEntry({ text: draftText, mood: draftMood });
    setDraftText('');
    setDraftMood(MOOD_OPTIONS[0]);
    setIsComposerOpen(false);
  };

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1050)} style={styles.sectionBlock}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>My Journal</Text>
        <Pressable onPress={() => { hapticLight(); setIsComposerOpen(true); }} style={styles.addButton}>
          <Text style={styles.addButtonText}>＋</Text>
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateEmoji}>📓</Text>
          <Text style={styles.emptyStateText}>Start your first reflection to track your cosmic growth.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {entries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => setSelectedEntryId(entry.id)}
              style={styles.journalCard}
            >
              <View style={styles.journalCardHeader}>
                <Text style={styles.journalDate}>{entry.dateLabel}</Text>
                <Text style={styles.journalMood}>{entry.mood}</Text>
              </View>
              <Text style={styles.journalTitle}>{getTitleFromEntry(entry.text)}</Text>
              <Text style={styles.journalPreview}>{getPreview(entry.text)}...</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Modal visible={isComposerOpen} transparent animationType="slide" onRequestClose={() => setIsComposerOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Reflection</Text>
            <Text style={styles.modalSubtitle}>How did today feel?</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((mood) => (
                <Pressable
                  key={mood}
                  onPress={() => setDraftMood(mood)}
                  style={[styles.moodChip, draftMood === mood && styles.moodChipActive]}
                >
                  <Text style={styles.moodChipText}>{mood}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              multiline
              placeholder="Write your thoughts..."
              placeholderTextColor={colors.textMuted}
              style={styles.journalInput}
              value={draftText}
              onChangeText={setDraftText}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setIsComposerOpen(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.modalSave}>
                <Text style={styles.modalSaveText}>Save ✨</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!selectedEntry}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEntryId(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedEntryId(null)}>
          <Pressable style={styles.entryModalCard}>
            {selectedEntry && (
              <>
                <View style={styles.journalCardHeader}>
                  <Text style={styles.journalDate}>{selectedEntry.dateLabel}</Text>
                  <Text style={styles.journalMood}>{selectedEntry.mood}</Text>
                </View>
                <Text style={styles.entryModalTitle}>{getTitleFromEntry(selectedEntry.text)}</Text>
                <Text style={styles.entryModalBody}>{selectedEntry.text}</Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Achievements / Progress
// ─────────────────────────────────────────────────────────────

function AchievementsSection() {
  const { progress } = useAchievementStore();
  const journalCount = useJournalStore((s) => s.entries.length);
  const { currentStreak, totalCheckIns } = useStreakStore();

  const featuredAchievements = useMemo(() => {
    const ids = ['first_reflection', 'cosmic_curious', 'morning_star', 'star_gazer'];
    return ids.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean);
  }, []);

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1150)} style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Your Cosmic Journey</Text>
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
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Journal reflections</Text>
          <Text style={styles.progressValue}>{journalCount}</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${Math.min(journalCount / 10, 1) * 100}%` }]} />
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
      <Text style={styles.celebrationText}>Keep shining — every step lights up your chart ✨</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Cosmic Year Timeline
// ─────────────────────────────────────────────────────────────

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  subtitle: string;
}

function CosmicYearTimeline({ birthDate }: { birthDate: Date | string | null }) {
  const baseDate = birthDate ? new Date(birthDate as string) : new Date();
  const year = new Date().getFullYear();
  const birthday = new Date(baseDate);
  birthday.setFullYear(year);

  const timelineEvents: TimelineEvent[] = [
    {
      id: 'solar-return',
      title: 'Solar Return',
      date: birthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      subtitle: 'Your sun resets for the year',
    },
    {
      id: 'lunar-boost',
      title: 'Full Moon Blessing',
      date: new Date(year, 5, 12).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      subtitle: 'Release + renew intentions',
    },
    {
      id: 'venus-shift',
      title: 'Venus Transit',
      date: new Date(year, 8, 23).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      subtitle: 'Love + abundance peak',
    },
    {
      id: 'birthday',
      title: 'Birthday Portal',
      date: birthday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      subtitle: 'Celebrate your cosmic essence',
    },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1250)} style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Your Cosmic Year</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineRow}>
        {timelineEvents.map((event) => (
          <View key={event.id} style={styles.timelineCard}>
            <Text style={styles.timelineDate}>{event.date}</Text>
            <Text style={styles.timelineTitle}>{event.title}</Text>
            <Text style={styles.timelineSubtitle}>{event.subtitle}</Text>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPONENT: Settings Section
// ─────────────────────────────────────────────────────────────

interface ProfileSettings {
  notifications: boolean;
  displayMode: 'cosmic' | 'minimal';
}

function SettingsSection() {
  const [notifications, setNotifications] = useState(true);
  const [displayMode, setDisplayMode] = useState<ProfileSettings['displayMode']>('cosmic');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ProfileSettings;
          setNotifications(parsed.notifications ?? true);
          setDisplayMode(parsed.displayMode ?? 'cosmic');
        }
      } catch {}
      setIsLoaded(true);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ notifications, displayMode })
    ).catch(() => {});
  }, [notifications, displayMode, isLoaded]);

  return (
    <Animated.View entering={FadeInDown.duration(600).delay(1350)} style={styles.settingsSection}>
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
            onValueChange={(v) => {
              hapticLight();
              setNotifications(v);
            }}
            trackColor={{ false: colors.switchTrack, true: colors.switchTrackActive }}
            thumbColor={notifications ? colors.primary : colors.white}
            ios_backgroundColor={colors.switchTrack}
          />
        </View>

        <View style={styles.settingsDivider} />

        <Pressable
          onPress={() => {
            hapticLight();
            setDisplayMode((prev) => (prev === 'cosmic' ? 'minimal' : 'cosmic'));
          }}
          style={styles.settingsRow}
        >
          <View style={styles.settingsRowLeft}>
            <Text style={styles.settingsRowIcon}>🎨</Text>
            <View>
              <Text style={styles.settingsRowLabel}>Display Style</Text>
              <Text style={styles.settingsRowHint}>{displayMode === 'cosmic' ? 'Cosmic Glow' : 'Minimal Calm'}</Text>
            </View>
          </View>
          <View style={styles.houseSystemToggle}>
            <Text style={[styles.houseSystemOption, displayMode === 'cosmic' && styles.houseSystemOptionActive]}>Cosmic</Text>
            <Text style={[styles.houseSystemOption, displayMode === 'minimal' && styles.houseSystemOptionActive]}>Minimal</Text>
          </View>
        </Pressable>
      </View>

      <View style={[styles.settingsCard, { marginTop: spacing.md }]}>
        {[{ icon: 'ℹ️', label: 'About VEYa' }, { icon: '🆘', label: 'Help Center' }].map((link, index) => (
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

      <Text style={styles.appVersion}>VEYa v4.0.0</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// STARDUST PARTICLES
// ─────────────────────────────────────────────────────────────

interface ParticleConfig {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  color: string;
}

function generateParticles(count: number): ParticleConfig[] {
  const particles: ParticleConfig[] = [];
  const tones = ['rgba(212, 165, 71, 0.3)', 'rgba(139, 92, 246, 0.15)', 'rgba(232, 120, 138, 0.12)'];
  for (let i = 0; i < count; i++) {
    particles.push({
      cx: Math.random() * SCREEN_WIDTH,
      cy: Math.random() * 200,
      r: Math.random() * 1.4 + 0.4,
      opacity: Math.random() * 0.2 + 0.05,
      delay: Math.random() * 4000,
      duration: Math.random() * 8000 + 6000,
      driftX: (Math.random() - 0.5) * 15,
      driftY: (Math.random() - 0.5) * 10,
      color: tones[Math.floor(Math.random() * tones.length)],
    });
  }
  return particles;
}

const PARTICLES = generateParticles(8);

function StardustParticle({ config }: { config: ParticleConfig }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftX, { duration: config.duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(-config.driftX * 0.6, { duration: config.duration * 0.8, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.driftY, { duration: config.duration * 1.1, easing: Easing.inOut(Easing.sin) }),
          withTiming(-config.driftY * 0.5, { duration: config.duration * 0.9, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.opacity, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) }),
          withTiming(config.opacity * 0.15, { duration: config.duration * 0.5, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: config.cx,
          top: config.cy,
          width: config.r * 2,
          height: config.r * 2,
          borderRadius: config.r,
          backgroundColor: config.color,
        },
        animatedStyle,
      ]}
    />
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
  const birthTime = data.birthTime;
  const birthPlace = data.birthPlace || '';
  const sunSign = data.sunSign;
  const moonSign = data.moonSign;
  const risingSign = data.risingSign;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#FDFBF7', '#F8F4EC', '#FDFBF7']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFillObject} />
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {PARTICLES.map((p, i) => (
          <StardustParticle key={i} config={p} />
        ))}
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.md }]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <ProfileHeader
          userName={userName}
          birthDate={birthDate}
          sunSign={sunSign}
          moonSign={moonSign}
          risingSign={risingSign}
        />
        <ChartSummaryCard
          birthDate={birthDate}
          birthTime={birthTime}
          birthPlace={birthPlace}
          sunSign={sunSign}
          moonSign={moonSign}
          risingSign={risingSign}
        />
        <JournalSection />
        <AchievementsSection />
        <CosmicYearTimeline birthDate={birthDate} />
        <SettingsSection />
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
  scrollContent: { paddingHorizontal: CONTENT_PADDING, paddingBottom: spacing.lg },

  // Profile Header
  profileHeaderContainer: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.lg },
  avatarSection: { marginBottom: spacing.md },
  avatarContainer: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center' },
  avatarBorderRing: { position: 'absolute' },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, overflow: 'hidden' },
  avatarGradient: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  avatarZodiac: { fontSize: 36 },
  avatarAura: { position: 'absolute', width: 108, height: 108, borderRadius: 54, opacity: 0.5 },
  profileName: {
    fontFamily: typography.fonts.display,
    fontSize: typography.sizes.display1,
    color: colors.textPrimary,
    letterSpacing: 0.3,
    marginBottom: 2,
    ...Platform.select({
      ios: { textShadowColor: 'rgba(212, 165, 71, 0.08)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
      android: {},
    }),
  },
  profileBirthDate: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  bigThreeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  bigThreeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bigThreeSymbol: { fontFamily: typography.fonts.body, fontSize: typography.sizes.body, color: colors.primary },
  bigThreeSign: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.2 },
  bigThreeEmoji: { fontSize: 14 },
  bigThreeSeparator: { fontFamily: typography.fonts.body, fontSize: typography.sizes.body, color: colors.textMuted, marginHorizontal: spacing.xs },
  memberSince: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted, marginBottom: spacing.sm },
  memoryCounterBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  memoryCounterText: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.primary, letterSpacing: 0.2 },

  // Card base
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...Platform.select({
      ios: { shadowColor: colors.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16 },
      android: { elevation: 3 },
    }),
  },

  // Chart
  chartCard: { padding: spacing.lg, marginBottom: spacing.md },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chartTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2 },
  chartTapHint: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.primary },
  chartContentRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  miniChartWrap: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden' },
  miniChartGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chartPlacements: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chartPlacementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  chartPlacementRowTight: { paddingTop: 0 },
  chartPlacementSymbol: { fontFamily: typography.fonts.body, fontSize: typography.sizes.heading3, color: colors.primary, width: 24, textAlign: 'center' },
  chartPlacementLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, marginLeft: spacing.xs, flex: 1 },
  chartPlacementSign: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary, letterSpacing: 0.2 },
  chartBirthData: { gap: spacing.xs },
  chartBirthRow: { flexDirection: 'row', alignItems: 'center' },
  chartBirthLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted, width: 48 },
  chartBirthValue: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textSecondary, flex: 1 },

  // Sections
  sectionBlock: { marginBottom: spacing.md },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2 },

  // Journal
  addButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { fontSize: 20, color: colors.primary, fontFamily: typography.fonts.bodySemiBold },
  emptyStateCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
  },
  emptyStateEmoji: { fontSize: 26, marginBottom: spacing.sm },
  emptyStateText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  journalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  journalCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  journalDate: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.caption, color: colors.textMuted },
  journalMood: { fontSize: 18 },
  journalTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.body, color: colors.textPrimary, marginBottom: 2 },
  journalPreview: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textSecondary, lineHeight: 18 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg },
  modalTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary },
  modalSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.bodySmall, color: colors.textMuted, marginBottom: spacing.sm },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  moodChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.surface },
  moodChipActive: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
  moodChipText: { fontSize: 16 },
  journalInput: { minHeight: 120, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing.md, fontFamily: typography.fonts.body, color: colors.textPrimary, marginBottom: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.sm },
  modalCancel: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, alignItems: 'center' },
  modalCancelText: { fontFamily: typography.fonts.bodySemiBold, color: colors.textSecondary },
  modalSave: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  modalSaveText: { fontFamily: typography.fonts.bodySemiBold, color: colors.white },
  entryModalCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg },
  entryModalTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, marginBottom: spacing.sm },
  entryModalBody: { fontFamily: typography.fonts.body, fontSize: typography.sizes.body, color: colors.textSecondary, lineHeight: 20 },

  // Achievements
  progressCard: { backgroundColor: colors.white, borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.md },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  progressLabel: { fontFamily: typography.fonts.bodyMedium, fontSize: typography.sizes.bodySmall, color: colors.textSecondary },
  progressValue: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary },
  progressBarTrack: { height: 6, backgroundColor: colors.surface, borderRadius: 999, marginBottom: spacing.sm },
  progressBarFill: { height: 6, backgroundColor: colors.primary, borderRadius: 999 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard: { width: (CARD_WIDTH - spacing.sm) / 2, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  badgeEmoji: { fontSize: 22, marginBottom: spacing.xs },
  badgeTitle: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.textPrimary },
  badgeSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, marginBottom: spacing.xs },
  badgeProgressTrack: { height: 5, backgroundColor: colors.surface, borderRadius: 999 },
  badgeProgressFill: { height: 5, backgroundColor: colors.accentGold, borderRadius: 999 },
  celebrationText: { fontFamily: typography.fonts.body, fontSize: typography.sizes.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },

  // Timeline
  timelineRow: { gap: spacing.sm, paddingBottom: spacing.xs },
  timelineCard: { width: 180, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  timelineDate: { fontFamily: typography.fonts.bodySemiBold, fontSize: typography.sizes.bodySmall, color: colors.primary, marginBottom: 4 },
  timelineTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.body, color: colors.textPrimary, marginBottom: 2 },
  timelineSubtitle: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted },

  // Settings
  settingsSection: { marginBottom: spacing.md },
  settingsSectionTitle: { fontFamily: typography.fonts.displaySemiBold, fontSize: typography.sizes.heading3, color: colors.textPrimary, letterSpacing: 0.2, marginBottom: spacing.sm },
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
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
    backgroundColor: colors.white,
    color: colors.primary,
    fontFamily: typography.fonts.bodySemiBold,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  appVersion: { fontFamily: typography.fonts.body, fontSize: typography.sizes.tiny, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, marginBottom: spacing.md },
});
