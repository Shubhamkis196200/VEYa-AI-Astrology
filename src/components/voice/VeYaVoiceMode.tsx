// ============================================================================
// VeYaVoiceMode — Clean voice AI using voiceEngine.ts
// Pipeline: Record → Whisper (transcribe) → GPT-4o-mini → TTS onyx
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { useOnboardingStore } from '../../stores/onboardingStore';
import {
  startRecording,
  stopRecording,
  transcribe,
  getAIResponse,
  speak,
  stopSpeaking,
} from '../../services/voiceEngine';
import {
  parseVoiceIntent,
  executeVoiceAction,
  getNavigationResponse,
} from '../../services/voiceNavigation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase = 'idle' | 'recording' | 'thinking' | 'speaking';

interface Props {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Status labels
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<Phase, string> = {
  idle: 'Tap to speak',
  recording: 'Listening...',
  thinking: 'Thinking...',
  speaking: 'Speaking...',
};

const ORB_COLOR: Record<Phase, string> = {
  idle: '#8B5CF6',
  recording: '#3B82F6',
  thinking: '#6D28D9',
  speaking: '#D4A547',
};

// ---------------------------------------------------------------------------
// Static stars
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 95,
  size: (i % 3) + 1,
  opacity: (i % 5) * 0.1 + 0.15,
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VeYaVoiceMode({ onClose }: Props) {
  const { data } = useOnboardingStore();

  const name = data?.name || 'friend';
  const sunSign = data?.sunSign || 'unknown';
  const moonSign = data?.moonSign || 'unknown';
  const risingSign = data?.risingSign || 'unknown';

  const systemPrompt = `You are VEYa, a cosmic AI assistant for ${name} (${sunSign} sun, ${moonSign} moon, ${risingSign} rising).\nRespond in 1-2 sentences max. Warm, direct, personal. You can navigate the app when asked.`;

  // State
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [keepListening, setKeepListening] = useState(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const keepListeningRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  // Keep ref in sync
  useEffect(() => {
    keepListeningRef.current = keepListening;
  }, [keepListening]);

  // ---------------------------------------------------------------------------
  // Animations
  // ---------------------------------------------------------------------------

  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (phase === 'idle') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 2000 }), withTiming(0.25, { duration: 2000 })),
        -1,
        true,
      );
    } else if (phase === 'recording') {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.18, { duration: 350 }), withTiming(1, { duration: 350 })),
        -1,
        true,
      );
      glowOpacity.value = withTiming(0.7);
    } else if (phase === 'thinking') {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      glowOpacity.value = withTiming(0.4);
    } else if (phase === 'speaking') {
      pulseScale.value = withRepeat(
        withSequence(withTiming(1.09, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true,
      );
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.65, { duration: 600 }), withTiming(0.3, { duration: 600 })),
        -1,
        true,
      );
    }
  }, [phase, pulseScale, glowOpacity]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // ---------------------------------------------------------------------------
  // Stop and respond pipeline
  // ---------------------------------------------------------------------------

  const handleStopAndRespond = useCallback(async (rec: Audio.Recording) => {
    setPhase('thinking');
    try {
      const uri = await stopRecording(rec);
      const text = await transcribe(uri);

      if (!text) {
        setError("Couldn't hear you clearly. Tap to try again.");
        setPhase('idle');
        return;
      }

      setTranscript(text);

      const intent = parseVoiceIntent(text);

      if (intent.type !== 'answer' && intent.type !== 'unknown') {
        const navResp = getNavigationResponse(intent, name);
        setResponse(navResp);
        setPhase('speaking');
        await speak(navResp);
        setPhase('idle');
        executeVoiceAction(intent);
        onClose();
        return;
      }

      const reply = await getAIResponse(text, systemPrompt, conversation.slice(-6));
      setResponse(reply);
      setConversation((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ]);
      setPhase('speaking');
      await speak(reply);
      setPhase('idle');

      if (keepListeningRef.current) {
        setTimeout(() => handleOrbPress(), 800);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('network') || msg.includes('fetch') || msg.includes('Network')) {
        setError('No internet connection. Check your network.');
      } else {
        console.error('[VeYaVoice] error:', msg.slice(0, 80));
        setError('VEYa needs a moment. Tap to try again.');
      }
      setPhase('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation, name, systemPrompt, onClose]);

  // ---------------------------------------------------------------------------
  // Orb tap handler
  // ---------------------------------------------------------------------------

  const handleOrbPress = useCallback(async () => {
    await stopSpeaking();
    setError(null);

    if (phase === 'idle' || phase === 'speaking') {
      try {
        const rec = await startRecording();
        recordingRef.current = rec;
        setPhase('recording');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        console.error('[VeYaVoice] mic error:', msg.slice(0, 80));
        setError("Couldn't access the microphone. Tap to try again.");
        setPhase('idle');
      }
    } else if (phase === 'recording') {
      const rec = recordingRef.current;
      recordingRef.current = null;
      if (rec) {
        await handleStopAndRespond(rec);
      }
    }
  }, [phase, handleStopAndRespond]);

  // ---------------------------------------------------------------------------
  // Close handler
  // ---------------------------------------------------------------------------

  const handleClose = useCallback(async () => {
    keepListeningRef.current = false;
    await stopSpeaking();
    if (recordingRef.current) {
      try { await stopRecording(recordingRef.current); } catch { /* ignore */ }
      recordingRef.current = null;
    }
    onClose();
  }, [onClose]);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    if (conversation.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [conversation.length]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const orbColor = ORB_COLOR[phase];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0A1F', '#1B0B38', '#2D1B4E']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Stars */}
      <View style={styles.starsLayer} pointerEvents="none">
        {STARS.map((s, i) => (
          <View
            key={i}
            style={[
              styles.star,
              { left: `${s.x}%` as unknown as number, top: `${s.y}%` as unknown as number, width: s.size, height: s.size, opacity: s.opacity },
            ]}
          />
        ))}
      </View>

      {/* Close button */}
      <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={12}>
        <Ionicons name="close" size={28} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>VEYa</Text>
        <Text style={styles.subtitle}>
          {name} · {sunSign} ☉
        </Text>
      </View>

      {/* Orb */}
      <View style={styles.orbArea}>
        <Animated.View style={[styles.orbGlow, glowStyle, { backgroundColor: orbColor }]} />
        <Animated.View style={[styles.orbWrap, orbStyle]}>
          <Pressable onPress={handleOrbPress} style={styles.orbPressable}>
            <LinearGradient colors={[orbColor, '#4C1D95']} style={styles.orb}>
              {phase === 'thinking' ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : phase === 'recording' ? (
                <Ionicons name="mic" size={48} color="#FFF" />
              ) : phase === 'speaking' ? (
                <Ionicons name="volume-high" size={48} color="#FFF" />
              ) : (
                <Ionicons name="mic-outline" size={48} color="#FFF" />
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Status */}
      <Text style={styles.statusLabel}>{STATUS_LABEL[phase]}</Text>
      {phase === 'recording' && (
        <Text style={styles.tapHint}>Tap again when done</Text>
      )}

      {/* Error */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Transcript */}
      {transcript ? (
        <Text style={styles.transcriptText} numberOfLines={2}>{transcript}</Text>
      ) : null}

      {/* Response / conversation */}
      <ScrollView
        ref={scrollRef}
        style={styles.conversationScroll}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.length === 0 && phase === 'idle' && (
          <Text style={styles.hint}>
            Ask about your chart, today's energy, or say{'\n'}"show my chart" to navigate
          </Text>
        )}
        {conversation.map((msg, i) => (
          <View
            key={i}
            style={[styles.msgBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            <Text style={[styles.msgText, msg.role === 'user' && styles.userMsgText]}>
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Keep listening toggle */}
      <View style={styles.continuousRow}>
        <Text style={styles.continuousLabel}>Keep listening</Text>
        <Switch
          value={keepListening}
          onValueChange={setKeepListening}
          trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#7C3AED' }}
          thumbColor={keepListening ? '#A78BFA' : 'rgba(255,255,255,0.6)'}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 64,
  },
  starsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 34,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  orbArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  orbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  orbWrap: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  orbPressable: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    overflow: 'hidden',
  },
  orb: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
  },
  tapHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 4,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  transcriptText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
    fontStyle: 'italic',
  },
  conversationScroll: {
    flex: 1,
    width: '100%',
    marginTop: 12,
  },
  conversationContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 20,
    paddingTop: 8,
  },
  msgBubble: {
    maxWidth: '85%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  msgText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  userMsgText: {
    color: 'rgba(255,255,255,0.85)',
  },
  continuousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingBottom: 28,
  },
  continuousLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});
