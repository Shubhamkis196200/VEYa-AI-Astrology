// ============================================================================
// VEYa Voice Store — Zustand (session only)
// ============================================================================

import { create } from 'zustand';

interface VoiceStore {
  isVoiceMode: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  currentTranscript: string | null;

  toggleVoiceMode: (value?: boolean) => void;
  setRecording: (value: boolean) => void;
  setTranscribing: (value: boolean) => void;
  setSpeaking: (value: boolean) => void;
  setTranscript: (text: string | null) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isVoiceMode: false,
  isRecording: false,
  isTranscribing: false,
  isSpeaking: false,
  currentTranscript: null,

  toggleVoiceMode: (value) =>
    set((state) => ({ isVoiceMode: value ?? !state.isVoiceMode })),
  setRecording: (value) => set({ isRecording: value }),
  setTranscribing: (value) => set({ isTranscribing: value }),
  setSpeaking: (value) => set({ isSpeaking: value }),
  setTranscript: (text) => set({ currentTranscript: text }),
}));
