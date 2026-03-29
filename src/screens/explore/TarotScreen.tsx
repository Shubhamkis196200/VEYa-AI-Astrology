import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDailyCard, isCardReversed } from '@/data/tarotDeck';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { chatWithVeya } from '@/services/ai';

interface Props { onClose: () => void; }

export default function TarotScreen({ onClose }: Props) {
  const { data } = useOnboardingStore();
  const card = getDailyCard(data.name || 'veya-user');
  const reversed = isCardReversed(card.id, 0, data.name || 'veya-user');

  const [flipped, setFlipped] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [aiReading, setAiReading] = useState<string | null>(null);
  const [loadingReading, setLoadingReading] = useState(false);

  const flipAnim = useRef(new Animated.Value(1)).current;

  const handleFlip = () => {
    if (flipping || flipped) return;
    setFlipping(true);
    Animated.timing(flipAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setFlipped(true);
      Animated.timing(flipAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start(() => {
        setFlipping(false);
      });
    });
  };

  const handleGetReading = async () => {
    setLoadingReading(true);
    try {
      const orientation = reversed ? 'reversed' : 'upright';
      const prompt = `I pulled the ${card.name} tarot card ${orientation} today. My sun sign is ${data.sunSign || 'unknown'}. Please give me a warm, personal 2-3 sentence reading for how this card's energy applies to my day.`;
      const response = await chatWithVeya(
        prompt,
        [],
        {
          id: 'local',
          user_id: 'local',
          name: data.name || null,
          sun_sign: data.sunSign || null,
        } as any,
        [],
        false,
        false,
      );
      setAiReading(response);
    } catch {
      setAiReading('The stars are quiet right now. Try again in a moment.');
    } finally {
      setLoadingReading(false);
    }
  };

  const meaning = reversed ? card.reversed : card.upright;
  const keywords = card.keywords.join(' · ');

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#1A1625" />
        </Pressable>
        <Text style={styles.headerTitle}>Daily Tarot</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Card */}
        <Pressable onPress={handleFlip} disabled={flipped || flipping} style={styles.cardTouchable}>
          <Animated.View style={[styles.cardOuter, { transform: [{ scaleX: flipAnim }] }]}>
            {!flipped ? (
              /* Card Back */
              <View style={styles.cardBack}>
                <Text style={styles.cardBackStar}>✦</Text>
                <Text style={styles.cardBackLabel}>Tap to reveal</Text>
              </View>
            ) : (
              /* Card Front */
              <View style={styles.cardFront}>
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
                <Text style={styles.cardNumber}>
                  {card.arcana === 'major' ? `Major Arcana · ${card.number}` : `${card.suit ?? ''}`}
                </Text>
                {reversed && (
                  <View style={styles.reversedBadge}>
                    <Text style={styles.reversedBadgeText}>Reversed</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </Pressable>

        {flipped && (
          <>
            {/* Card name */}
            <Text style={styles.cardName}>{card.name}{reversed ? ' ↕' : ''}</Text>
            <Text style={styles.cardKeywords}>{keywords}</Text>

            {/* Meaning */}
            <View style={styles.meaningCard}>
              <Text style={styles.meaningLabel}>{reversed ? 'Reversed Meaning' : 'Upright Meaning'}</Text>
              <Text style={styles.meaningText}>{meaning}</Text>
            </View>

            {/* AI Reading */}
            {aiReading ? (
              <View style={styles.readingCard}>
                <Text style={styles.readingLabel}>✨ VEYa's Reading</Text>
                <Text style={styles.readingText}>{aiReading}</Text>
              </View>
            ) : (
              <Pressable
                onPress={handleGetReading}
                disabled={loadingReading}
                style={styles.readingBtn}
              >
                {loadingReading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.readingBtnText}>Get AI Reading ✨</Text>
                )}
              </Pressable>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#1A1625' },

  content: { paddingHorizontal: 24, paddingTop: 28, alignItems: 'center' },

  cardTouchable: { marginBottom: 24 },
  cardOuter: {
    width: 180, height: 280, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 10,
  },
  cardBack: {
    flex: 1, borderRadius: 20,
    backgroundColor: '#1A0F3C',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(212, 165, 71, 0.5)',
  },
  cardBackStar: { fontSize: 48, color: '#D4A547', marginBottom: 12 },
  cardBackLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(212,165,71,0.7)',
  },
  cardFront: {
    flex: 1, borderRadius: 20,
    backgroundColor: '#2D1B5E',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(212, 165, 71, 0.6)',
    padding: 16,
  },
  cardEmoji: { fontSize: 64, marginBottom: 12 },
  cardNumber: {
    fontFamily: 'Inter_400Regular', fontSize: 11,
    color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1,
  },
  reversedBadge: {
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 12, backgroundColor: 'rgba(212,165,71,0.2)',
    borderWidth: 1, borderColor: 'rgba(212,165,71,0.4)',
  },
  reversedBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#D4A547' },

  cardName: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 26, color: '#1A1625',
    textAlign: 'center', marginBottom: 6,
  },
  cardKeywords: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B',
    textAlign: 'center', marginBottom: 20,
  },

  meaningCard: {
    width: '100%', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212,165,71,0.15)',
  },
  meaningLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 11, color: '#8B5CF6',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  meaningText: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#1A1625', lineHeight: 21,
  },

  readingBtn: {
    width: '100%', backgroundColor: '#8B5CF6', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  readingBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF' },

  readingCard: {
    width: '100%', backgroundColor: '#F3EEFF',
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  readingLabel: {
    fontFamily: 'Inter_700Bold', fontSize: 13, color: '#8B5CF6', marginBottom: 8,
  },
  readingText: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#1A1625', lineHeight: 21,
  },
});
