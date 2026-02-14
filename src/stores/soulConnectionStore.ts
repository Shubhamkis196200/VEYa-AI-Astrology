// ============================================================================
// VEYa Soul Connection Store — Friend System
// ============================================================================
//
// Unlike Co-Star's cold compatibility system, VEYa's Soul Connection 
// focuses on SUPPORT and CONNECTION, not just scores.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMoonPhase, getCurrentTransits } from '@/services/astroEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CosmicFriend {
  id: string;
  name: string;
  sunSign: string;
  moonSign?: string;
  risingSign?: string;
  birthDate?: string;
  addedAt: string;
  avatar?: string; // emoji or initial
  lastSupportSent?: string;
}

export interface CosmicWeather {
  overall: 'good' | 'neutral' | 'challenging';
  emoji: string;
  summary: string;
  supportNeeded: boolean;
}

export interface SupportMessage {
  id: string;
  fromId: string;
  toId: string;
  type: 'cosmic_hug' | 'energy_boost' | 'moon_blessing' | 'star_wish';
  message: string;
  sentAt: string;
  read: boolean;
}

// ---------------------------------------------------------------------------
// Support Message Templates
// ---------------------------------------------------------------------------

export const SUPPORT_TYPES = {
  cosmic_hug: {
    emoji: '🫂',
    label: 'Cosmic Hug',
    messages: [
      "Sending you warm cosmic energy ✨",
      "The stars are holding you today 🌟",
      "You're not alone in this universe 💜",
    ],
  },
  energy_boost: {
    emoji: '⚡',
    label: 'Energy Boost',
    messages: [
      "Channeling stellar power your way! 🔥",
      "May the cosmos fuel your day ✨",
      "Here's some cosmic caffeine ☕✨",
    ],
  },
  moon_blessing: {
    emoji: '🌙',
    label: 'Moon Blessing',
    messages: [
      "The moon shines bright for you tonight 🌙",
      "Lunar blessings on your path 🌕",
      "May Luna guide your dreams ✨",
    ],
  },
  star_wish: {
    emoji: '⭐',
    label: 'Star Wish',
    messages: [
      "Made a wish on a star for you ⭐",
      "The cosmos heard my prayer for you 🙏✨",
      "Sending stardust wishes your way 💫",
    ],
  },
};

// ---------------------------------------------------------------------------
// Cosmic Weather Calculator
// ---------------------------------------------------------------------------

