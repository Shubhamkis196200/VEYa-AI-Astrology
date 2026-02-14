/**
 * VEYa Loading & Error States — Reusable UI components
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

// ─────────────────────────────────────────────────────────────
// LOADING STATES
// ─────────────────────────────────────────────────────────────

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingSpinner({ message = 'Loading...', size = 'large' }: LoadingProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(200)} 
      exiting={FadeOut.duration(200)}
      style={styles.loadingContainer}
    >
      <ActivityIndicator size={size} color={colors.accentGold} />
      <Text style={styles.loadingText}>{message}</Text>
    </Animated.View>
  );
}

export function CosmicLoader({ message = 'Consulting the stars...' }: { message?: string }) {
  const rotation = useSharedValue(0);
  
  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View 
      entering={FadeIn.duration(300)} 
      exiting={FadeOut.duration(200)}
      style={styles.cosmicContainer}
    >
      <Animated.Text style={[styles.cosmicEmoji, animatedStyle]}>✨</Animated.Text>
      <Text style={styles.cosmicText}>{message}</Text>
    </Animated.View>
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
      <Text style={styles.errorEmoji}>😔</Text>
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorText}>{message}</Text>
      {showRetry && onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

export function RateLimitError({ retryAfter, onRetry }: { retryAfter: number; onRetry?: () => void }) {
  const seconds = Math.ceil(retryAfter / 1000);
  
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>⏳</Text>
      <Text style={styles.errorTitle}>Taking a breath...</Text>
      <Text style={styles.errorText}>
        You've been asking lots of questions! Give me {seconds} seconds to catch up.
      </Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.errorContainer}>
      <Text style={styles.errorEmoji}>📡</Text>
      <Text style={styles.errorTitle}>No Connection</Text>
      <Text style={styles.errorText}>
        Please check your internet connection and try again.
      </Text>
      {onRetry && (
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
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
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message && <Text style={styles.emptyText}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
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
    padding: 24,
  },
  loadingText: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  cosmicContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cosmicEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  cosmicText: {
    fontFamily: typography.fonts.displayRegular,
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // Error
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.accentGold,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 15,
    color: '#1B0B38',
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: typography.fonts.display,
    fontSize: 20,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: typography.fonts.body,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  actionButton: {
    marginTop: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
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
  ErrorMessage,
  RateLimitError,
  NetworkError,
  EmptyState,
};
