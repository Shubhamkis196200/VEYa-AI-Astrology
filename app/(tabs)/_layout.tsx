/**
 * VEYa — Tab Layout (Phase 2: Navigation Overhaul)
 * 
 * REDESIGNED FOR DISCOVERABILITY:
 * - Clear icons with labels (always visible)
 * - Active state highlighting with smooth animations
 * - Consistent design language
 * - Icons: Home (Today), Compass (Discover), MessageCircle (Chat), User (Profile)
 */

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

// ─────────────────────────────────────────────────────────────
// COLORS (from design system)
// ─────────────────────────────────────────────────────────────

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
// ANIMATED TAB ICON WRAPPER
// ─────────────────────────────────────────────────────────────

interface AnimatedTabIconProps {
  focused: boolean;
  children: React.ReactNode;
  label: string;
}

function AnimatedTabIcon({ focused, children, label }: AnimatedTabIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const translateY = useSharedValue(focused ? -2 : 0);
  const bgOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, { damping: 12, stiffness: 200 });
    translateY.value = withSpring(focused ? -2 : 0, { damping: 12, stiffness: 200 });
    bgOpacity.value = withTiming(focused ? 1 : 0, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [focused]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <Animated.View style={[styles.tabIconContainer, containerStyle]}>
      <Animated.View style={[styles.tabIconBg, bgStyle]} />
      <View style={styles.tabIconInner}>
        {children}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// TAB ICONS - Redesigned for clarity
// ─────────────────────────────────────────────────────────────

function TodayIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <AnimatedTabIcon focused={focused} label="Today">
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={focused ? colors.accentGold : color} />
            <Stop offset="100%" stopColor={focused ? colors.primary : color} />
          </LinearGradient>
        </Defs>
        {/* Sun center */}
        <Circle 
          cx="12" 
          cy="12" 
          r={focused ? "5.5" : "5"} 
          fill={focused ? "url(#sunGrad)" : "none"}
          stroke={color} 
          strokeWidth="2" 
        />
        {/* Sun rays */}
        <G stroke={color} strokeWidth="2" strokeLinecap="round">
          <Path d="M12 2V4" />
          <Path d="M12 20V22" />
          <Path d="M4 12H2" />
          <Path d="M22 12H20" />
          <Path d="M19.07 4.93L17.66 6.34" />
          <Path d="M6.34 17.66L4.93 19.07" />
          <Path d="M19.07 19.07L17.66 17.66" />
          <Path d="M6.34 6.34L4.93 4.93" />
        </G>
      </Svg>
    </AnimatedTabIcon>
  );
}

function DiscoverIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <AnimatedTabIcon focused={focused} label="Discover">
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="compassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accentGold} />
          </LinearGradient>
        </Defs>
        {/* Compass outer ring */}
        <Circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke={color} 
          strokeWidth="2" 
          fill="none"
        />
        {/* Compass needle */}
        <Path 
          d="M16.24 7.76L14.12 14.12L7.76 16.24L9.88 9.88L16.24 7.76Z" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill={focused ? "url(#compassGrad)" : "none"}
        />
      </Svg>
    </AnimatedTabIcon>
  );
}

function RitualsIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <AnimatedTabIcon focused={focused} label="Rituals">
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accentGold} />
          </LinearGradient>
        </Defs>
        <Path
          d="M20 14.5C18.7 16.2 16.7 17.3 14.4 17.3C10.5 17.3 7.3 14.1 7.3 10.2C7.3 7.9 8.4 5.9 10.1 4.6C6.5 4.9 3.7 7.9 3.7 11.5C3.7 15.3 6.8 18.4 10.6 18.4C14.3 18.4 17.4 15.7 17.7 12C18.7 12.3 19.4 13.2 20 14.5Z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={focused ? "url(#moonGrad)" : "none"}
          fillOpacity={focused ? 0.2 : 0}
        />
      </Svg>
    </AnimatedTabIcon>
  );
}

function ChatIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <AnimatedTabIcon focused={focused} label="Chat">
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="chatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor="#6366F1" />
          </LinearGradient>
        </Defs>
        {/* Chat bubble */}
        <Path 
          d="M21 11.5C21 16.1944 17.1944 20 12.5 20C11.1401 20 9.85875 19.6894 8.72 19.1401L4 20L4.86 16.28C4.31063 15.1412 4 13.8599 4 12.5C4 7.80558 7.80558 4 12.5 4C17.1944 4 21 7.80558 21 12.5" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill={focused ? "url(#chatGrad)" : "none"}
          fillOpacity={focused ? 0.15 : 0}
        />
        {/* Typing dots when focused */}
        {focused && (
          <G fill={color}>
            <Circle cx="9" cy="12" r="1.2" />
            <Circle cx="12.5" cy="12" r="1.2" />
            <Circle cx="16" cy="12" r="1.2" />
          </G>
        )}
      </Svg>
    </AnimatedTabIcon>
  );
}

function YouIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <AnimatedTabIcon focused={focused} label="You">
      <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.accentGold} />
          </LinearGradient>
        </Defs>
        {/* User head */}
        <Circle 
          cx="12" 
          cy="8" 
          r="4" 
          stroke={color} 
          strokeWidth="2"
          fill={focused ? "url(#userGrad)" : "none"}
          fillOpacity={focused ? 0.2 : 0}
        />
        {/* User body */}
        <Path 
          d="M4 20C4 17.2386 6.23858 15 9 15H15C17.7614 15 20 17.2386 20 20V21H4V20Z" 
          stroke={color} 
          strokeWidth="2"
          fill={focused ? "url(#userGrad)" : "none"}
          fillOpacity={focused ? 0.15 : 0}
        />
      </Svg>
    </AnimatedTabIcon>
  );
}

// ─────────────────────────────────────────────────────────────
// CUSTOM TAB LABEL
// ─────────────────────────────────────────────────────────────

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  const opacity = useSharedValue(focused ? 1 : 0.7);
  const scale = useSharedValue(focused ? 1 : 0.95);

  useEffect(() => {
    opacity.value = withTiming(focused ? 1 : 0.7, { duration: 200 });
    scale.value = withSpring(focused ? 1 : 0.95, { damping: 15, stiffness: 200 });
  }, [focused]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text 
      style={[
        styles.tabLabel, 
        { color: focused ? colors.primary : colors.textMuted },
        style
      ]}
    >
      {label}
    </Animated.Text>
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
          <Text style={styles.errorTitle}>We hit a snag</Text>
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
  const bottomPadding = Math.max(insets.bottom, 20);
  const tabBarHeight = Platform.OS === 'ios' ? 70 + bottomPadding : 80 + bottomPadding;

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
            paddingTop: 12,
            paddingBottom: bottomPadding + 8,
            // Subtle shadow for depth
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
              },
              android: {
                elevation: 8,
              },
            }),
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter-SemiBold',
            fontSize: 11,
            marginTop: 4,
            letterSpacing: 0.2,
          },
        }}
      >
        {/* Today Tab - Home screen with daily insights */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, focused }) => <TodayIcon color={color} focused={focused} />,
            tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} />,
          }}
        />
        
        {/* Discover Tab - Explore all features */}
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, focused }) => <DiscoverIcon color={color} focused={focused} />,
            tabBarLabel: ({ focused }) => <TabLabel label="Discover" focused={focused} />,
          }}
        />

        {/* Rituals Tab - Daily practices */}
        <Tabs.Screen
          name="rituals"
          options={{
            title: 'Rituals',
            tabBarIcon: ({ color, focused }) => <RitualsIcon color={color} focused={focused} />,
            tabBarLabel: ({ focused }) => <TabLabel label="Rituals" focused={focused} />,
          }}
        />
        
        {/* Chat Tab - Talk to VEYa AI */}
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, focused }) => <ChatIcon color={color} focused={focused} />,
            tabBarLabel: ({ focused }) => <TabLabel label="Chat" focused={focused} />,
          }}
        />
        
        {/* You Tab - Profile & Settings */}
        <Tabs.Screen
          name="you"
          options={{
            title: 'You',
            tabBarIcon: ({ color, focused }) => <YouIcon color={color} focused={focused} />,
            tabBarLabel: ({ focused }) => <TabLabel label="You" focused={focused} />,
          }}
        />
        
        {/* Hidden screens (accessible via navigation, not tabs) */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
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
  // Tab Icon Container
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 36,
    position: 'relative',
  },
  tabIconBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primaryLight,
    borderRadius: 18,
  },
  tabIconInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab Label
  tabLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Error Boundary
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
