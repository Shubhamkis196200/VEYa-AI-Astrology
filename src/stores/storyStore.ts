// ============================================================================
// VEYa Story Store — Zustand state for Astro Stories
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMoonPhase, getCurrentTransits } from '@/services/astroEngine';

export type StoryType = 'moon' | 'daily' | 'love' | 'tarot' | 'transit';

export interface AstroStory {
  id: StoryType;
  title: string;
  body: string;
  emoji: string;
  actionLabel: string;
  colors: readonly [string, string];
}

interface StoryStore {
  stories: AstroStory[];
  currentIndex: number;
  isViewerOpen: boolean;
  viewed: Record<string, boolean>;
  lastUpdatedDate: string | null;

  refreshStories: () => void;
  openViewer: (index: number) => void;
  closeViewer: () => void;
  nextStory: () => void;
  previousStory: () => void;
  markViewed: (storyId: string) => void;
  resetViewed: () => void;
}

const THEME_COLORS: Record<StoryType, readonly [string, string]> = {
  moon: ['#0F172A', '#1E3A5F'],
  daily: ['#1B0B38', '#4C1D95'],
  love: ['#4A0404', '#9F1239'],
  tarot: ['#1B0B38', '#7C3AED'],
  transit: ['#042F2E', '#0D9488'],
};

const TAROT_CARDS = [
  { name: 'The Star', message: 'Hope returns. Trust the universe and dream boldly.' },
  { name: 'The Lovers', message: 'Choose with heart. Alignment brings sweetness.' },
  { name: 'The Empress', message: 'Receive, nurture, and let beauty bloom.' },
  { name: 'The Magician', message: 'Your intention is magnetic. Speak it into being.' },
  { name: 'The High Priestess', message: 'Quiet wisdom knows. Listen to your inner tide.' },
];

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function pickTarotCard(seed: number) {
  const index = seed % TAROT_CARDS.length;
  return TAROT_CARDS[index];
}

function buildStories(): AstroStory[] {
  try {
    const moon = getMoonPhase();
    const transits = getCurrentTransits();
    const dateSeed = new Date().getDate();
    const tarot = pickTarotCard(dateSeed);

    const transitHighlight = transits.find((planet) => planet.retrograde) || transits[0];
    const transitMessage = transitHighlight
      ? `${transitHighlight.symbol} ${transitHighlight.name} in ${transitHighlight.sign} — focus on ${transitHighlight.retrograde ? 'reflection' : 'momentum'}.`
      : 'Planetary currents are calm and steady. Move with grace.';

  return [
    {
      id: 'moon',
      title: `${moon.phaseName} Moon`,
      body: `The Moon is in ${moon.moonSign} at ${moon.moonSignDegree}°. ${moon.emoji} Guidance: soften into intuition and trust what you feel first.`,
      emoji: moon.emoji,
      actionLabel: 'Learn More',
      colors: THEME_COLORS.moon,
    },
    {
      id: 'daily',
      title: 'Daily Cosmic Insight',
      body: 'Your energy is luminous today. Prioritize what feels sacred and let everything else wait.',
      emoji: '☀️',
      actionLabel: 'Learn More',
      colors: THEME_COLORS.daily,
    },
    {
      id: 'love',
      title: 'Love Forecast',
      body: 'Romance is bold and magnetic. Be direct, be tender, and let your heart lead.',
      emoji: '💕',
      actionLabel: 'Share',
      colors: THEME_COLORS.love,
    },
    {
      id: 'tarot',
      title: `Tarot Pull — ${tarot.name}`,
      body: tarot.message,
      emoji: '🔮',
      actionLabel: 'Learn More',
      colors: THEME_COLORS.tarot,
    },
    {
      id: 'transit',
      title: 'Transit Alert',
      body: transitMessage,
      emoji: '⭐',
      actionLabel: 'Learn More',
      colors: THEME_COLORS.transit,
    },
  ];
  } catch (error) {
    console.warn('[StoryStore] buildStories failed:', error);
    // Return safe fallback stories
    return [
      {
        id: 'moon',
        title: 'Moon Update',
        body: 'The cosmic tides are shifting. Tune in to your intuition.',
        emoji: '🌙',
        actionLabel: 'Learn More',
        colors: THEME_COLORS.moon,
      },
      {
        id: 'daily',
        title: 'Daily Cosmic Insight',
        body: 'Your energy is luminous today. Trust your path.',
        emoji: '☀️',
        actionLabel: 'Learn More',
        colors: THEME_COLORS.daily,
      },
    ];
  }
}

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      stories: buildStories(),
      currentIndex: 0,
      isViewerOpen: false,
      viewed: {},
      lastUpdatedDate: null,

      refreshStories: () => {
        const today = getTodayDate();
        const { lastUpdatedDate } = get();
        if (lastUpdatedDate === today) return;

        set({
          stories: buildStories(),
          lastUpdatedDate: today,
          currentIndex: 0,
        });
      },

      openViewer: (index) => {
        const story = get().stories[index];
        if (story) {
          set((state) => ({
            isViewerOpen: true,
            currentIndex: index,
            viewed: { ...state.viewed, [story.id]: true },
          }));
        }
      },

      closeViewer: () => set({ isViewerOpen: false }),

      nextStory: () => {
        const { currentIndex, stories } = get();
        const nextIndex = Math.min(currentIndex + 1, stories.length - 1);
        const nextStory = stories[nextIndex];
        set((state) => ({
          currentIndex: nextIndex,
          viewed: nextStory ? { ...state.viewed, [nextStory.id]: true } : state.viewed,
        }));
      },

      previousStory: () => {
        const { currentIndex } = get();
        const prevIndex = Math.max(currentIndex - 1, 0);
        set({ currentIndex: prevIndex });
      },

      markViewed: (storyId) =>
        set((state) => ({ viewed: { ...state.viewed, [storyId]: true } })),

      resetViewed: () => set({ viewed: {} }),
    }),
    {
      name: 'veya-story-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        viewed: state.viewed,
        lastUpdatedDate: state.lastUpdatedDate,
      }),
    }
  )
);
