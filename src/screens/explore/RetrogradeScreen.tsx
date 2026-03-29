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
import { getRetrogradeData } from '@/services/astroEngine';

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

interface Props { onClose: () => void; }

export default function RetrogradeScreen({ onClose }: Props) {
  const data = useMemo(() => getRetrogradeData(new Date()), []);

  const formatDate = (date?: Date) =>
    date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#1A1625" />
        </Pressable>
        <Text style={styles.headerTitle}>Retrogrades</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          data.retrogradeCount > 0 ? styles.statusBadgeActive : styles.statusBadgeClear
        ]}>
          <Text style={[
            styles.statusText,
            data.retrogradeCount > 0 ? styles.statusTextActive : styles.statusTextClear,
          ]}>
            {data.retrogradeCount > 0
              ? `⚠️ ${data.retrogradeCount} retrograde${data.retrogradeCount > 1 ? 's' : ''} active`
              : '✨ All Clear — No retrogrades'}
          </Text>
        </View>

        <Text style={styles.message}>{data.message}</Text>

        {/* Active Retrogrades */}
        {data.currentRetrogrades.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Currently Retrograde</Text>
            {data.currentRetrogrades.map((r, i) => (
              <View key={i} style={styles.retroCard}>
                <View style={styles.retroHeader}>
                  <Text style={styles.retroSymbol}>
                    {PLANET_SYMBOLS[r.planet] ?? r.planet} ℞
                  </Text>
                  <View style={styles.retroTitleBlock}>
                    <Text style={styles.retroPlanet}>{r.planet} Retrograde</Text>
                    <Text style={styles.retroSign}>in {r.sign}</Text>
                  </View>
                  {r.endDate && (
                    <Text style={styles.retroEnd}>Until {formatDate(r.endDate)}</Text>
                  )}
                </View>
                <Text style={styles.retroInterp}>{r.interpretation}</Text>
              </View>
            ))}
          </>
        )}

        {/* Upcoming Retrogrades */}
        {data.upcomingRetrogrades.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Coming Soon</Text>
            {data.upcomingRetrogrades.map((r, i) => (
              <View key={i} style={styles.upcomingCard}>
                <Text style={styles.upcomingSymbol}>
                  {PLANET_SYMBOLS[r.planet] ?? r.planet}
                </Text>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingPlanet}>{r.planet}</Text>
                  <Text style={styles.upcomingDate}>
                    {r.stationType === 'retrograde' ? 'Stations Retrograde' : 'Stations Direct'} · {formatDate(r.stationDate)}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {data.currentRetrogrades.length === 0 && data.upcomingRetrogrades.length === 0 && (
          <Text style={styles.emptyText}>No notable retrograde activity detected.</Text>
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

  statusBadge: {
    borderRadius: 14, padding: 14, marginBottom: 12, alignItems: 'center',
  },
  statusBadgeActive: { backgroundColor: '#FFF1F0', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  statusBadgeClear: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  statusText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  statusTextActive: { color: '#EF4444' },
  statusTextClear: { color: '#10B981' },

  message: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B',
    textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 8,
  },

  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1A1625', marginBottom: 12 },

  retroCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.1)',
  },
  retroHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  retroSymbol: { fontSize: 24, color: '#EF4444', width: 32 },
  retroTitleBlock: { flex: 1 },
  retroPlanet: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#1A1625' },
  retroSign: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  retroEnd: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#94A3B8' },
  retroInterp: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#475569', lineHeight: 19 },

  upcomingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  upcomingSymbol: { fontSize: 24, width: 30, textAlign: 'center' },
  upcomingInfo: { flex: 1 },
  upcomingPlanet: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1A1625' },
  upcomingDate: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', marginTop: 2 },

  emptyText: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B',
    textAlign: 'center', marginTop: 20,
  },
});
