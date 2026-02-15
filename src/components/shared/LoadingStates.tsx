/**
 * VEYa Loading & Error States — Unified UI components
 * 
 * All components use the light premium theme for consistency.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { borderRadius } from '../../theme/borderRadius';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// LOADING STATES
// ─────────────────────────────────────────────────────────────

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message = 'Loading...', size = 'large' }: LoadingProps) {
  const rotation = useSharedValue(0);
  
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={FadeOut.duration(200)}
      style={styles.loadingContainer}
    >
      <Animated.View style={[styles.spinnerCircle, animatedStyle]}>
        <View style={styles.spinnerInner} />
      </Animated.View>
      <Text style={styles.loadingText}>{message}</Text>
    </Animated.View>
  );
}

export function CosmicLoader({ message = 'Consulting the stars...' }: { message?: string }) {
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);
  
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.1]) }],
  }));

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(200)}
      style={styles.cosmicContainer}
    >
      <Animated.View style={[styles.cosmicGlow, glowStyle]} />
      <Animated.Text style={[styles.cosmicEmoji, animatedStyle]}>✨</Animated.Text>
      <Text style={styles.cosmicText}>{message}</Text>
    </Animated.View>
  );
}

// Inline loading indicator for buttons/cards
export function InlineLoader({ color = colors.accentGold }: { color?: string }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  React.useEffect(() => {
    const animate = (dot: Animated.SharedValue<number>, delay: number) => {
      dot.value = withRepeat(
        withSequence(
          withTiming(0, { duration: delay }),
          withTiming(1, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      );
    };
    animate(dot1, 0);
    animate(dot2, 150);
    animate(dot3, 300);
  }, []);

  const dotStyle = (dot: Animated.SharedValue<number>) => useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(dot.value, [0, 1], [0, -6]) }],
    opacity: interpolate(dot.value, [0, 1], [0.5, 1]),
  }));

  return (
    <View style={styles.inlineLoaderRow}>
      <Animated.View style={[styles.inlineDot, { backgroundColor: color }, dotStyle(dot1)]} />
      <Animated.View style={[styles.inlineDot, { backgroundColor: color }, dotStyle(dot2)]} />
      <Animated.View style={[styles.inlineDot, { backgroundColor: color }, dotStyle(dot3)]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SKELETON LOADERS
// ─────────────────────────────────────────────────────────────

export function SkeletonBox({ 
  width = '100%', 
  height = 20, 
  borderRadiusValue = borderRadius.sm 
}: { 
  width?: number | string; 
  height?: number; 
  borderRadiusValue?: number;
}) {
  const shimmer = useSharedValue(0);
  
  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]) }],
  }));

  return (
    <View style={[styles.skeletonBox, { width, height, borderRadius: borderRadiusValue }]}>
      <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <SkeletonBox width={140} height={16} />
      <View style={{ height: 12 }} />
      <SkeletonBox width="100%" height={60} borderRadiusValue={borderRadius.md} />
      <View style={{ height: 12 }} />
      <SkeletonBox width="70%" height={14} />
    </View>
  );
}

export function SkeletonListItem() {
  return (
    <View style={styles.skeletonListItem}>
      <SkeletonBox width={48} height={48} borderRadiusValue={24} />
      <View style={styles.skeletonListContent}>
        <SkeletonBox width="60%" height={14} />
        <View style={{ height: 8 }} />
        <SkeletonBox width="90%" height={12} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// ERROR STATES
// ─────────────────────────────────────────────────────────────

interface ErrorProps {
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorMessage({ 
  message = 'Something went wrong', 
  onRetry, 
  showRetry = true 
}: ErrorProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      style={styles.errorContainer}
    >
      <View style={styles.errorCard}>
        <View style={styles.errorIconCircle}>
          <Text style={styles.errorEmoji}>😔</Text>
        </View>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{message}</Text>
        {showRetry && onRetry && (
          <Pressable 
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} 
            onPress={onRetry}
          >
            <LinearGradient
              colors={[colors.accentGold, '#B8923E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function RateLimitError({ retryAfter, onRetry }: { retryAfter: number; onRetry?: () => void }) {
  const seconds = Math.ceil(retryAfter / 1000);
  
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <View style={styles.errorIconCircle}>
          <Text style={styles.errorEmoji}>⏳</Text>
        </View>
        <Text style={styles.errorTitle}>Taking a breath...</Text>
        <Text style={styles.errorText}>
          You've been asking lots of questions! Give me {seconds} seconds to catch up.
        </Text>
        {onRetry && (
          <Pressable 
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} 
            onPress={onRetry}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <View style={styles.errorIconCircle}>
          <Text style={styles.errorEmoji}>📡</Text>
        </View>
        <Text style={styles.errorTitle}>No Connection</Text>
        <Text style={styles.errorText}>
          Please check your internet connection and try again.
        </Text>
        {onRetry && (
          <Pressable 
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]} 
            onPress={onRetry}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.retryGradient}
            >
              <Text style={styles.retryText}>Retry</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATES
// ─────────────────────────────────────────────────────────────

interface EmptyProps {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  emoji = '🌙', 
  title, 
  message, 
  actionLabel, 
  onAction 
}: EmptyProps) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyEmoji}>{emoji}</Text>
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        {message && <Text style={styles.emptyText}>{message}</Text>}
        {actionLabel && onAction && (
          <Pressable 
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]} 
            onPress={onAction}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Specific empty states for common use cases
export function EmptyJournal({ onCreateEntry }: { onCreateEntry: () => void }) {
  return (
    <EmptyState
      emoji="📔"
      title="No Journal Entries Yet"
      message="Start your cosmic journey by writing your first reflection."
      actionLabel="Write First Entry"
      onAction={onCreateEntry}
    />
  );
}

export function EmptyChat({ onStartChat }: { onStartChat: () => void }) {
  return (
    <EmptyState
      emoji="✨"
      title="Ask VEYa Anything"
      message="Your personal AI astrologer is ready to guide you through the stars."
      actionLabel="Start Conversation"
      onAction={onStartChat}
    />
  );
}

export function EmptyResults() {
  return (
    <EmptyState
      emoji="🔍"
      title="No Results Found"
      message="Try adjusting your search or filters."
    />
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  spinnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'rgba(212, 165, 71, 0.2)',
    borderTopColor: colors.accentGold,
  },
  spinnerInner: {
    display: 'none',
  },
  loadingText: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  cosmicContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  cosmicGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 165, 71, 0.15)',
  },
  cosmicEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  cosmicText: {
    fontFamily: typography.fonts.displayRegular,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  inlineLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Skeleton
  skeletonBox: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH * 2,
  },
  skeletonCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skeletonListContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232, 102, 77, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(232, 102, 77, 0.15)',
  },
  errorEmoji: {
    fontSize: 28,
  },
  errorTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  retryButton: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  retryButtonPressed: {
    opacity: 0.9,
  },
  retryGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  retryText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(212, 165, 71, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 165, 71, 0.15)',
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  actionButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.sm,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  actionText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 15,
    color: colors.primary,
  },
});

export default {
  LoadingSpinner,
  CosmicLoader,
  InlineLoader,
  SkeletonBox,
  SkeletonCard,
  SkeletonListItem,
  ErrorMessage,
  RateLimitError,
  NetworkError,
  EmptyState,
  EmptyJournal,
  EmptyChat,
  EmptyResults,
};