function calculateCosmicWeather(friend: CosmicFriend): CosmicWeather {
  const moonPhase = getMoonPhase();
  const transits = getCurrentTransits();
  
  // Simple calculation based on moon sign compatibility
  const userMoonSign = moonPhase.moonSign;
  const friendSunSign = friend.sunSign;
  
  // Element compatibility
  const fireSign = ['Aries', 'Leo', 'Sagittarius'];
  const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
  const airSigns = ['Gemini', 'Libra', 'Aquarius'];
  const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];
  
  const getElement = (sign: string) => {
    if (fireSign.includes(sign)) return 'fire';
    if (earthSigns.includes(sign)) return 'earth';
    if (airSigns.includes(sign)) return 'air';
    if (waterSigns.includes(sign)) return 'water';
    return 'unknown';
  };
  
  const moonElement = getElement(userMoonSign);
  const friendElement = getElement(friendSunSign);
  
  // Check if elements are compatible
  const compatible = 
    (moonElement === 'fire' && (friendElement === 'fire' || friendElement === 'air')) ||
    (moonElement === 'earth' && (friendElement === 'earth' || friendElement === 'water')) ||
    (moonElement === 'air' && (friendElement === 'air' || friendElement === 'fire')) ||
    (moonElement === 'water' && (friendElement === 'water' || friendElement === 'earth'));
  
  // Check for challenging transits
  const mars = transits.find(t => t.name === 'Mars');
  const saturn = transits.find(t => t.name === 'Saturn');
  const hasTensionTransit = 
    mars?.sign === friendSunSign || 
    saturn?.sign === friendSunSign;
  
  if (hasTensionTransit) {
    return {
      overall: 'challenging',
      emoji: '🌧️',
      summary: `${friend.name} might need extra support today`,
      supportNeeded: true,
    };
  }
  
  if (compatible) {
    return {
      overall: 'good',
      emoji: '☀️',
      summary: `Great cosmic flow with ${friend.name} today!`,
      supportNeeded: false,
    };
  }
  
  return {
    overall: 'neutral',
    emoji: '🌤️',
    summary: `Steady energy between you and ${friend.name}`,
    supportNeeded: false,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface SoulConnectionStore {
  friends: CosmicFriend[];
  supportMessages: SupportMessage[];
  
  // Friend actions
  addFriend: (friend: Omit<CosmicFriend, 'id' | 'addedAt'>) => void;
  removeFriend: (friendId: string) => void;
  updateFriend: (friendId: string, updates: Partial<CosmicFriend>) => void;
  
  // Support actions
  sendSupport: (toFriendId: string, type: keyof typeof SUPPORT_TYPES) => void;
  markSupportRead: (messageId: string) => void;
  getUnreadSupport: () => SupportMessage[];
  
  // Weather
  getFriendWeather: (friendId: string) => CosmicWeather | null;
  getAllFriendsWeather: () => Array<{ friend: CosmicFriend; weather: CosmicWeather }>;
  
  // Stats
  getFriendsNeedingSupport: () => CosmicFriend[];
}

export const useSoulConnectionStore = create<SoulConnectionStore>()(
  persist(
    (set, get) => ({
      friends: [],
      supportMessages: [],

      addFriend: (friendData) => {
        const friend: CosmicFriend = {
          ...friendData,
          id: `friend_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          addedAt: new Date().toISOString(),
          avatar: friendData.name.charAt(0).toUpperCase(),
        };
        
        set((state) => ({
          friends: [...state.friends, friend],
        }));
      },

      removeFriend: (friendId) => {
        set((state) => ({
          friends: state.friends.filter((f) => f.id !== friendId),
          supportMessages: state.supportMessages.filter(
            (m) => m.fromId !== friendId && m.toId !== friendId
          ),
        }));
      },

      updateFriend: (friendId, updates) => {
        set((state) => ({
          friends: state.friends.map((f) =>
            f.id === friendId ? { ...f, ...updates } : f
          ),
        }));
      },

      sendSupport: (toFriendId, type) => {
        const supportType = SUPPORT_TYPES[type];
        const randomMessage = supportType.messages[
          Math.floor(Math.random() * supportType.messages.length)
        ];
        
        const message: SupportMessage = {
          id: `support_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          fromId: 'self', // Current user
          toId: toFriendId,
          type,
          message: randomMessage,
          sentAt: new Date().toISOString(),
          read: false,
        };
        
        set((state) => {
          // Update lastSupportSent for the friend
          const updatedFriends = state.friends.map((f) =>
            f.id === toFriendId
              ? { ...f, lastSupportSent: new Date().toISOString() }
              : f
          );
          
          return {
            supportMessages: [...state.supportMessages, message],
            friends: updatedFriends,
          };
        });
      },

      markSupportRead: (messageId) => {
        set((state) => ({
          supportMessages: state.supportMessages.map((m) =>
            m.id === messageId ? { ...m, read: true } : m
          ),
        }));
      },

      getUnreadSupport: () => {
        return get().supportMessages.filter(
          (m) => !m.read && m.toId === 'self'
        );
      },

      getFriendWeather: (friendId) => {
        const friend = get().friends.find((f) => f.id === friendId);
        if (!friend) return null;
        return calculateCosmicWeather(friend);
      },

      getAllFriendsWeather: () => {
        return get().friends.map((friend) => ({
          friend,
          weather: calculateCosmicWeather(friend),
        }));
      },

      getFriendsNeedingSupport: () => {
        const allWeather = get().getAllFriendsWeather();
        return allWeather
          .filter(({ weather }) => weather.supportNeeded)
          .map(({ friend }) => friend);
      },
    }),
    {
      name: 'veya-soul-connection',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ---------------------------------------------------------------------------
// Zodiac Emoji Helper
// ---------------------------------------------------------------------------

export const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};
