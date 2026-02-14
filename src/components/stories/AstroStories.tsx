// ============================================================================
// VEYa Astro Stories — Horizontal Stories Bar
// ============================================================================

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useStoryStore } from '@/stores/storyStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

const STORY_RING_GRADIENTS: Record<string, readonly [string, string]> = {
  moon: ['#8B5CF6', '#22D3EE'],
  daily: ['#FACC15', '#FB7185'],
  love: ['#F472B6', '#F43F5E'],
  tarot: ['#A78BFA', '#6366F1'],
  transit: ['#34D399', '#22D3EE'],
};

export function AstroStories() {
  const { stories, viewed, openViewer, refreshStories } = useStoryStore();

  useEffect(() => {
    refreshStories();
  }, [refreshStories]);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Text style={styles.sectionTitle}>Cosmic Stories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={88}
        decelerationRate="fast"
      >
        {stories.map((story, index) => {
          const isViewed = viewed[story.id];
          return (
            <Pressable
              key={story.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                openViewer(index);
              }}
              style={styles.storyItem}
            >
              <LinearGradient
                colors={isViewed ? ['#1F2937', '#374151'] : STORY_RING_GRADIENTS[story.id]}
                style={styles.avatarRing}
              >
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarEmoji}>{story.emoji}</Text>
                </View>
              </LinearGradient>
              <Text style={[styles.storyLabel, isViewed && styles.storyLabelViewed]}>
                {story.title.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  storyItem: {
    alignItems: 'center',
    width: 78,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  avatarInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#0B0B12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 26,
  },
  storyLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  storyLabelViewed: {
    color: colors.textSecondary,
  },
});
