// ============================================================================
// VEYa Soundscape Player UI — Ambient Audio Interface
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import {
  SOUNDSCAPES,
  useSoundscapeStore,
  type Soundscape,
} from '@/services/soundscapeService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

// ---------------------------------------------------------------------------
// Soundscape Card
// ---------------------------------------------------------------------------

interface SoundscapeCardProps {
  soundscape: Soundscape;
  isPlaying: boolean;
  isFavorite: boolean;
  onPlay: () => void;
  onFavorite: () => void;
  index: number;
}

function SoundscapeCard({ soundscape, isPlaying, isFavorite, onPlay, onFavorite, index }: SoundscapeCardProps) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    if (isPlaying) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.5,
    transform: [{ scale: 1 + pulse.value * 0.1 }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(index * 60)}
      style={[styles.cardContainer, animatedStyle]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPlay();
        }}
        onPressIn={() => { scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
      >
        <LinearGradient
          colors={[soundscape.color, `${soundscape.color}CC`] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Playing Glow Effect */}
          {isPlaying && (
            <Animated.View style={[styles.playingGlow, glowStyle]}>
              <View style={[styles.glowCircle, { backgroundColor: soundscape.color }]} />
            </Animated.View>
          )}

          {/* Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{soundscape.emoji}</Text>
              {isPlaying && (
                <View style={styles.playingBadge}>
                  <Text style={styles.playingText}>♪ Playing</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardName}>{soundscape.name}</Text>
            <Text style={styles.cardDescription}>{soundscape.description}</Text>
            {soundscape.frequency && (
              <Text style={styles.cardFrequency}>{soundscape.frequency} Hz</Text>
            )}
          </View>

          {/* Favorite Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onFavorite();
            }}
            style={styles.favoriteButton}
            hitSlop={12}
          >
            <Text style={styles.favoriteIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          </Pressable>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Category Filter
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🎵' },
  { id: 'cosmic', label: 'Cosmic', emoji: '🌌' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'meditation', label: 'Meditation', emoji: '🧘' },
  { id: 'zodiac', label: 'Zodiac', emoji: '♈' },
];

// ---------------------------------------------------------------------------
// Mini Player (shows at bottom when playing)
// ---------------------------------------------------------------------------

interface MiniPlayerProps {
  soundscape: Soundscape;
  onStop: () => void;
  onExpand: () => void;
}

function MiniPlayer({ soundscape, onStop, onExpand }: MiniPlayerProps) {
  return (
    <Animated.View entering={FadeInUp.duration(300)} style={styles.miniPlayer}>
      <Pressable onPress={onExpand} style={styles.miniPlayerContent}>
        <LinearGradient
          colors={[soundscape.color, `${soundscape.color}DD`] as const}
          style={styles.miniPlayerGradient}
        >
          <Text style={styles.miniEmoji}>{soundscape.emoji}</Text>
          <View style={styles.miniInfo}>
            <Text style={styles.miniName}>{soundscape.name}</Text>
            <Text style={styles.miniDescription}>♪ Now playing</Text>
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onStop();
            }}
            style={styles.miniStopButton}
          >
            <Text style={styles.miniStopText}>⏹</Text>
          </Pressable>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SoundscapePlayer() {
  const {
    currentSoundscape,
    isPlaying,
    volume,
    favorites,
    autoPlayDuringReadings,
    play,
    stop,
    toggleFavorite,
    setVolume,
    setAutoPlay,
  } = useSoundscapeStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  const filteredSoundscapes = selectedCategory === 'all'
    ? SOUNDSCAPES
    : SOUNDSCAPES.filter(s => s.category === selectedCategory);

  const currentPlaying = SOUNDSCAPES.find(s => s.id === currentSoundscape);

  const handlePlay = useCallback(async (soundscapeId: string) => {
    if (currentSoundscape === soundscapeId && isPlaying) {
      await stop();
    } else {
      await play(soundscapeId);
    }
  }, [currentSoundscape, isPlaying, play, stop]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Soundscapes</Text>
            <Text style={styles.subtitle}>Ambient sounds for your cosmic journey</Text>
          </View>
          <Pressable
            onPress={() => setShowSettings(true)}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View entering={FadeIn.duration(400).delay(200)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBar}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat.id);
              }}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === cat.id && styles.categoryLabelActive,
              ]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Soundscape Grid */}
      <ScrollView
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridRow}>
          {filteredSoundscapes.map((soundscape, index) => (
            <SoundscapeCard
              key={soundscape.id}
              soundscape={soundscape}
              isPlaying={currentSoundscape === soundscape.id && isPlaying}
              isFavorite={favorites.includes(soundscape.id)}
              onPlay={() => handlePlay(soundscape.id)}
              onFavorite={() => toggleFavorite(soundscape.id)}
              index={index}
            />
          ))}
        </View>
        <View style={{ height: isPlaying ? 100 : 40 }} />
      </ScrollView>

      {/* Mini Player */}
      {isPlaying && currentPlaying && (
        <MiniPlayer
          soundscape={currentPlaying}
          onStop={stop}
          onExpand={() => {}}
        />
      )}

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View style={styles.settingsOverlay}>
          <Animated.View entering={FadeInUp.duration(300)} style={styles.settingsModal}>
            <LinearGradient
              colors={['#1B0B38', '#2D1B4E'] as const}
              style={styles.settingsContent}
            >
              <Text style={styles.settingsTitle}>⚙️ Soundscape Settings</Text>

              {/* Volume */}
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Volume</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={1}
                  value={volume}
                  onValueChange={setVolume}
                  minimumTrackTintColor="#8B5CF6"
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor="#FFFFFF"
                />
                <Text style={styles.settingValue}>{Math.round(volume * 100)}%</Text>
              </View>

              {/* Auto-play */}
              <Pressable
                onPress={() => setAutoPlay(!autoPlayDuringReadings)}
                style={styles.settingRow}
              >
                <Text style={styles.settingLabel}>Auto-play during readings</Text>
                <Text style={styles.settingToggle}>
                  {autoPlayDuringReadings ? '✅' : '⬜'}
                </Text>
              </Pressable>

              {/* Close */}
              <Pressable
                onPress={() => setShowSettings(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>Done</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },
  settingsButton: {
    padding: spacing.xs,
  },
  settingsIcon: {
    fontSize: 24,
  },

  // Category Bar
  categoryBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: '#8B5CF6',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },

  // Grid
  grid: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: spacing.lg,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // Card
  cardContainer: {
    width: '48%',
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 140,
    overflow: 'hidden',
  },
  playingGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
  },
  glowCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardEmoji: {
    fontSize: 28,
  },
  playingBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playingText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  cardName: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardDescription: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  cardFrequency: {
    fontFamily: typography.fonts.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
  },
  favoriteIcon: {
    fontSize: 16,
  },

  // Mini Player
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  miniPlayerContent: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  miniPlayerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  miniEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  miniInfo: {
    flex: 1,
  },
  miniName: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  miniDescription: {
    fontFamily: typography.fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  miniStopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStopText: {
    fontSize: 16,
  },

  // Settings Modal
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  settingsContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },
  settingsTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  settingLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  settingValue: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    width: 40,
    textAlign: 'right',
  },
  settingToggle: {
    fontSize: 20,
  },
  slider: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  closeButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
  },
  closeText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
