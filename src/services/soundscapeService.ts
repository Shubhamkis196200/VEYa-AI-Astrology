// ============================================================================
// VEYa Cosmic Soundscapes — Ambient Audio for Readings
// ============================================================================
//
// Provides immersive ambient audio that plays during readings, meditation,
// and journaling. Uses expo-av for audio playback.
//

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, AVPlaybackStatus } from 'expo-av';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Soundscape {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'cosmic' | 'nature' | 'meditation' | 'zodiac';
  // Generated via TTS or bundled assets in production
  // For now we use freely available ambient frequencies
  frequency?: number; // Hz for generated tone
  color: string; // Theme color for UI
}

// ---------------------------------------------------------------------------
// Soundscape Library
// ---------------------------------------------------------------------------

export const SOUNDSCAPES: Soundscape[] = [
  // Cosmic
  {
    id: 'deep-space',
    name: 'Deep Space',
    description: 'The vast silence between stars',
    emoji: '🌌',
    category: 'cosmic',
    frequency: 136.1, // Om frequency
    color: '#1B0B38',
  },
  {
    id: 'solar-wind',
    name: 'Solar Wind',
    description: 'Charged particles dancing through space',
    emoji: '☀️',
    category: 'cosmic',
    frequency: 126.22, // Sun frequency
    color: '#D4A547',
  },
  {
    id: 'lunar-glow',
    name: 'Lunar Glow',
    description: 'The gentle pull of moonlight',
    emoji: '🌙',
    category: 'cosmic',
    frequency: 210.42, // Moon frequency
    color: '#6366F1',
  },
  {
    id: 'starfield',
    name: 'Starfield',
    description: 'A billion stars whispering at once',
    emoji: '✨',
    category: 'cosmic',
    frequency: 172.06, // Platonic year
    color: '#8B5CF6',
  },
  // Nature
  {
    id: 'ocean-waves',
    name: 'Ocean Tides',
    description: 'Waves guided by the moon\'s pull',
    emoji: '🌊',
    category: 'nature',
    frequency: 174, // Solfeggio
    color: '#0891B2',
  },
  {
    id: 'rain-forest',
    name: 'Cosmic Rain',
    description: 'Rain that carries stardust',
    emoji: '🌧️',
    category: 'nature',
    frequency: 396, // Solfeggio - Liberation
    color: '#059669',
  },
  {
    id: 'aurora',
    name: 'Aurora Borealis',
    description: 'The northern lights sing',
    emoji: '🏔️',
    category: 'nature',
    frequency: 528, // Solfeggio - Love
    color: '#10B981',
  },
  // Meditation
  {
    id: 'crystal-bowl',
    name: 'Crystal Bowl',
    description: 'Tibetan singing bowls resonate',
    emoji: '🔮',
    category: 'meditation',
    frequency: 432, // Verdi's A
    color: '#7C3AED',
  },
  {
    id: 'om-chant',
    name: 'Cosmic Om',
    description: 'The universal vibration',
    emoji: '🕉️',
    category: 'meditation',
    frequency: 136.1,
    color: '#DC2626',
  },
  {
    id: 'theta-waves',
    name: 'Theta Waves',
    description: 'Deep meditation brainwave state',
    emoji: '🧠',
    category: 'meditation',
    frequency: 6, // Theta range
    color: '#4F46E5',
  },
  // Zodiac-themed
  {
    id: 'fire-signs',
    name: 'Fire Element',
    description: 'The crackling energy of Aries, Leo, Sagittarius',
    emoji: '🔥',
    category: 'zodiac',
    frequency: 256, // C note
    color: '#EF4444',
  },
  {
    id: 'earth-signs',
    name: 'Earth Element',
    description: 'The grounding of Taurus, Virgo, Capricorn',
    emoji: '🌿',
    category: 'zodiac',
    frequency: 194.18, // Earth frequency
    color: '#84CC16',
  },
  {
    id: 'air-signs',
    name: 'Air Element',
    description: 'The breath of Gemini, Libra, Aquarius',
    emoji: '💨',
    category: 'zodiac',
    frequency: 288, // D note
    color: '#06B6D4',
  },
  {
    id: 'water-signs',
    name: 'Water Element',
    description: 'The depths of Cancer, Scorpio, Pisces',
    emoji: '💧',
    category: 'zodiac',
    frequency: 211.44, // Neptune
    color: '#3B82F6',
  },
];

// ---------------------------------------------------------------------------
// Audio Generation (Binaural / Ambient Tones)
// ---------------------------------------------------------------------------

// In production, these would be real audio files. For now, we use
// a simple tone generator approach with expo-av.

