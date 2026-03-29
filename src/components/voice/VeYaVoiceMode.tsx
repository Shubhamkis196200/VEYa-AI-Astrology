// ============================================================================
// VeYaVoiceMode — Full-screen voice control + navigation AI
// ============================================================================
// - Multi-turn conversation with real astrology context
// - Voice navigation: "show my chart", "pull tarot", etc.
// - Continuous listen mode toggle
// - User-isolated: ONLY reads from onboardingStore (no global/shared state)
// - Clean orb UI — no particles, no SVG, no Three.js
// ============================================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
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
import * as Haptics from 'expo-haptics';

import { useOnboardingStore } from '../../stores/onboardingStore';
import {
  getAstrologyResponse,
  speakText,
  startRecording,
  stopRecording,
  stopSpeaking,
  transcribeAudio,
} from '../../services/voiceService';
import {
  executeVoiceAction,
  getNavigationResponse,
  parseVoiceIntent,
} from '../../services/voiceNavigation';
import { getDailyTransitSummary } from '../../services/astroEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<VoiceStatus, { label: string; color: string }> = {
  idle: { label: 'Tap the orb to speak', color: '#8B5CF6' },
  listening: { label: 'Listening...', color: '#3B82F6' },
  processing: { label: 'Thinking...', color: '#6D28D9' },
  speaking: { label: 'VEYa is speaking...', color: '#D4A547' },
};

// ---------------------------------------------------------------------------
// Build system prompt with user context + navigation capabilities
// ---------------------------------------------------------------------------

