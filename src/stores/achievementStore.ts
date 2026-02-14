// ============================================================================
// VEYa Achievement System — Gamification for Retention
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Achievement Definitions
// ---------------------------------------------------------------------------

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'ritual' | 'journal' | 'tarot' | 'social' | 'streak' | 'cosmic';
  requirement: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak Achievements
  {
    id: 'first_light',
    name: 'First Light',
    description: 'Open VEYa for the first time',
    emoji: '✨',
    category: 'streak',
    requirement: 1,
    rarity: 'common',
  },
  {
    id: 'cosmic_curious',
    name: 'Cosmic Curious',
    description: 'Check your reading 7 days in a row',
    emoji: '🌟',
    category: 'streak',
    requirement: 7,
    rarity: 'common',
  },
  {
    id: 'star_seeker',
    name: 'Star Seeker',
    description: 'Maintain a 30-day streak',
    emoji: '⭐',
    category: 'streak',
    requirement: 30,
    rarity: 'rare',
  },
  {
    id: 'celestial_devotee',
    name: 'Celestial Devotee',
    description: 'Maintain a 100-day streak',
    emoji: '🌌',
    category: 'streak',
    requirement: 100,
    rarity: 'epic',
  },
  {
    id: 'cosmic_master',
    name: 'Cosmic Master',
    description: 'Maintain a 365-day streak',
    emoji: '👑',
    category: 'streak',
    requirement: 365,
    rarity: 'legendary',
  },

  // Ritual Achievements
  {
    id: 'morning_star',
    name: 'Morning Star',
    description: 'Complete your first morning ritual',
    emoji: '🌅',
    category: 'ritual',
    requirement: 1,
    rarity: 'common',
  },
  {
    id: 'ritual_keeper',
    name: 'Ritual Keeper',
    description: 'Complete 7 morning rituals',
    emoji: '🧘',
    category: 'ritual',
    requirement: 7,
    rarity: 'common',
  },
  {
    id: 'moon_child',
    name: 'Moon Child',
    description: 'Complete rituals during 3 Full Moons',
    emoji: '🌙',
    category: 'ritual',
    requirement: 3,
    rarity: 'rare',
  },
  {
    id: 'lunar_devotee',
    name: 'Lunar Devotee',
    description: 'Complete rituals during 12 Full Moons',
    emoji: '🌕',
    category: 'ritual',
    requirement: 12,
    rarity: 'epic',
  },

  // Journal Achievements
  {
    id: 'first_reflection',
    name: 'First Reflection',
    description: 'Write your first journal entry',
    emoji: '📝',
    category: 'journal',
    requirement: 1,
    rarity: 'common',
  },
  {
    id: 'soul_writer',
    name: 'Soul Writer',
    description: 'Write 10 journal entries',
    emoji: '✍️',
    category: 'journal',
    requirement: 10,
    rarity: 'common',
  },
  {
    id: 'cosmic_chronicler',
    name: 'Cosmic Chronicler',
    description: 'Write 50 journal entries',
    emoji: '📖',
    category: 'journal',
    requirement: 50,
    rarity: 'rare',
  },
  {
    id: 'celestial_scribe',
    name: 'Celestial Scribe',
    description: 'Write 100 journal entries',
    emoji: '📚',
    category: 'journal',
    requirement: 100,
    rarity: 'epic',
  },

  // Tarot Achievements
  {
    id: 'first_card',
    name: 'First Card',
    description: 'Pull your first tarot card',
    emoji: '🎴',
    category: 'tarot',
    requirement: 1,
    rarity: 'common',
  },
  {
    id: 'card_collector',
    name: 'Card Collector',
    description: 'Pull 22 different Major Arcana cards',
    emoji: '🃏',
    category: 'tarot',
    requirement: 22,
    rarity: 'rare',
  },
  {
    id: 'tarot_master',
    name: 'Tarot Master',
    description: 'Pull all 78 cards at least once',
    emoji: '🔮',
    category: 'tarot',
    requirement: 78,
    rarity: 'legendary',
  },

  // Cosmic Event Achievements
  {
    id: 'mercury_survivor',
    name: 'Mercury Survivor',
    description: 'Use VEYa through a Mercury Retrograde',
    emoji: '☿️',
    category: 'cosmic',
    requirement: 1,
    rarity: 'rare',
  },
  {
    id: 'retrograde_warrior',
    name: 'Retrograde Warrior',
    description: 'Survive 3 Mercury Retrogrades with VEYa',
    emoji: '⚔️',
    category: 'cosmic',
    requirement: 3,
    rarity: 'epic',
  },
  {
    id: 'eclipse_witness',
    name: 'Eclipse Witness',
    description: 'Check VEYa during a solar or lunar eclipse',
    emoji: '🌑',
    category: 'cosmic',
    requirement: 1,
    rarity: 'rare',
  },
  {
    id: 'venus_blessed',
    name: 'Venus Blessed',
    description: 'Experience your Venus Return with VEYa',
    emoji: '💕',
    category: 'cosmic',
    requirement: 1,
    rarity: 'epic',
  },

  // Social Achievements
  {
    id: 'cosmic_sharer',
    name: 'Cosmic Sharer',
    description: 'Share your first reading',
    emoji: '📤',
    category: 'social',
    requirement: 1,
    rarity: 'common',
  },
  {
    id: 'star_connector',
    name: 'Star Connector',
    description: 'Check compatibility with 5 people',
    emoji: '💫',
    category: 'social',
    requirement: 5,
    rarity: 'rare',
  },
  {
    id: 'cosmic_influencer',
    name: 'Cosmic Influencer',
    description: 'Share 50 readings',
    emoji: '🌟',
    category: 'social',
    requirement: 50,
    rarity: 'epic',
  },
];

