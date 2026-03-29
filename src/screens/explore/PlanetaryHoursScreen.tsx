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
import { getPlanetaryHours } from '@/services/astroEngine';

const PLANET_GUIDANCE: Record<string, string> = {
  Sun: 'Ideal for leadership, visibility, and bold decisions.',
  Moon: 'Best for intuition, reflection, and emotional connection.',
  Mars: 'High energy for action, sports, and starting projects.',
  Mercury: 'Perfect for communication, writing, and negotiations.',
  Jupiter: 'Auspicious for growth, learning, and big opportunities.',
  Venus: 'Favourable for love, creativity, and social affairs.',
  Saturn: 'Good for discipline, structure, and long-term planning.',
};

interface Props { onClose: () => void; }

export default function PlanetaryHoursScreen({ onClose }: Props) {
  const hoursData = useMemo(() => getPlanetaryHours(new Date()), []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#1A1625" />
        </Pressable>
        <Text style={styles.headerTitle}>Planetary Hours</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Hour */}
        <View style={styles.currentCard}>
          <Text style={styles.currentLabel}>Current Hour</Text>
          <View style={[styles.currentPlanetCircle, { backgroundColor: hoursData.currentHour.color + '22', borderColor: hoursData.currentHour.color }]}>
            <Text style={[styles.currentPlanetSymbol, { color: hoursData.currentHour.color }]}>
              {hoursData.currentHour.symbol}
            </Text>
          </View>
          <Text style={styles.currentPlanetName}>{hoursData.currentHour.planet}</Text>
          <Text style={styles.currentTimeRange}>
            {formatTime(hoursData.currentHour.startTime)} — {formatTime(hoursData.currentHour.endTime)}
          </Text>
          <Text style={styles.currentGuidance}>
            {PLANET_GUIDANCE[hoursData.currentHour.planet] ?? 'A cosmic hour for reflection.'}
          </Text>
        </View>

        {/* Day Ruler */}
        <View style={styles.dayRulerRow}>
          <Text style={styles.dayRulerLabel}>Today is ruled by</Text>
          <Text style={styles.dayRulerValue}>
            {hoursData.dayRulerSymbol} {hoursData.dayRuler}
          </Text>
        </View>

        {/* Today's Schedule */}
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <View style={styles.scheduleCard}>
          {hoursData.todayHours.map((hour, i) => (
            <View key={i}>
              <View style={[styles.hourRow, hour.isCurrent && styles.hourRowCurrent]}>
                <Text style={[styles.hourSymbol, { color: hour.color }]}>{hour.symbol}</Text>
                <View style={styles.hourInfo}>
                  <Text style={[styles.hourPlanet, hour.isCurrent && styles.hourPlanetCurrent]}>
                    {hour.planet}
                  </Text>
                  <Text style={styles.hourTime}>
                    {formatTime(hour.startTime)} — {formatTime(hour.endTime)}
                  </Text>
                </View>
                <Text style={styles.hourType}>{hour.isDay ? '☀️' : '🌙'}</Text>
                {hour.isCurrent && (
                  <View style={styles.nowBadge}>
                    <Text style={styles.nowBadgeText}>Now</Text>
                  </View>
                )}
              </View>
              {i < hoursData.todayHours.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
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

  content: { paddingHorizontal: 16, paddingTop: 20 },

  currentCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20,
    padding: 24, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(212,165,71,0.15)',
  },
  currentLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: '#64748B',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
  },
  currentPlanetCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 12,
  },
  currentPlanetSymbol: { fontSize: 36 },
  currentPlanetName: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: '#1A1625', marginBottom: 4 },
  currentTimeRange: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B', marginBottom: 12 },
  currentGuidance: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#475569',
    textAlign: 'center', lineHeight: 20,
  },

  dayRulerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F3EEFF', borderRadius: 14, padding: 14, marginBottom: 20,
  },
  dayRulerLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B' },
  dayRulerValue: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#8B5CF6' },

  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1A1625', marginBottom: 12 },

  scheduleCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  hourRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  hourRowCurrent: { backgroundColor: '#FFF8F0' },
  hourSymbol: { fontSize: 20, width: 28, textAlign: 'center' },
  hourInfo: { flex: 1 },
  hourPlanet: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#1A1625' },
  hourPlanetCurrent: { fontFamily: 'Inter_700Bold' },
  hourTime: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#94A3B8', marginTop: 1 },
  hourType: { fontSize: 14 },
  nowBadge: {
    backgroundColor: '#D4A547', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  nowBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.05)', marginLeft: 56 },
});
