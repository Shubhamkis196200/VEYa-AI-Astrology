import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMoonPhase } from '@/services/astroEngine';
import MoonPhase from '@/components/shared/MoonPhase';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props { onClose: () => void; }

export default function MoonScreen({ onClose }: Props) {
  const moon = useMemo(() => getMoonPhase(new Date()), []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return { date: d, phase: getMoonPhase(d) };
    });
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#1A1625" />
        </Pressable>
        <Text style={styles.headerTitle}>Moon Tracker</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Moon visualization */}
        <View style={styles.moonVizWrap}>
          <MoonPhase illumination={moon.illumination} size={140} animated />
        </View>

        {/* Phase name */}
        <Text style={styles.phaseName}>{moon.emoji} {moon.phaseName}</Text>
        <Text style={styles.moonSign}>{moon.moonSign} · {moon.moonSignDegree.toFixed(1)}°</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(moon.illumination * 100)}%</Text>
            <Text style={styles.statLabel}>Illumination</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{moon.daysUntilFullMoon.toFixed(0)}d</Text>
            <Text style={styles.statLabel}>Until Full Moon</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{moon.daysUntilNewMoon.toFixed(0)}d</Text>
            <Text style={styles.statLabel}>Until New Moon</Text>
          </View>
        </View>

        {/* Week strip */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>This Week</Text>
        </View>
        <View style={styles.weekStrip}>
          {weekDays.map(({ date, phase }, i) => {
            const dayName = DAY_LABELS[date.getDay()];
            const isToday = i === 0;
            return (
              <View key={i} style={[styles.dayCell, isToday && styles.dayCellToday]}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {isToday ? 'Today' : dayName}
                </Text>
                <Text style={styles.dayEmoji}>{phase.emoji}</Text>
                <Text style={styles.dayIllum}>{Math.round(phase.illumination * 100)}%</Text>
              </View>
            );
          })}
        </View>

        {/* Next dates */}
        <View style={styles.nextDatesCard}>
          <View style={styles.nextDateRow}>
            <Text style={styles.nextDateEmoji}>🌕</Text>
            <View style={styles.nextDateInfo}>
              <Text style={styles.nextDateLabel}>Full Moon</Text>
              <Text style={styles.nextDateValue}>
                {moon.nextFullMoonDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.nextDateRow}>
            <Text style={styles.nextDateEmoji}>🌑</Text>
            <View style={styles.nextDateInfo}>
              <Text style={styles.nextDateLabel}>New Moon</Text>
              <Text style={styles.nextDateValue}>
                {moon.nextNewMoonDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </View>
        </View>

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

  content: { paddingHorizontal: 16, paddingTop: 20, alignItems: 'center' },

  moonVizWrap: { marginBottom: 16 },

  phaseName: {
    fontFamily: 'PlayfairDisplay_700Bold', fontSize: 24, color: '#1A1625',
    textAlign: 'center', marginBottom: 4,
  },
  moonSign: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B',
    textAlign: 'center', marginBottom: 24,
  },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24, width: '100%' },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,165,71,0.15)',
  },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1A1625', marginBottom: 4 },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#64748B' },

  sectionHeader: { width: '100%', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1A1625' },

  weekStrip: {
    flexDirection: 'row', width: '100%', gap: 6, marginBottom: 24,
  },
  dayCell: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  dayCellToday: {
    backgroundColor: '#F3EEFF', borderColor: 'rgba(139,92,246,0.3)',
  },
  dayLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#94A3B8', marginBottom: 4 },
  dayLabelToday: { color: '#8B5CF6', fontFamily: 'Inter_700Bold' },
  dayEmoji: { fontSize: 16, marginBottom: 4 },
  dayIllum: { fontFamily: 'Inter_400Regular', fontSize: 9, color: '#94A3B8' },

  nextDatesCard: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: 'rgba(212,165,71,0.15)',
  },
  nextDateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  nextDateEmoji: { fontSize: 28 },
  nextDateInfo: { flex: 1 },
  nextDateLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', marginBottom: 2 },
  nextDateValue: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#1A1625' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)' },
});
