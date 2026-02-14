// ============================================================================
// VEYa Moment Capture — Record Life Moments with Cosmic Context
// ============================================================================
//
// A floating action button that lets users capture significant moments
// and automatically records the transits at that exact time.
//

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentTransits, getMoonPhase } from '@/services/astroEngine';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CapturedMoment {
  id: string;
  timestamp: string;
  note: string;
  transits: Array<{
    planet: string;
    sign: string;
    degree: number;
  }>;
  moonPhase: {
    name: string;
    sign: string;
    illumination: number;
  };
  emotion?: string;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const MOMENTS_STORAGE_KEY = 'veya-captured-moments';

async function saveMoment(moment: CapturedMoment): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(MOMENTS_STORAGE_KEY);
    const moments: CapturedMoment[] = stored ? JSON.parse(stored) : [];
    moments.unshift(moment);
    // Keep only last 100 moments
    const trimmed = moments.slice(0, 100);
    await AsyncStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[MomentCapture] Failed to save:', e);
  }
}

export async function getMoments(): Promise<CapturedMoment[]> {
  try {
    const stored = await AsyncStorage.getItem(MOMENTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('[MomentCapture] Failed to load:', e);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Emotion Options
// ---------------------------------------------------------------------------

const EMOTIONS = [
  { emoji: '✨', label: 'Amazing' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '💕', label: 'Loved' },
  { emoji: '🔥', label: 'Energized' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😢', label: 'Sad' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MomentCaptureButtonProps {
  style?: object;
}

export default function MomentCaptureButton({ style }: MomentCaptureButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [note, setNote] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Floating button animation
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const handleCapture = async () => {
    if (!note.trim() && !selectedEmotion) return;
    
    setIsSaving(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const transits = getCurrentTransits();
      const moonPhase = getMoonPhase();

      const moment: CapturedMoment = {
        id: `moment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        note: note.trim(),
        transits: transits.map(t => ({
          planet: t.name,
          sign: t.sign,
          degree: t.signDegree,
        })),
        moonPhase: {
          name: moonPhase.phaseName,
          sign: moonPhase.moonSign,
          illumination: moonPhase.illumination,
        },
        emotion: selectedEmotion || undefined,
      };

      await saveMoment(moment);
      
      // Reset and close
      setNote('');
      setSelectedEmotion(null);
      setModalVisible(false);
    } catch (error) {
      console.warn('[MomentCapture] Error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setNote('');
    setSelectedEmotion(null);
    setModalVisible(false);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatedPressable
        onPress={handlePress}
        style={[styles.floatingButton, style, buttonStyle]}
      >
        {/* Glow effect */}
        <Animated.View style={[styles.buttonGlow, glowStyle]} />
        
        <LinearGradient
          colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonIcon}>✨</Text>
        </LinearGradient>
      </AnimatedPressable>

      {/* Capture Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Animated.View 
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['#1B0B38', '#2D1B4E']}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>✨ Capture This Moment</Text>
                <Text style={styles.modalSubtitle}>
                  Record what's happening — we'll remember the cosmic weather
                </Text>
              </View>

              {/* Emotion Picker */}
              <View style={styles.emotionSection}>
                <Text style={styles.emotionLabel}>How do you feel?</Text>
                <View style={styles.emotionGrid}>
                  {EMOTIONS.map((emotion) => (
                    <Pressable
                      key={emotion.label}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedEmotion(emotion.emoji);
                      }}
                      style={[
                        styles.emotionButton,
                        selectedEmotion === emotion.emoji && styles.emotionButtonSelected,
                      ]}
                    >
                      <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                      <Text style={styles.emotionText}>{emotion.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Note Input */}
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>What's happening?</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="A meaningful conversation, a decision, a feeling..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  multiline
                  numberOfLines={4}
                  style={styles.noteInput}
                  maxLength={500}
                />
              </View>

              {/* Current Cosmic Weather Preview */}
              <View style={styles.cosmicPreview}>
                <Text style={styles.cosmicPreviewLabel}>🌙 Current Cosmic Weather</Text>
                <Text style={styles.cosmicPreviewText}>
                  Moon in {getMoonPhase().moonSign} · {getMoonPhase().phaseName}
                </Text>
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <Pressable onPress={handleClose} style={styles.cancelButton}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCapture}
                  style={[styles.captureButton, isSaving && styles.captureButtonDisabled]}
                  disabled={isSaving}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.captureGradient}
                  >
                    <Text style={styles.captureText}>
                      {isSaving ? 'Saving...' : 'Capture ✨'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 1000,
  },
  buttonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 40,
    backgroundColor: '#8B5CF6',
  },
  buttonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonIcon: {
    fontSize: 28,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  emotionSection: {
    marginBottom: spacing.lg,
  },
  emotionLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emotionButton: {
    width: '23%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emotionButtonSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  emotionEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  emotionText: {
    fontFamily: typography.fonts.body,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  noteSection: {
    marginBottom: spacing.md,
  },
  noteLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  noteInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  cosmicPreview: {
    backgroundColor: 'rgba(212, 165, 71, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  cosmicPreviewLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: '#D4A547',
    marginBottom: 4,
  },
  cosmicPreviewText: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  captureButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  captureText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
