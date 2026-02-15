/**
 * VEYa — Tab Layout
 * 
 * SIMPLIFIED: Only 4 tabs for better UX
 * - Today: Daily insights, weather, affirmation
 * - Chat: Talk to VEYa
 * - Discover: Chart, Tarot, Compatibility
 * - You: Profile, Settings
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────
// COLORS (from design system)
// ─────────────────────────────────────────────────────────────

const colors = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  primary: '#8B5CF6',
  textMuted: '#9B9BAD',
  border: '#E5DFD5',
};

// ─────────────────────────────────────────────────────────────
// TAB ICONS
// ─────────────────────────────────────────────────────────────

function TodayIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <Path d="M12 2V4M12 20V22M2 12H4M20 12H22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M4.93 19.07L6.34 17.66M17.66 6.34L19.07 4.93" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChatIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 11.5C21 16.75 16.75 21 11.5 21C10.15 21 8.88 20.7 7.75 20.17L3 21L3.83 16.25C3.3 15.12 3 13.85 3 12.5C3 7.25 7.25 3 12.5 3C17.75 3 22 7.25 22 12.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DiscoverIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path d="M14.5 9.5L13 13L9.5 14.5L11 11L14.5 9.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function YouIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M4 20C4 17.2386 6.23858 15 9 15H15C17.7614 15 20 17.2386 20 20V21H4V20Z" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// ERROR BOUNDARY
// ─────────────────────────────────────────────────────────────

class TabsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[Tabs] render error', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Loading VEYa...</Text>
          <Text style={styles.errorMessage}>
            If this keeps happening, tap to retry.
          </Text>
          <Pressable onPress={this.handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Ensure enough space for phones with gesture navigation bars
  const bottomPadding = Math.max(insets.bottom, 20);
  const tabBarHeight = Platform.OS === 'ios' ? 60 + bottomPadding : 70 + bottomPadding;

  return (
    <TabsErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingTop: 10,
            paddingBottom: bottomPadding + 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 11,
            marginTop: 2,
          },
        }}
      >
        {/* Main 4 tabs */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color }) => <TodayIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => <ChatIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <DiscoverIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="you"
          options={{
            title: 'You',
            tabBarIcon: ({ color }) => <YouIcon color={color} />,
          }}
        />
        
        {/* Hidden screens (accessible via navigation, not tabs) */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="rituals"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </TabsErrorBoundary>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B6B80',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
});