// ---------------------------------------------------------------------------
// Progress Tracking
// ---------------------------------------------------------------------------

export interface AchievementProgress {
  [achievementId: string]: {
    current: number;
    unlocked: boolean;
    unlockedAt?: string;
  };
}

interface AchievementStore {
  progress: AchievementProgress;
  recentUnlock: Achievement | null;
  
  // Actions
  incrementProgress: (achievementId: string, amount?: number) => void;
  setProgress: (achievementId: string, value: number) => void;
  checkAndUnlock: (achievementId: string) => Achievement | null;
  getUnlockedAchievements: () => Achievement[];
  getProgressForAchievement: (achievementId: string) => { current: number; required: number; percentage: number };
  clearRecentUnlock: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      progress: {},
      recentUnlock: null,

      incrementProgress: (achievementId, amount = 1) => {
        const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!achievement) return;

        set((state) => {
          const current = state.progress[achievementId]?.current || 0;
          const newCurrent = current + amount;
          const unlocked = newCurrent >= achievement.requirement;

          return {
            progress: {
              ...state.progress,
              [achievementId]: {
                current: newCurrent,
                unlocked: state.progress[achievementId]?.unlocked || unlocked,
                unlockedAt: unlocked && !state.progress[achievementId]?.unlocked
                  ? new Date().toISOString()
                  : state.progress[achievementId]?.unlockedAt,
              },
            },
            recentUnlock: unlocked && !state.progress[achievementId]?.unlocked ? achievement : state.recentUnlock,
          };
        });
      },

      setProgress: (achievementId, value) => {
        const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!achievement) return;

        set((state) => {
          const unlocked = value >= achievement.requirement;
          const wasUnlocked = state.progress[achievementId]?.unlocked || false;

          return {
            progress: {
              ...state.progress,
              [achievementId]: {
                current: value,
                unlocked: wasUnlocked || unlocked,
                unlockedAt: unlocked && !wasUnlocked
                  ? new Date().toISOString()
                  : state.progress[achievementId]?.unlockedAt,
              },
            },
            recentUnlock: unlocked && !wasUnlocked ? achievement : state.recentUnlock,
          };
        });
      },

      checkAndUnlock: (achievementId) => {
        const state = get();
        const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!achievement) return null;

        const progress = state.progress[achievementId];
        if (progress?.unlocked) return null;
        if ((progress?.current || 0) >= achievement.requirement) {
          set((s) => ({
            progress: {
              ...s.progress,
              [achievementId]: {
                ...s.progress[achievementId],
                unlocked: true,
                unlockedAt: new Date().toISOString(),
              },
            },
            recentUnlock: achievement,
          }));
          return achievement;
        }
        return null;
      },

      getUnlockedAchievements: () => {
        const state = get();
        return ACHIEVEMENTS.filter((a) => state.progress[a.id]?.unlocked);
      },

      getProgressForAchievement: (achievementId) => {
        const state = get();
        const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
        if (!achievement) return { current: 0, required: 0, percentage: 0 };

        const current = state.progress[achievementId]?.current || 0;
        return {
          current,
          required: achievement.requirement,
          percentage: Math.min((current / achievement.requirement) * 100, 100),
        };
      },

      clearRecentUnlock: () => set({ recentUnlock: null }),
    }),
    {
      name: 'veya-achievements',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ---------------------------------------------------------------------------
// Helper Hooks
// ---------------------------------------------------------------------------

export function useAchievementUnlockToast() {
  const recentUnlock = useAchievementStore((s) => s.recentUnlock);
  const clearRecentUnlock = useAchievementStore((s) => s.clearRecentUnlock);
  
  return { recentUnlock, clearRecentUnlock };
}
