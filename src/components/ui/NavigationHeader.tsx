/**
 * NavigationHeader - Consistent header for sub-screens
 * 
 * Provides:
 * - Back button with haptic feedback
 * - Title and subtitle
 * - Optional right action button
 * - Breadcrumb support
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

// Design tokens
const colors = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  primary: '#8B5CF6',
  textPrimary: '#1A1A2E',
  textMuted: '#9B9BAD',
  border: '#E5DFD5',
  accentGold: '#D4A547',
};

// Haptic feedback helper
async function hapticLight() {
  if (Platform.OS !== 'web') {
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }
}

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
  breadcrumbs?: string[];
}

function BackIcon({ color = colors.textPrimary }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 19L8 12L15 5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function NavigationHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
  breadcrumbs,
}: NavigationHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = async () => {
    await hapticLight();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={[
        styles.container,
        { paddingTop: insets.top + 8 }
      ]}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <View style={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <Text style={styles.breadcrumbSeparator}>/</Text>}
              <Text style={styles.breadcrumbText}>{crumb}</Text>
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Main Header Row */}
      <View style={styles.headerRow}>
        {/* Back Button */}
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            hitSlop={12}
          >
            <BackIcon />
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}

        {/* Title Area */}
        <View style={styles.titleArea}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>

        {/* Right Action */}
        {rightAction ? (
          <Pressable
            onPress={async () => {
              await hapticLight();
              rightAction.onPress();
            }}
            style={({ pressed }) => [
              styles.rightAction,
              pressed && styles.rightActionPressed,
            ]}
            hitSlop={8}
          >
            <Text style={styles.rightActionText}>{rightAction.label}</Text>
          </Pressable>
        ) : (
          <View style={styles.rightActionPlaceholder} />
        )}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Simple Back Button for inline use
// ─────────────────────────────────────────────────────────────

export function SimpleBackButton({ 
  onPress, 
  label = 'Back' 
}: { 
  onPress?: () => void; 
  label?: string;
}) {
  const handlePress = async () => {
    await hapticLight();
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.simpleBackButton,
        pressed && styles.simpleBackButtonPressed,
      ]}
      hitSlop={12}
    >
      <BackIcon color={colors.primary} />
      <Text style={styles.simpleBackLabel}>{label}</Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Breadcrumbs
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breadcrumbText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breadcrumbSeparator: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginHorizontal: 6,
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Back Button
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonPressed: {
    backgroundColor: colors.border,
  },
  backButtonPlaceholder: {
    width: 40,
  },

  // Title
  titleArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },

  // Right Action
  rightAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: `${colors.primary}12`,
  },
  rightActionPressed: {
    backgroundColor: `${colors.primary}20`,
  },
  rightActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: colors.primary,
  },
  rightActionPlaceholder: {
    width: 40,
  },

  // Simple Back Button
  simpleBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
  },
  simpleBackButtonPressed: {
    opacity: 0.7,
  },
  simpleBackLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
});
