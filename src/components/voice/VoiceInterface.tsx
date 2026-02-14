// ============================================================================
// VEYa Voice Interface — Fullscreen Cosmic Overlay
// ============================================================================

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInUp,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import {
  startRecording,
  stopRecording,
  transcribeAudio,
  speakText,
  stopSpeaking,
} from '../../services/voiceService';
import { useVoiceStore } from '../../stores/voiceStore';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { chatWithVeya } from '../../services/ai';
import { VEYA_VOICE_SYSTEM_PROMPT } from '../../constants/veyaVoicePrompt';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const STATUS_LABELS = {
  idle: 'Tap to speak',
  listening: 'Listening...',
  processing: 'Understanding...',
  speaking: 'VEYa is speaking...',
};

const COLOR_STOPS = {
  idle: '#7C3AED',
  listening: '#3B82F6',
  processing: '#6D28D9',
  speaking: '#F5C16C',
};

interface VoiceInterfaceProps {
  onClose: () => void;
  /** If provided, transcribed text is sent to parent instead of handled internally */
  onTranscript?: (text: string) => void;
  /** External response text (from parent chat) */
  responseText?: string | null;
}

export default function VoiceInterface({
  onClose,
  onTranscript,
  responseText: externalResponse,
}: VoiceInterfaceProps) {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [internalResponse, setInternalResponse] = useState<string | null>(null);
  const [displayedResponse, setDisplayedResponse] = useState<string>('');
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const responseText = externalResponse ?? internalResponse;

  const {
    isRecording,
    isTranscribing,
    isSpeaking,
    currentTranscript,
    setRecording,
    setTranscribing,
    setSpeaking,
    setTranscript,
  } = useVoiceStore();

  // Get real user profile from onboarding store
  const { data: onboardingData } = useOnboardingStore();
  const userProfile = useMemo(() => ({
    user_id: 'user-' + Date.now(),
    name: onboardingData?.name || 'Friend',
    sun_sign: onboardingData?.sunSign || 'Aries',
    moon_sign: onboardingData?.moonSign || 'Aries',
    rising_sign: onboardingData?.risingSign || 'Aries',
  }), [onboardingData]);

  const status: keyof typeof STATUS_LABELS = isRecording
    ? 'listening'
    : isTranscribing
      ? 'processing'
      : isSpeaking
        ? 'speaking'
        : 'idle';

  // --- Typewriter effect for response ---
  useEffect(() => {
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current);
      typewriterRef.current = null;
    }

    if (responseText) {
      const words = responseText.split(' ');
      let index = 0;
      setDisplayedResponse('');
      typewriterRef.current = setInterval(() => {
        index++;
        setDisplayedResponse(words.slice(0, index).join(' '));
        if (index >= words.length) {
          if (typewriterRef.current) clearInterval(typewriterRef.current);
        }
      }, 80);
    } else {
      setDisplayedResponse('');
    }

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [responseText]);

  useEffect(() => {
    if (!externalResponse || !onTranscript) return;
    if (lastSpokenText === externalResponse) return;

    const speak = async () => {
      setLastSpokenText(externalResponse);
      setSpeaking(true);
      try {
        await speakText(externalResponse);
      } catch {
        // Silent fail
      } finally {
        setSpeaking(false);
      }
    };

    speak();
  }, [externalResponse, lastSpokenText, onTranscript, setSpeaking]);

  // --- Animations ---
  const pulse = useSharedValue(1);
  const rotation = useSharedValue(0);
  const colorShift = useSharedValue(0);
  const wave1 = useSharedValue(0.4);
  const wave2 = useSharedValue(0.6);
  const wave3 = useSharedValue(0.5);

  useEffect(() => {
    if (status === 'idle') {
      pulse.value = withRepeat(
        withSequence(withTiming(1.05, { duration: 1400 }), withTiming(1, { duration: 1400 })),
        -1, true,
      );
      rotation.value = 0;
      colorShift.value = withTiming(0, { duration: 400 });
    }
    if (status === 'listening') {
      pulse.value = withRepeat(
        withSequence(withTiming(1.15, { duration: 700 }), withTiming(1, { duration: 700 })),
        -1, true,
      );
      rotation.value = 0;
      colorShift.value = withTiming(1, { duration: 300 });
    }
    if (status === 'processing') {
      pulse.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 800 }), withTiming(1, { duration: 800 })),
        -1, true,
      );
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1, false,
      );
      colorShift.value = withTiming(2, { duration: 300 });
    }
    if (status === 'speaking') {
      pulse.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 1400 }), withTiming(1, { duration: 1400 })),
        -1, true,
      );
      rotation.value = 0;
      colorShift.value = withTiming(3, { duration: 300 });
    }
  }, [status]);

  useEffect(() => {
    if (isRecording) {
      wave1.value = withRepeat(withSequence(withTiming(1, { duration: 300 }), withTiming(0.3, { duration: 300 })), -1, true);
      wave2.value = withRepeat(withSequence(withTiming(0.8, { duration: 280 }), withTiming(0.2, { duration: 280 })), -1, true);
      wave3.value = withRepeat(withSequence(withTiming(0.9, { duration: 320 }), withTiming(0.25, { duration: 320 })), -1, true);
    } else {
      wave1.value = 0.4;
      wave2.value = 0.6;
      wave3.value = 0.5;
    }
  }, [isRecording]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }, { rotate: `${rotation.value}deg` }],
    backgroundColor: interpolateColor(
      colorShift.value,
      [0, 1, 2, 3],
      [COLOR_STOPS.idle, COLOR_STOPS.listening, COLOR_STOPS.processing, COLOR_STOPS.speaking],
    ),
  }));

  const wave1Style = useAnimatedStyle(() => ({ transform: [{ scaleY: wave1.value }] }));
  const wave2Style = useAnimatedStyle(() => ({ transform: [{ scaleY: wave2.value }] }));
  const wave3Style = useAnimatedStyle(() => ({ transform: [{ scaleY: wave3.value }] }));

  const stars = useMemo(
    () => Array.from({ length: 26 }).map((_, i) => ({
      key: `star-${i}`,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.7 + 0.2,
    })),
    [],
  );

  // --- Handlers ---
  const handleStart = async () => {
    if (isRecording || isTranscribing) return;
    setTranscript(null);
    setInternalResponse(null);
    setDisplayedResponse('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      setRecording(true);
      recordingRef.current = await startRecording();
    } catch {
      setRecording(false);
    }
  };

  const handleStop = async () => {
    if (!recordingRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecording(false);
    setTranscribing(true);
    try {
      const uri = await stopRecording(recordingRef.current);
      const transcript = await transcribeAudio(uri);
      setTranscript(transcript || null);
      if (transcript?.trim()) {
        if (onTranscript) {
          // Parent handles the response (chat integration)
          onTranscript(transcript.trim());
        } else {
          // Standalone mode — call AI directly with voice prompt using real user profile
          const reply = await chatWithVeya(
            transcript.trim(),
            [{ role: 'system', content: VEYA_VOICE_SYSTEM_PROMPT }],
            userProfile as any,
            [],
            false,
          );
          setInternalResponse(reply);
          setLastSpokenText(reply);
          setSpeaking(true);
          try {
            await speakText(reply);
          } catch { /* silent */ }
          setSpeaking(false);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setTranscribing(false);
      recordingRef.current = null;
    }
  };

  const handleToggle = () => {
    if (isRecording) handleStop();
    else handleStart();
  };

  const handleReplay = async () => {
    const textToReplay = lastSpokenText || responseText;
    if (!textToReplay) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSpeaking(true);
    try {
      await speakText(textToReplay);
    } catch { /* silent */ }
    setSpeaking(false);
  };

  const handleClose = async () => {
    if (isRecording) await handleStop();
    await stopSpeaking();
    setSpeaking(false);
    setInternalResponse(null);
    setDisplayedResponse('');
    onClose();
  };

  const showReplay = !isSpeaking && !isRecording && !isTranscribing && (lastSpokenText || responseText);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#05010C', '#120528', '#1B0B38']}
        style={StyleSheet.absoluteFillObject}
      />

      {stars.map((star) => (
        <View
          key={star.key}
          style={[styles.star, {
            left: star.left as any,
            top: star.top as any,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }]}
        />
      ))}

      <Pressable onPress={handleClose} style={styles.closeButton} hitSlop={12}>
        <Ionicons name="close" size={20} color="#fff" />
      </Pressable>

      <View style={styles.centerContent}>
        <Pressable onPress={handleToggle} style={styles.orbTouch}>
          <Animated.View style={[styles.orb, orbStyle]}>
            {isRecording && (
              <View style={styles.waveform}>
                <Animated.View style={[styles.waveBar, wave1Style]} />
                <Animated.View style={[styles.waveBar, wave2Style]} />
                <Animated.View style={[styles.waveBar, wave3Style]} />
              </View>
            )}
            {!isRecording && status === 'idle' && (
              <Ionicons name="mic" size={48} color="rgba(255,255,255,0.85)" />
            )}
          </Animated.View>
        </Pressable>

        <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>

        {currentTranscript && (
          <Text style={styles.transcriptText}>"{currentTranscript}"</Text>
        )}

        {displayedResponse ? (
          <Animated.View entering={FadeInUp.duration(600)} style={styles.responseWrap}>
            <Text style={styles.responseText}>{displayedResponse}</Text>
          </Animated.View>
        ) : null}

        {showReplay && (
          <Pressable onPress={handleReplay} style={styles.replayButton}>
            <Text style={styles.replayText}>Replay 🔁</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const ORB_SIZE = Math.min(SCREEN_WIDTH * 0.55, 240);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05010C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 26,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  orbTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.35,
    shadowRadius: 30,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  waveBar: {
    width: 8,
    height: 38,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  statusText: {
    marginTop: 24,
    fontSize: 16,
    color: '#E9D9FF',
    fontFamily: 'Inter-Medium',
  },
  transcriptText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    paddingHorizontal: 20,
  },
  responseWrap: {
    marginTop: 22,
    paddingHorizontal: 18,
    maxHeight: 200,
  },
  responseText: {
    fontSize: 16,
    color: '#F6E7C8',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  replayButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  replayText: {
    fontSize: 14,
    color: '#E9D9FF',
    fontFamily: 'Inter-SemiBold',
  },
});
