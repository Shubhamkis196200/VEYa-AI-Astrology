// ============================================================================
// VEYa Streak Store — Zustand + AsyncStorage persistence
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIn, getStreak } from '../services/streakService';
import type { Streak } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StreakStore {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  lastCheckIn: string | null;
  isLoading: boolean;

  fetchStreak: (userId: string) => Promise<Streak | null>;
  performCheckIn: (userId: string) => Promise<Streak | null>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useStreakStore = create<StreakStore>()(
  persist(
    (set) => ({
      currentStreak: 0,
      longestStreak: 0,
      totalCheckIns: 0,
      lastCheckIn: null,
      isLoading: false,

      fetchStreak: async (userId) => {
        set({ isLoading: true });
        try {
          const data = await getStreak(userId);
          if (data) {
            set({
              currentStreak: data.current_streak || 0,
              longestStreak: data.longest_streak || 0,
              totalCheckIns: data.total_check_ins || 0,
              lastCheckIn: data.last_check_in || null,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
          return data;
        } catch (error) {
          console.warn('[StreakStore] fetchStreak error', error);
          set({ isLoading: false });
          return null;
        }
      },

      performCheckIn: async (userId) => {
        set({ isLoading: true });
        try {
          const data = await checkIn(userId);
          if (data) {
            set({
              currentStreak: data.current_streak || 0,
              longestStreak: data.longest_streak || 0,
              totalCheckIns: data.total_check_ins || 0,
              lastCheckIn: data.last_check_in || null,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }
          return data;
        } catch (error) {
          console.warn('[StreakStore] performCheckIn error', error);
          set({ isLoading: false });
          return null;
        }
      },
    }),
    {
      name: 'veya-streak-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalCheckIns: state.totalCheckIns,
        lastCheckIn: state.lastCheckIn,
      }),
    },
  ),
);