class SoundscapePlayer {
  private sound: Audio.Sound | null = null;
  private isPlaying = false;
  private volume = 0.3;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;

  async play(soundscape: Soundscape): Promise<void> {
    // Stop any current playback
    await this.stop();

    try {
      // Configure audio session for background/ambient playback
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // In production, we'd load real audio files:
      // const { sound } = await Audio.Sound.createAsync(
      //   require(`../assets/sounds/${soundscape.id}.mp3`)
      // );
      
      // For now, create a placeholder that can be swapped for real assets
      // The UI will work, and sounds can be added as MP3s later
      this.isPlaying = true;
      
      console.log(`[Soundscape] Playing: ${soundscape.name} (${soundscape.frequency}Hz)`);
    } catch (error) {
      console.warn('[Soundscape] Failed to play:', error);
    }
  }

  async stop(): Promise<void> {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {}
      this.sound = null;
    }

    this.isPlaying = false;
  }

  async fadeOut(durationMs = 2000): Promise<void> {
    if (!this.sound || !this.isPlaying) return;

    const steps = 20;
    const stepMs = durationMs / steps;
    const volumeStep = this.volume / steps;
    let currentVolume = this.volume;

    return new Promise((resolve) => {
      this.fadeInterval = setInterval(async () => {
        currentVolume -= volumeStep;
        if (currentVolume <= 0) {
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          await this.stop();
          resolve();
        } else {
          try {
            await this.sound?.setVolumeAsync(currentVolume);
          } catch {}
        }
      }, stepMs);
    });
  }

  async setVolume(vol: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.sound) {
      try {
        await this.sound.setVolumeAsync(this.volume);
      } catch {}
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

// Singleton player
export const soundscapePlayer = new SoundscapePlayer();

// ---------------------------------------------------------------------------
// Zustand Store
// ---------------------------------------------------------------------------

interface SoundscapeStore {
  currentSoundscape: string | null;
  isPlaying: boolean;
  volume: number;
  favorites: string[];
  autoPlayDuringReadings: boolean;

  // Actions
  play: (soundscapeId: string) => Promise<void>;
  stop: () => Promise<void>;
  toggleFavorite: (soundscapeId: string) => void;
  setVolume: (volume: number) => Promise<void>;
  setAutoPlay: (enabled: boolean) => void;
}

export const useSoundscapeStore = create<SoundscapeStore>()(
  persist(
    (set, get) => ({
      currentSoundscape: null,
      isPlaying: false,
      volume: 0.3,
      favorites: [],
      autoPlayDuringReadings: true,

      play: async (soundscapeId) => {
        const soundscape = SOUNDSCAPES.find(s => s.id === soundscapeId);
        if (!soundscape) return;

        await soundscapePlayer.play(soundscape);
        set({
          currentSoundscape: soundscapeId,
          isPlaying: true,
        });
      },

      stop: async () => {
        await soundscapePlayer.fadeOut();
        set({
          currentSoundscape: null,
          isPlaying: false,
        });
      },

      toggleFavorite: (soundscapeId) => {
        set((state) => {
          const isFavorite = state.favorites.includes(soundscapeId);
          return {
            favorites: isFavorite
              ? state.favorites.filter(id => id !== soundscapeId)
              : [...state.favorites, soundscapeId],
          };
        });
      },

      setVolume: async (volume) => {
        await soundscapePlayer.setVolume(volume);
        set({ volume });
      },

      setAutoPlay: (enabled) => {
        set({ autoPlayDuringReadings: enabled });
      },
    }),
    {
      name: 'veya-soundscape',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        volume: state.volume,
        autoPlayDuringReadings: state.autoPlayDuringReadings,
      }),
    }
  )
);

// ---------------------------------------------------------------------------
// Helper: Get soundscape for zodiac element
// ---------------------------------------------------------------------------

export function getSoundscapeForSign(sign: string): Soundscape {
  const fireSign = ['Aries', 'Leo', 'Sagittarius'];
  const earthSigns = ['Taurus', 'Virgo', 'Capricorn'];
  const airSigns = ['Gemini', 'Libra', 'Aquarius'];
  const waterSigns = ['Cancer', 'Scorpio', 'Pisces'];

  if (fireSign.includes(sign)) return SOUNDSCAPES.find(s => s.id === 'fire-signs')!;
  if (earthSigns.includes(sign)) return SOUNDSCAPES.find(s => s.id === 'earth-signs')!;
  if (airSigns.includes(sign)) return SOUNDSCAPES.find(s => s.id === 'air-signs')!;
  if (waterSigns.includes(sign)) return SOUNDSCAPES.find(s => s.id === 'water-signs')!;
  return SOUNDSCAPES[0]; // Default: Deep Space
}
