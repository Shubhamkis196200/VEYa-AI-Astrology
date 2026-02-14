// ============================================================================
// VEYa Chat Store — Zustand with AsyncStorage Persistence
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { chatWithVeya } from '../services/ai';
import type { ChatMessage, MemoryResult } from '../services/ai';
import type { UserProfile } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatStore {
  messages: DisplayMessage[];
  conversationHistory: ChatMessage[];
  sessionId: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  sendMessage: (
    text: string,
    userProfile: UserProfile,
    isPremium?: boolean,
    isVoiceMode?: boolean,
  ) => Promise<void>;
  loadHistory: (userId: string) => Promise<void>;
  clearChat: () => void;
  setSessionId: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Maximum messages to persist
const MAX_PERSISTED_MESSAGES = 50;

// ---------------------------------------------------------------------------
// Store with AsyncStorage persistence
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      conversationHistory: [],
      sessionId: generateSessionId(),
      isLoading: false,
      error: null,

      sendMessage: async (text, userProfile, isPremium = false, isVoiceMode = false) => {
        const { conversationHistory } = get();

        // Add user message to display
        const userMsg: DisplayMessage = {
          id: generateId(),
          role: 'user',
          content: text,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, userMsg],
          conversationHistory: [
            ...state.conversationHistory,
            { role: 'user' as const, content: text },
          ],
          isLoading: true,
          error: null,
        }));

        try {
          // 1. Retrieve RAG context (non-blocking failure)
          let ragContext: MemoryResult[] = [];
          try {
            const { retrieveRelevantMemories } = await import('../services/rag');
            ragContext = await retrieveRelevantMemories(
              userProfile.user_id,
              text,
              5,
            );
          } catch {
            // RAG failure is non-critical
          }

          // 2. Call VEYa AI
          const response = await chatWithVeya(
            text,
            get().conversationHistory.slice(0, -1),
            userProfile,
            ragContext,
            isPremium,
            isVoiceMode,
          );

          // 3. Add assistant message to display
          const assistantMsg: DisplayMessage = {
            id: generateId(),
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
          };

          set((state) => {
            // Trim to last MAX_PERSISTED_MESSAGES
            const newMessages = [...state.messages, assistantMsg].slice(-MAX_PERSISTED_MESSAGES);
            const newHistory = [
              ...state.conversationHistory,
              { role: 'assistant' as const, content: response },
            ].slice(-MAX_PERSISTED_MESSAGES);

            return {
              messages: newMessages,
              conversationHistory: newHistory,
              isLoading: false,
            };
          });

          // 4. Store conversation for RAG (non-blocking)
          try {
            const { storeConversation } = await import('../services/rag');
            storeConversation(
              userProfile.user_id,
              get().sessionId,
              text,
              response,
            ).catch(() => {});
          } catch {
            // Silent fail
          }
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Something went wrong';

          // Add error message from VEYa
          const errorMsg: DisplayMessage = {
            id: generateId(),
            role: 'assistant',
            content:
              'The cosmic connection wavered for a moment ✨ Could you try sending that again?',
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, errorMsg],
            isLoading: false,
            error: errorMessage,
          }));
        }
      },

      loadHistory: async (_userId) => {
        // Messages are now persisted via AsyncStorage automatically
        // This method is kept for backward compatibility
        // If needed, we could also load from Supabase here
      },

      clearChat: () =>
        set({
          messages: [],
          conversationHistory: [],
          sessionId: generateSessionId(),
          error: null,
        }),

      setSessionId: (id) => set({ sessionId: id }),
    }),
    {
      name: 'veya-chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        messages: state.messages.slice(-MAX_PERSISTED_MESSAGES),
        conversationHistory: state.conversationHistory.slice(-MAX_PERSISTED_MESSAGES),
        sessionId: state.sessionId,
      }),
    },
  ),
);
