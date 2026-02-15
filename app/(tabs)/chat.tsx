/**
 * VEYa — Chat Tab with Voice AI
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Keyboard,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore, type DisplayMessage } from '../../src/stores/chatStore';
import { useOnboardingStore } from '../../src/stores/onboardingStore';
import {
  startRecording,
  stopRecording,
  transcribeAudio,
  speakText,
  stopSpeaking,
  getVoiceState,
} from '../../src/services/voiceService';
import type { Audio } from 'expo-av';
import type { UserProfile } from '../../src/types';
import { colors as themeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

// Extended colors using design system as base
const COLORS = {
  bg: themeColors.background,
  primary: themeColors.primary,
  primaryLight: themeColors.primaryLight,
  gold: themeColors.accentGold,
  goldLight: 'rgba(212, 165, 71, 0.08)',
  goldBorder: 'rgba(212, 165, 71, 0.15)',
  textPrimary: themeColors.textPrimary,
  textSecondary: themeColors.textSecondary,
  textMuted: themeColors.textMuted,
  white: themeColors.white,
  inputBg: themeColors.surface,
  border: themeColors.border,
  aiBubbleBg: '#FFFDF8',
  aiBubbleBorder: 'rgba(212, 165, 71, 0.12)',
};

// Feature Discovery: Suggested Questions organized by category
const SUGGESTED_CATEGORIES = [
  {
    title: 'Daily Guidance',
    emoji: '☀️',
    questions: [
      "What does today hold for me?",
      "What should I focus on this week?",
    ],
  },
  {
    title: 'Love & Relationships',
    emoji: '💕',
    questions: [
      "Tell me about my love life",
      "What's my compatibility with Libra?",
    ],
  },
  {
    title: 'Career & Purpose',
    emoji: '🚀',
    questions: [
      "Career guidance please",
      "What are my natural talents?",
    ],
  },
  {
    title: 'Self Discovery',
    emoji: '✨',
    questions: [
      "Explain my birth chart",
      "Tell me about my rising sign",
    ],
  },
];

// Flat list for quick access
const SUGGESTED = [
  '✨ What does today hold for me?',
  '💜 Tell me about my love life',
  '🚀 Career guidance please',
  '🌙 What should I focus on this week?',
  '⭐ Explain my birth chart',
  '💫 Tell me about my moon sign',
];

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      );
    const a1 = createBounce(dot1, 0);
    const a2 = createBounce(dot2, 150);
    const a3 = createBounce(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
  });

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Text style={styles.typingLabel}>VEYa is consulting the stars</Text>
        <View style={styles.dotsRow}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, dotStyle(dot)]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function MessageBubble({ item }: { item: DisplayMessage }) {
  const isUser = item.role === 'user';
  const time = new Date(item.timestamp);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>✨</Text>
        </View>
      )}
      <View style={styles.bubbleColumn}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.bubbleText, isUser && styles.userBubbleText]}>{item.content}</Text>
        </View>
        <View style={[styles.metaRow, isUser && styles.metaRowUser]}>
          <Text style={[styles.timeText, isUser && styles.timeTextUser]}>{timeStr}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { messages, isLoading, sendMessage, clearChat } = useChatStore();
  const onboardingData = useOnboardingStore((s) => s.data);

  // Voice state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const userProfile: any = {
    id: 'local',
    user_id: 'local',
    name: onboardingData.name || null,
    sun_sign: onboardingData.sunSign || null,
    onboarding_completed: true,
    focus_areas: onboardingData.focusAreas || [],
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isLoading]);

  // Pulse animation for recording
  useEffect(() => {
    if (isVoiceRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isVoiceRecording, pulseAnim]);

  const handleSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    Keyboard.dismiss();
    sendMessage(trimmed, userProfile);
  }, [isLoading, sendMessage, userProfile]);

  // Voice recording handlers
  const handleMicPress = useCallback(async () => {
    if (isVoiceRecording) {
      // Stop recording
      try {
        if (recordingRef.current) {
          setIsVoiceRecording(false);
          setIsTranscribing(true);
          const uri = await stopRecording(recordingRef.current);
          recordingRef.current = null;

          // Transcribe with Whisper
          const transcript = await transcribeAudio(uri);
          setIsTranscribing(false);

          if (transcript.trim()) {
            // Send as voice message and get the response text directly
            const responseText = await sendMessage(transcript, userProfile, false, true);

            // Speak VEYa's response
            if (responseText && responseText.trim()) {
              setIsSpeaking(true);
              try {
                await speakText(responseText);
              } catch (ttsErr) {
                console.warn('[Voice] TTS failed:', ttsErr);
              } finally {
                setIsSpeaking(false);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Voice] Full pipeline error:', err);
        setIsVoiceRecording(false);
        setIsTranscribing(false);
        setIsSpeaking(false);
        recordingRef.current = null;
        Alert.alert('Voice Error', 'Could not process your voice. Please try again.');
      }
    } else {
      // Start recording
      try {
        if (isSpeaking) {
          await stopSpeaking();
          setIsSpeaking(false);
        }
        const recording = await startRecording();
        recordingRef.current = recording;
        setIsVoiceRecording(true);
      } catch (err) {
        Alert.alert('Microphone Access', 'Please allow microphone access in your device settings to use voice.');
      }
    }
  }, [isVoiceRecording, isSpeaking, sendMessage, userProfile]);

  const sunSign = userProfile.sun_sign;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Talk to VEYa</Text>
          <Text style={styles.headerSubtitle}>Your AI Astrologer</Text>
        </View>
        {messages.length > 0 && (
          <Pressable onPress={clearChat} style={styles.clearBtn} hitSlop={12}>
            <Text style={styles.clearBtnText}>New Chat</Text>
          </Pressable>
        )}
      </View>

      {messages.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyEmoji}>✨</Text>
          </View>
          <Text style={styles.emptyTitle}>Ask VEYa Anything</Text>
          <Text style={styles.emptySubtitle}>Your personal AI astrologer — ask about your stars, your path, your purpose</Text>
          {sunSign && <View style={styles.signBadge}><Text style={styles.signBadgeText}>☉ {sunSign}</Text></View>}
          
          {/* Feature Discovery: How VEYa Can Help */}
          <View style={styles.featureDiscovery}>
            <Text style={styles.featureDiscoveryTitle}>💬 How can VEYa help?</Text>
            <Text style={styles.featureDiscoveryDesc}>
              Ask about daily insights, compatibility, career guidance, or dive deep into your birth chart. Tap a suggestion or type your own question.
            </Text>
          </View>
          
          {/* Suggested Questions */}
          <View style={styles.suggestions}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            {SUGGESTED.slice(0, 4).map((s, i) => (
              <Pressable key={i} onPress={() => handleSend(s.replace(/^[^\w]*/, ''))} style={({ pressed }) => [styles.suggestion, pressed && styles.suggestionPressed]}>
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
          
          {/* Voice Feature Hint */}
          <View style={styles.voiceHint}>
            <Text style={styles.voiceHintText}>🎙️ Tap the mic to talk to VEYa</Text>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <MessageBubble item={item} />}
          ListFooterComponent={isLoading ? <TypingIndicator /> : null}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
        {/* Voice status indicator */}
        {(isTranscribing || isSpeaking) && (
          <View style={styles.voiceStatusBar}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.voiceStatusText}>
              {isTranscribing ? 'Transcribing...' : 'VEYa is speaking...'}
            </Text>
          </View>
        )}
        <View style={styles.inputRow}>
          {/* Mic button */}
          <Pressable
            onPress={handleMicPress}
            disabled={isLoading || isTranscribing}
            style={({ pressed }) => [
              styles.micBtn,
              isVoiceRecording && styles.micBtnRecording,
              pressed && styles.micBtnPressed,
            ]}
          >
            <Animated.View style={{ transform: [{ scale: isVoiceRecording ? pulseAnim : 1 }] }}>
              <Text style={[styles.micBtnText, isVoiceRecording && styles.micBtnTextRecording]}>
                {isVoiceRecording ? '⏹' : '🎙️'}
              </Text>
            </Animated.View>
          </Pressable>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={isVoiceRecording ? 'Listening...' : 'Ask the cosmos...'}
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={() => handleSend(input)}
            returnKeyType="send"
            multiline
            maxLength={500}
            editable={!isLoading && !isVoiceRecording}
          />
          <Pressable
            onPress={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            style={({ pressed }) => [styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled, pressed && styles.sendBtnPressed]}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter-Regular', color: COLORS.textMuted, marginTop: 2 },
  clearBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.goldLight, borderWidth: 1, borderColor: COLORS.goldBorder },
  clearBtnText: { fontSize: 12, fontFamily: 'Inter-Medium', color: COLORS.gold },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.goldLight, borderWidth: 1, borderColor: COLORS.goldBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay-Bold', color: COLORS.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter-Regular', color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  featureDiscovery: { marginTop: 20, backgroundColor: COLORS.goldLight, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.goldBorder, width: '100%' },
  featureDiscoveryTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: COLORS.textPrimary, marginBottom: 6 },
  featureDiscoveryDesc: { fontSize: 13, fontFamily: 'Inter-Regular', color: COLORS.textSecondary, lineHeight: 19 },
  signBadge: { backgroundColor: COLORS.goldLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.goldBorder, marginTop: 12 },
  signBadgeText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: COLORS.gold },
  suggestions: { marginTop: 20, width: '100%' },
  suggestionsTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: COLORS.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  suggestion: { backgroundColor: COLORS.white, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.goldBorder },
  suggestionPressed: { backgroundColor: COLORS.goldLight },
  suggestionText: { fontSize: 15, fontFamily: 'Inter-Medium', color: COLORS.textPrimary },
  voiceHint: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: COLORS.primaryLight, borderRadius: 20 },
  voiceHintText: { fontSize: 13, fontFamily: 'Inter-Medium', color: COLORS.primary },
  messageList: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  messageRowUser: { justifyContent: 'flex-end' },
  avatarContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.goldLight, borderWidth: 1, borderColor: COLORS.goldBorder, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 14 },
  bubbleColumn: { maxWidth: '78%' },
  bubble: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: COLORS.aiBubbleBg, borderWidth: 1, borderColor: COLORS.aiBubbleBorder, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, fontFamily: 'Inter-Regular', color: COLORS.textPrimary, lineHeight: 22 },
  userBubbleText: { color: COLORS.white },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  metaRowUser: { justifyContent: 'flex-end' },
  timeText: { fontSize: 11, fontFamily: 'Inter-Regular', color: COLORS.textMuted },
  timeTextUser: { color: COLORS.textMuted },
  typingContainer: { paddingHorizontal: 16, marginBottom: 8 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.aiBubbleBg, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.aiBubbleBorder, alignSelf: 'flex-start' },
  typingLabel: { fontSize: 13, fontFamily: 'Inter-Regular', color: COLORS.textMuted, marginRight: 8 },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.gold },
  inputBar: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end' },
  voiceStatusBar: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8, gap: 8 },
  voiceStatusText: { fontSize: 12, fontFamily: 'Inter-Regular', color: COLORS.textMuted },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.goldLight, borderWidth: 1, borderColor: COLORS.goldBorder, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  micBtnRecording: { backgroundColor: '#FFE5E5', borderColor: '#FF4444' },
  micBtnPressed: { opacity: 0.7 },
  micBtnText: { fontSize: 20 },
  micBtnTextRecording: { fontSize: 18 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: COLORS.inputBg, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter-Regular', color: COLORS.textPrimary, marginRight: 10 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendBtnPressed: { opacity: 0.8 },
  sendBtnText: { fontSize: 20, color: COLORS.white, fontWeight: 'bold' },
});
