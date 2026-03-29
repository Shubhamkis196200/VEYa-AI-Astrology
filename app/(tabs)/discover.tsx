/**
 * VEYa — Explore Tab: Cosmic Toolkit 🔮
 * Clean 2-column card grid. Each card opens a full-screen modal placeholder.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP) / 2;

// ─────────────────────────────────────────────────────────────
// CARD DEFINITIONS
// ─────────────────────────────────────────────────────────────

interface FeatureCard {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  colors: [string, string];
}

const CARDS: FeatureCard[] = [
  { id: 'chart',   emoji: '⭐', title: 'Birth Chart',      desc: 'Your natal placements',    colors: ['#8B5CF6', '#D4A547'] },
  { id: 'compat',  emoji: '💕', title: 'Compatibility',    desc: 'Cosmic match score',        colors: ['#EC4899', '#F43F5E'] },
  { id: 'tarot',   emoji: '🃏', title: 'Daily Tarot',      desc: 'Pull your card',            colors: ['#6366F1', '#8B5CF6'] },
  { id: 'moon',    emoji: '🌙', title: 'Moon Tracker',     desc: 'Phases & calendar',         colors: ['#1E3A5F', '#4C51BF'] },
  { id: 'transits',emoji: '🪐', title: 'Transits',         desc: 'Planetary movements',       colors: ['#0D9488', '#34D399'] },
  { id: 'hours',   emoji: '☀️', title: 'Planetary Hours',  desc: 'Current cosmic hour',       colors: ['#D97706', '#F59E0B'] },
  { id: 'retro',   emoji: '⏪', title: 'Retrogrades',      desc: 'Active retrogrades',        colors: ['#475569', '#6366F1'] },
  { id: 'year',    emoji: '🌌', title: 'Cosmic Year',      desc: '2026 key dates',            colors: ['#4C1D95', '#7C3AED'] },
];

// ─────────────────────────────────────────────────────────────
// FEATURE CARD
// ─────────────────────────────────────────────────────────────

function GridCard({ card, onPress }: { card: FeatureCard; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardWrapper, pressed && { opacity: 0.85 }]}
    >
      <LinearGradient
        colors={card.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.cardEmoji}>{card.emoji}</Text>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardDesc}>{card.desc}</Text>
        </View>
        <View style={styles.cardChevron}>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────
// FEATURE MODAL (placeholder)
// ─────────────────────────────────────────────────────────────

function FeatureModal({
  card,
  onClose,
}: {
  card: FeatureCard | null;
  onClose: () => void;
}) {
  if (!card) return null;

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.modalCloseBtn} hitSlop={12}>
            <Ionicons name="close" size={22} color="#1A1625" />
          </Pressable>
          <Text style={styles.modalHeaderTitle}>{card.title}</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.modalBody}>
          <Text style={styles.modalEmoji}>{card.emoji}</Text>
          <Text style={styles.modalFeatureName}>{card.title}</Text>
          <Text style={styles.modalComingSoon}>Full feature coming soon</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const [activeCard, setActiveCard] = useState<FeatureCard | null>(null);

  // Build rows of 2
  const rows: [FeatureCard, FeatureCard][] = [];
  for (let i = 0; i < CARDS.length; i += 2) {
    rows.push([CARDS[i], CARDS[i + 1]]);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#FDFBF7', '#F8F4EC', '#FDFBF7']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Your cosmic toolkit</Text>
        </View>

        {/* 2-column grid */}
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((card) => (
              <GridCard
                key={card.id}
                card={card}
                onPress={() => setActiveCard(card)}
              />
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {activeCard && (
        <FeatureModal card={activeCard} onClose={() => setActiveCard(null)} />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FDFBF7' },
  scrollContent: { paddingHorizontal: PADDING, paddingBottom: 120 },

  header: { marginBottom: 24 },
  headerTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 32,
    color: '#1A1625',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#64748B',
    letterSpacing: 0.2,
  },

  row: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },

  cardWrapper: {
    width: CARD_WIDTH,
    borderRadius: 20,
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    padding: 16,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  cardEmoji: { fontSize: 40 },
  cardTextBlock: { marginTop: 8 },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  cardChevron: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  // Modal
  modalRoot: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  modalCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#1A1625',
  },
  modalBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalEmoji: { fontSize: 72, marginBottom: 24 },
  modalFeatureName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: '#1A1625',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalComingSoon: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
