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
import { getCurrentTransits, getMonthEvents } from '@/services/astroEngine';

const IMPACT_COLORS = {
  positive: '#10B981',
  challenging: '#EF4444',
  neutral: '#64748B',
  significant: '#8B5CF6',
} as const;

interface Props { onClose: () => void; }

export default function TransitsScreen({ onClose }: Props) {
  const now = useMemo(() => new Date(), []);
  const planets = useMemo(() => getCurrentTransits(now), [now]);
  const monthEvents = useMemo(() => {
    return getMonthEvents(now.getFullYear(), now.getMonth() + 1);
  }, [now]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#1A1625" />
        </Pressable>
        <Text style={styles.headerTitle}>Transits</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Planets */}
        <Text style={styles.sectionTitle}>Current Positions</Text>
        <View style={styles.planetsCard}>
          {planets.map((planet, i) => (
            <View key={planet.name}>
              <View style={styles.planetRow}>
                <Text style={styles.planetSymbol}>{planet.symbol}</Text>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetName}>
                    {planet.name}{planet.retrograde ? ' ℞' : ''}
                  </Text>
                  <Text style={styles.planetSign}>{planet.sign}</Text>
                </View>
                <Text style={styles.planetDeg}>
                  {planet.signDegree.toFixed(0)}° {planet.sign.substring(0, 3)}
                </Text>
              </View>
              {i < planets.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* This Month's Events */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Events
        </Text>

        {monthEvents.length === 0 ? (
          <Text style={styles.emptyText}>No major events this month.</Text>
        ) : (
          monthEvents.map((event, i) => (
            <View key={i} style={styles.eventCard}>
              <Text style={styles.eventEmoji}>{event.emoji}</Text>
              <View style={styles.eventInfo}>
                <Text style={styles.eventDate}>
                  {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={styles.eventDesc}>{event.description}</Text>
              </View>
              <View style={[styles.impactBadge, { backgroundColor: IMPACT_COLORS[event.impact] + '22' }]}>
                <Text style={[styles.impactText, { color: IMPACT_COLORS[event.impact] }]}>
                  {event.impact}
                </Text>
              </View>
            </View>
          ))
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

  content: { paddingHorizontal: 16, paddingTop: 20 },

  sectionTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1A1625', marginBottom: 12,
  },

  planetsCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', overflow: 'hidden',
  },
  planetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  planetSymbol: { fontSize: 22, width: 30, textAlign: 'center' },
  planetInfo: { flex: 1 },
  planetName: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1A1625' },
  planetSign: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  planetDeg: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.06)', marginLeft: 58 },

  eventCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  eventEmoji: { fontSize: 24, width: 30, textAlign: 'center' },
  eventInfo: { flex: 1 },
  eventDate: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#64748B', marginBottom: 2 },
  eventDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#1A1625' },
  impactBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  impactText: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'capitalize' },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 20 },
});