function buildSystemPrompt(user: {
  name: string;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  birthDate: string;
  transitSummary: string;
}): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `You are VEYa, ${user.name}'s personal AI astrologer and voice assistant.
You have full knowledge of ${user.name}'s birth chart: Sun in ${user.sunSign}, Moon in ${user.moonSign}, Rising ${user.risingSign}.
Birth date: ${user.birthDate || 'unknown'}.
Current date: ${dateStr}. Current transits: ${user.transitSummary}.

IMPORTANT — You can control this app. When the user wants to:
- See their birth chart → say "Opening your birth chart"
- Pull tarot → say "Let's pull your tarot card"
- Check compatibility → say "Checking compatibility"
- Start a ritual → say "Starting your ritual"
- Write in journal → say "Opening your journal"
- See the moon phase → say "Here's the current moon phase"
- See transits → say "Showing planetary transits"

Keep responses SHORT (1-3 sentences max). Warm, personal, cosmic tone. Address ${user.name} by name occasionally.
You only know about ${user.name} — never reference other users.
When asked about the date or year, ALWAYS use the current date above.`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VeYaVoiceMode({ onClose }: Props) {
  const { data } = useOnboardingStore();

  // User data — ONLY from onboardingStore (user-isolated)
  const userName = data?.name || 'friend';
  const sunSign = data?.sunSign || 'unknown';
  const moonSign = data?.moonSign || 'unknown';
  const risingSign = data?.risingSign || 'unknown';
  const birthDate =
    data?.birthDate instanceof Date
      ? data.birthDate.toISOString().split('T')[0]
      : typeof data?.birthDate === 'string'
      ? data.birthDate
      : '';

  // Transit summary (computed once on mount)
  const [transitSummary, setTransitSummary] = useState('');
  useEffect(() => {
    try {
      const summary = getDailyTransitSummary(new Date());
      const topPlanets = summary.planets
        .slice(0, 4)
        .map((p) => `${p.name} in ${p.sign}${p.retrograde ? ' Rx' : ''}`)
        .join(', ');
      setTransitSummary(`${summary.cosmicWeather || ''} Key planets: ${topPlanets}.`.trim());
    } catch {
      setTransitSummary('');
    }
  }, []);

  // Conversation state
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [continuousListen, setContinuousListen] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const continuousRef = useRef(false); // track in async code without stale closure
  const scrollRef = useRef<ScrollView>(null);

  // Keep continuousRef in sync
  useEffect(() => {
    continuousRef.current = continuousListen;
  }, [continuousListen]);

  // ---------------------------------------------------------------------------
  // Animations
  // ---------------------------------------------------------------------------

  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (status === 'idle') {
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
    } else if (status === 'listening') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 350 }),
          withTiming(1, { duration: 350 }),
        ),
        -1,
        true,
      );
      glowOpacity.value = withTiming(0.7);
    } else if (status === 'processing') {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      glowOpacity.value = withTiming(0.4);
    } else if (status === 'speaking') {
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
  }, [status, pulseScale, glowOpacity]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // ---------------------------------------------------------------------------
  // Core voice pipeline
  // ---------------------------------------------------------------------------

  const handleStartRecording = useCallback(async () => {
    setError(null);
    try {
      // First check current status
      const currentPerm = await Audio.getPermissionsAsync();
      
      if (currentPerm.status === 'denied') {
        // Already denied — must go to Settings
        Alert.alert(
          'Microphone Access Needed',
          'VEYa needs microphone access to hear you.\n\nGo to: Settings → Apps → Expo Go → Permissions → Microphone → Allow\n\nThen come back and try again.',
          [
            { text: 'Not Now', style: 'cancel', onPress: () => setStatus('idle') },
            { text: 'Open Settings', onPress: () => { Linking.openSettings(); setStatus('idle'); } },
          ]
        );
        return;
      }
      
      if (currentPerm.status !== 'granted') {
        // Not yet asked — request it
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Microphone Access Needed',
            'Please allow microphone access when prompted, or go to Settings to enable it.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setStatus('idle') },
              { text: 'Open Settings', onPress: () => { Linking.openSettings(); setStatus('idle'); } },
            ]
          );
          return;
        }
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStatus('listening');
      const recording = await startRecording();
      recordingRef.current = recording;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'PERMISSION_DENIED' || msg.toLowerCase().includes('permission')) {
        Alert.alert(
          'Microphone Blocked',
          'Go to Settings → Apps → Expo Go → Permissions → Microphone → Allow',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setStatus('idle') },
            { text: 'Open Settings', onPress: () => { Linking.openSettings(); setStatus('idle'); } },
          ]
        );
      } else {
        setError('Could not access microphone. Tap to try again.');
      }
      setStatus('idle');
    }
  }, []);

  const handleStopAndProcess = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStatus('processing');

      const audioUri = await stopRecording(recordingRef.current);
      recordingRef.current = null;

      const transcribedText = await transcribeAudio(audioUri);
      if (!transcribedText.trim()) {
        setError("Couldn't hear you. Try again.");
        setStatus('idle');
        if (continuousRef.current) {
          setTimeout(handleStartRecording, 500);
        }
        return;
      }

      setLastTranscript(transcribedText);

      // Detect navigation intent first
      const intent = parseVoiceIntent(transcribedText);

      if (intent.type !== 'answer' && intent.type !== 'unknown') {
        // Navigation command
        const navResponse = getNavigationResponse(intent, userName);
        setLastResponse(navResponse);
        setConversation((prev) => [
          ...prev,
          { role: 'user', content: transcribedText },
          { role: 'assistant', content: navResponse },
        ]);

        setStatus('speaking');
        await speakText(navResponse);
        setStatus('idle');

        // Execute navigation — close voice mode after navigating
        const navigated = executeVoiceAction(intent);
        if (navigated) {
          onClose();
        }
        return;
      }

      // Conversational answer
      const systemPrompt = buildSystemPrompt({
        name: userName,
        sunSign,
        moonSign,
        risingSign,
        birthDate,
        transitSummary,
      });

      // Build conversation history for GPT (last 6 turns)
      const historyForGPT = conversation.slice(-6);

      const aiReply = await getAstrologyResponse(transcribedText, { name: userName, sunSign, moonSign, risingSign, birthDate }, historyForGPT);

      setLastResponse(aiReply);
      setConversation((prev) => [
        ...prev,
        { role: 'user', content: transcribedText },
        { role: 'assistant', content: aiReply },
      ]);

      setStatus('speaking');
      try {
        await speakText(aiReply);
      } catch {
        // TTS failed — text is shown anyway
      }
      setStatus('idle');

      // Continuous mode: restart recording after VEYa finishes speaking
      if (continuousRef.current) {
        setTimeout(handleStartRecording, 500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('Incorrect API key')) {
        setError('OpenAI API key expired. Please update the key in settings.');
      } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('Network')) {
        setError('No internet connection. Check your network and try again.');
      } else if (msg.includes('Whisper') || msg.includes('transcri')) {
        setError('Voice transcription failed. Speak clearly and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setStatus('idle');
    }
  }, [
    conversation,
    userName,
    sunSign,
    moonSign,
    risingSign,
    birthDate,
    transitSummary,
    onClose,
    handleStartRecording,
  ]);

  // Scroll to bottom when conversation updates
  useEffect(() => {
    if (conversation.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [conversation.length]);

  // ---------------------------------------------------------------------------
  // Orb tap handler
  // ---------------------------------------------------------------------------

  const handleOrbPress = useCallback(() => {
    if (status === 'idle') {
      handleStartRecording();
    } else if (status === 'listening') {
      handleStopAndProcess();
    } else if (status === 'speaking') {
      stopSpeaking();
      setStatus('idle');
    }
  }, [status, handleStartRecording, handleStopAndProcess]);

  // ---------------------------------------------------------------------------
  // Close handler
  // ---------------------------------------------------------------------------

  const handleClose = useCallback(async () => {
    continuousRef.current = false;
    setContinuousListen(false);
    await stopSpeaking();
    if (recordingRef.current) {
      try {
        await stopRecording(recordingRef.current);
      } catch {
        // ignore
      }
      recordingRef.current = null;
    }
    onClose();
  }, [onClose]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const cfg = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0A1F', '#1B0B38', '#2D1B4E']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Static star dots */}
      <View style={styles.starsLayer} pointerEvents="none">
        {STARS.map((s, i) => (
          <View
            key={i}
            style={[styles.star, { left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, opacity: s.opacity }]}
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
        <Text style={styles.subtitle}>{userName} · {sunSign} ☉</Text>
      </View>

      {/* Orb */}
      <View style={styles.orbArea}>
        <Animated.View style={[styles.orbGlow, glowStyle, { backgroundColor: cfg.color }]} />
        <Animated.View style={[styles.orbWrap, orbStyle]}>
          <Pressable onPress={handleOrbPress} style={styles.orbPressable}>
            <LinearGradient colors={[cfg.color, '#4C1D95']} style={styles.orb}>
              {status === 'processing' ? (
                <ActivityIndicator size="large" color="#FFF" />
              ) : status === 'listening' ? (
                <Ionicons name="mic" size={48} color="#FFF" />
              ) : status === 'speaking' ? (
                <Ionicons name="volume-high" size={48} color="#FFF" />
              ) : (
                <Ionicons name="mic-outline" size={48} color="#FFF" />
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Status label */}
      <Text style={styles.statusLabel}>{cfg.label}</Text>
      {status === 'listening' && (
        <Text style={styles.tapHint}>Tap again when done</Text>
      )}

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={styles.conversationScroll}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
      >
        {conversation.length === 0 && status === 'idle' && (
          <Text style={styles.hint}>
            Ask about your chart, today's energy, or say{'\n'}"show my chart" to navigate
          </Text>
        )}
        {conversation.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.msgBubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text style={[styles.msgText, msg.role === 'user' && styles.userMsgText]}>
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Continuous listen toggle */}
      <View style={styles.continuousRow}>
        <Text style={styles.continuousLabel}>Keep listening</Text>
        <Switch
          value={continuousListen}
          onValueChange={setContinuousListen}
          trackColor={{ false: 'rgba(255,255,255,0.15)', true: '#7C3AED' }}
          thumbColor={continuousListen ? '#A78BFA' : 'rgba(255,255,255,0.6)'}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Static star positions (pre-seeded to avoid re-render jitter)
// ---------------------------------------------------------------------------

const STARS = Array.from({ length: 28 }, (_, i) => ({
  x: ((i * 37 + 11) % 97),
  y: ((i * 53 + 7) % 95),
  size: (i % 3) + 1,
  opacity: ((i % 5) * 0.1) + 0.15,
}));

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
    color: '#F87171',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
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
