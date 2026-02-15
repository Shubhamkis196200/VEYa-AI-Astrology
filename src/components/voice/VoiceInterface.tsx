// ============================================================================
// VEYa Voice Interface — Personal Astrology Voice Assistant
// ============================================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import {
  startRecording,
  stopRecording,
  transcribeAudio,
  getAstrologyResponse,
  speakText,
  stopSpeaking,
  testOpenAIConnection,
} from '../../services/voiceService';
import { useOnboardingStore } from '../../stores/onboardingStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceInterfaceProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Status Labels
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<VoiceStatus, { label: string; color: string }> = {
  idle: { label: 'Tap the orb to speak', color: '#8B5CF6' },
  listening: { label: 'Listening...', color: '#3B82F6' },
  processing: { label: 'Thinking...', color: '#6D28D9' },
  speaking: { label: 'Speaking...', color: '#D4A547' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VoiceInterface({ onClose }: VoiceInterfaceProps) {
  const { data } = useOnboardingStore();
  
  // State
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  // User profile for context
  const userProfile = {
    name: data?.name || 'friend',
    sunSign: data?.sunSign,
    moonSign: data?.moonSign,
    risingSign: data?.risingSign,
    birthDate: data?.birthDate,
  };

  // Animation values
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  // Animations
  useEffect(() => {
    if (status === 'idle') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 2000 }),
          withTiming(0.3, { duration: 2000 })
        ),
        -1,
        true
      );
    } else if (status === 'listening') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    } else if (status === 'processing') {
      pulseScale.value = withRepeat(
        withTiming(1.1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else if (status === 'speaking') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    }
  }, [status]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    if (status !== 'idle') return;
    
    setError(null);
    setTranscript(null);
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStatus('listening');
      
      const recording = await startRecording();
      recordingRef.current = recording;
    } catch (err: any) {
      console.error('[Voice] Start recording error:', err);
      setError('Could not start recording. Please check microphone permissions.');
      setStatus('idle');
    }
  }, [status]);

  // Handle recording stop and process
  const handleStopRecording = useCallback(async () => {
    if (status !== 'listening' || !recordingRef.current) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStatus('processing');
      
      // Stop recording
      const audioUri = await stopRecording(recordingRef.current);
      recordingRef.current = null;
      
      // Transcribe
      const transcribedText = await transcribeAudio(audioUri);
      
      if (!transcribedText.trim()) {
        setError('Could not hear you. Please try again.');
        setStatus('idle');
        return;
      }
      
      setTranscript(transcribedText);
      
      // Add to conversation history
      const newConversation: ConversationMessage[] = [
        ...conversation,
        { role: 'user', content: transcribedText },
      ];
      
      // Get AI response
      const aiResponse = await getAstrologyResponse(
        transcribedText,
        userProfile,
        conversation
      );
      
      setResponse(aiResponse);
      setConversation([
        ...newConversation,
        { role: 'assistant', content: aiResponse },
      ]);
      
      // Speak the response
      setStatus('speaking');
      await speakText(aiResponse);
      
      setStatus('idle');
    } catch (err: any) {
      console.error('[Voice] Processing error:', err);
      setError('Something went wrong. Please try again.');
      setStatus('idle');
    }
  }, [status, conversation, userProfile]);

  // Handle orb tap
  const handleOrbPress = useCallback(() => {
    if (status === 'idle') {
      handleStartRecording();
    } else if (status === 'listening') {
      handleStopRecording();
    } else if (status === 'speaking') {
      stopSpeaking();
      setStatus('idle');
    }
  }, [status, handleStartRecording, handleStopRecording]);

  // Handle close
  const handleClose = useCallback(async () => {
    await stopSpeaking();
    if (recordingRef.current) {
      try {
        await stopRecording(recordingRef.current);
      } catch (e) {}
    }
    onClose();
  }, [onClose]);

  // Current status config
  const currentConfig = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0A1F', '#1B0B38', '#2D1B4E']}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Stars background */}
      <View style={styles.starsContainer} pointerEvents="none">
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                opacity: Math.random() * 0.6 + 0.2,
              },
            ]}
          />
        ))}
      </View>

      {/* Close button */}
      <Pressable onPress={handleClose} style={styles.closeButton}>
        <Ionicons name="close" size={28} color="rgba(255,255,255,0.7)" />
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>VEYa</Text>
        <Text style={styles.subtitle}>Your Personal Astrologer</Text>
      </View>

      {/* Main orb */}
      <View style={styles.orbContainer}>
        <Animated.View style={[styles.orbGlow, glowStyle, { backgroundColor: currentConfig.color }]} />
        <Animated.View style={[styles.orbWrapper, orbStyle]}>
          <Pressable onPress={handleOrbPress} style={styles.orbPressable}>
            <LinearGradient
              colors={[currentConfig.color, '#4C1D95']}
              style={styles.orb}
            >
              {status === 'processing' ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : status === 'listening' ? (
                <Ionicons name="mic" size={48} color="#FFFFFF" />
              ) : status === 'speaking' ? (
                <Ionicons name="volume-high" size={48} color="#FFFFFF" />
              ) : (
                <Ionicons name="mic-outline" size={48} color="#FFFFFF" />
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>

      {/* Status label */}
      <Text style={styles.statusLabel}>{currentConfig.label}</Text>

      {/* Conversation display */}
      <View style={styles.conversationContainer}>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        
        {transcript && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>You said:</Text>
            <Text style={styles.messageText}>{transcript}</Text>
          </View>
        )}
        
        {response && (
          <View style={[styles.messageContainer, styles.responseContainer]}>
            <Text style={[styles.messageLabel, styles.responseLabel]}>VEYa:</Text>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        )}
      </View>

      {/* User info */}
      <View style={styles.userInfo}>
        <Text style={styles.userInfoText}>
          {userProfile.name} • {userProfile.sunSign || 'Unknown'} ☉
        </Text>
      </View>

      {/* Instructions */}
      <Text style={styles.instructions}>
        {status === 'idle' 
          ? 'Ask about your chart, today\'s energy, or cosmic guidance'
          : status === 'listening'
          ? 'Tap again when done speaking'
          : ''
        }
      </Text>
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
    paddingTop: 60,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  orbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  orbWrapper: {
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
    marginBottom: 20,
  },
  conversationContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 24,
    maxHeight: SCREEN_HEIGHT * 0.3,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 16,
  },
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  messageLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  responseContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  responseLabel: {
    color: '#A78BFA',
  },
  responseText: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  userInfo: {
    paddingVertical: 12,
  },
  userInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  instructions: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
});
