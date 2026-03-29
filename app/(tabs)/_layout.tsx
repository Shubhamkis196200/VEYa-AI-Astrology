/**
 * VEYa — Tab Layout
 * SIMPLIFIED: Using Ionicons instead of custom SVG to eliminate
 * JS thread blocking on first render (was causing 10-20 taps needed).
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  background: '#FDFBF7',
  surface: '#FFFFFF',
  primary: '#8B5CF6',
  primaryLight: 'rgba(139, 92, 246, 0.12)',
  accentGold: '#D4A547',
  textPrimary: '#1A1A2E',
  textMuted: '#9B9BAD',
  border: '#E5DFD5',
};

// ─────────────────────────────────────────────────────────────
// ERROR BOUNDARY
// ─────────────────────────────────────────────────────────────

class TabsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: string }
> {
  state = { hasError: false, error: null as Error | null, errorInfo: '' };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Tabs] render error', error, info);
    this.setState({
      errorInfo: `${error?.message}\n\nComponent: ${info?.componentStack?.slice(0, 300)}`,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Debug Error Info</Text>
          <ScrollView style={{ maxHeight: 300, marginVertical: 12 }}>
            <Text style={{ fontSize: 12, color: '#E8664D', fontFamily: 'monospace' }}>
              {this.state.error?.message || 'No message'}
            </Text>
            <Text style={{ fontSize: 10, color: '#666', marginTop: 8, fontFamily: 'monospace' }}>
              {this.state.errorInfo}
            </Text>
          </ScrollView>
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
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const safeBottom = insets.bottom;
  const tabBarHeight = Platform.OS === 'ios'
    ? 60 + safeBottom
    : 62 + safeBottom;

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
            paddingTop: 8,
            paddingBottom: safeBottom > 0 ? safeBottom + 4 : 12,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
              },
              android: { elevation: 4 },
            }),
          },
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 11,
            marginTop: 2,
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'sunny' : 'sunny-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="rituals"
          options={{
            title: 'Rituals',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'moon' : 'moon-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="you"
          options={{
            title: 'You',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />

      </Tabs>
    </TabsErrorBoundary>
  );
}

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
    color: colors.textPrimary,
    marginBottom: 8,
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
