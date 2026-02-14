// ============================================================================
// VEYa Journal Store — Zustand with AsyncStorage Persistence
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO
  dateLabel: string; // e.g. Feb 12
  mood: string; // emoji
  text: string;
}

interface JournalStore {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'dateLabel'>) => JournalEntry;
  clearEntries: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `journal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const createdAt = new Date().toISOString();
        const newEntry: JournalEntry = {
          id: generateId(),
          createdAt,
          dateLabel: formatDateLabel(new Date(createdAt)),
          mood: entry.mood,
          text: entry.text.trim(),
        };

        set((state) => ({
          entries: [newEntry, ...state.entries].slice(0, 50),
        }));

        return newEntry;
      },

      clearEntries: () => set({ entries: [] }),
    }),
    {
      name: 'veya-journal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
