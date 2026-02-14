// ============================================================================
// VEYa Voice Portal — Shared voice chat logic + modal
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from 'react-native';
import type { UserProfile } from '@/types';
import { useChatStore } from '@/stores/chatStore';
import { useVoiceStore } from '@/stores/voiceStore';
import VoiceInterface from './VoiceInterface';
import { speakText } from '@/services/voiceService';

interface VoicePortalProps {
  userProfile: UserProfile;
}

export default function VoicePortal({ userProfile }: VoicePortalProps) {
  const { messages, sendMessage, isLoading } = useChatStore();
  const { isVoiceMode, toggleVoiceMode, setSpeaking } = useVoiceStore();
  const [voiceResponse, setVoiceResponse] = useState<string | null>(null);
  const lastSpokenRef = useRef<string | null>(null);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;
      setVoiceResponse(null);
      sendMessage(trimmed, userProfile, false);
    },
    [isLoading, sendMessage, userProfile],
  );

  useEffect(() => {
    if (!isVoiceMode || messages.length === 0) return;

    const latest = messages[messages.length - 1];
    if (latest.role !== 'assistant') return;
    if (lastSpokenRef.current === latest.id) return;

    lastSpokenRef.current = latest.id;
    setVoiceResponse(latest.content);

    (async () => {
      try {
        setSpeaking(true);
        await speakText(latest.content);
      } catch {
        // Silent fail
      } finally {
        setSpeaking(false);
      }
    })();
  }, [messages, isVoiceMode, setSpeaking]);

  return (
    <Modal visible={isVoiceMode} animationType="slide" presentationStyle="fullScreen">
      <VoiceInterface
        onClose={() => {
          toggleVoiceMode(false);
          setVoiceResponse(null);
        }}
        onTranscript={handleSend}
        responseText={voiceResponse}
      />
    </Modal>
  );
}
