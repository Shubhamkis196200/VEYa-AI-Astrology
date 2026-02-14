// ============================================================================
// VEYa Story Viewer — Full-screen immersive stories
// ============================================================================

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
  PanResponder,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStoryStore } from '@/stores/storyStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PARTICLES = Array.from({ length: 10 }).map((_, index) => ({
  id: index,
  size: 6 + (index % 4) * 4,
  left: 20 + (index * 29) % 320,
  top: 40 + (index * 67) % 520,
  delay: index * 400,
}));

function Particle({ size, left, top, delay }: { size: number; left: number; top: number; delay: number }) {
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 6000 }),
      -1,
      true
    );
  }, [float]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -14], Extrapolate.CLAMP) }],
    opacity: interpolate(float.value, [0, 1], [0.25, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { width: size, height: size, borderRadius: size / 2, left, top },
        animatedStyle,
      ]}
    />
  );
}

export function StoryViewer() {
  const {
    stories,
    currentIndex,
    isViewerOpen,
    closeViewer,
    nextStory,
    previousStory,
    markViewed,
  } = useStoryStore();

  const progress = useSharedValue(0);
  const translateY = useSharedValue(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!isViewerOpen || !currentStory) return;

    markViewed(currentStory.id);
    progress.value = 0;
    translateY.value = 0;

    progress.value = withTiming(1, { duration: 5000 }, (finished) => {
      if (finished) {
        runOnJS(handleAdvance)();
      }
    });
  }, [currentIndex, isViewerOpen]);

  const handleAdvance = () => {
    if (currentIndex >= stories.length - 1) {
      closeViewer();
      return;
    }
    nextStory();
  };

  const handleRetreat = () => {
    if (currentIndex === 0) return;
    previousStory();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 12,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.value = gesture.dy;
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 120) {
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
              runOnJS(closeViewer)();
            });
          } else {
            translateY.value = withTiming(0, { duration: 200 });
          }
        },
      }),
    [closeViewer]
  );

  const viewerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!currentStory) return null;

  return (
    <Modal visible={isViewerOpen} animationType="fade" transparent>
      <Animated.View style={[styles.overlay, viewerStyle]} {...panResponder.panHandlers}>
        <LinearGradient colors={currentStory.colors} style={styles.gradient}>
          <View style={styles.particlesLayer} pointerEvents="none">
            {PARTICLES.map((particle) => (
              <Particle key={particle.id} {...particle} />
            ))}
          </View>

          {/* Progress Bars */}
          <View style={styles.progressRow}>
            {stories.map((story, index) => {
              const isCurrent = index === currentIndex;
              const isCompleted = index < currentIndex;
              return (
                <View key={story.id} style={styles.progressTrack}>
                  {isCurrent ? (
                    <Animated.View style={[styles.progressFill, progressStyle]} />
                  ) : (
                    <View
                      style={[
                        styles.progressFill,
                        { width: isCompleted ? '100%' : '0%' },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Tap Zones */}
          <View style={styles.tapZones}>
            <Pressable
              style={styles.tapZone}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleRetreat();
              }}
            />
            <Pressable
              style={styles.tapZone}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleAdvance();
              }}
            />
          </View>

          {/* Story Content */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.cardContent}>
            <Text style={styles.storyEmoji}>{currentStory.emoji}</Text>
            <Text style={styles.storyTitle}>{currentStory.title}</Text>
            <Text style={styles.storyBody}>{currentStory.body}</Text>

            <Pressable style={styles.actionButton}>
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>{currentStory.actionLabel}</Text>
              </LinearGradient>
            </Pressable>

            <Text style={styles.closeHint}>Swipe down to close</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  particlesLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
  },
  tapZones: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tapZone: {
    width: SCREEN_WIDTH / 2,
  },
  cardContent: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  storyEmoji: {
    fontSize: 52,
    marginBottom: spacing.md,
  },
  storyTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  storyBody: {
    fontFamily: typography.fonts.body,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionButtonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  closeHint: {
    fontFamily: typography.fonts.body,
    fontSize: typography.sizes.caption,
    color: 'rgba(255,255,255,0.6)',
  },
});
