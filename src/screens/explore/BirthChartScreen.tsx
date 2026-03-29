import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import NatalChart from '@/components/shared/NatalChart';
import { useOnboardingStore } from '@/stores/onboardingStore';

const HOUSE_SYSTEMS = ['Placidus', 'Whole Sign'] as const;

const SIGN_COLORS: Record<string, string> = {
  Aries: '#E8664D', Taurus: '#6B8E6B', Gemini: '#87CEEB', Cancer: '#7B9FCC',
  Leo: '#D4A547', Virgo: '#A8947A', Libra: '#DDA0DD', Scorpio: '#CD5C5C',
  Sagittarius: '#7B68EE', Capricorn: '#5B5B7A', Aquarius: '#5BBFD8', Pisces: '#C4B5E0',
};

interface Props { onClose: () => void; }

export default function BirthChartScreen({ onClose }: Props) {
  const router = useRouter();
  const { data } = useOnboardingStore();
  const [houseSystem, setHouseSystem] = useState<typeof HOUSE_SYSTEMS[number]>('Placidus');

  const bigThree = [
    { label: 'Sun', sign: data.sunSign, symbol: '☉' },
    { label: 'Moon', sign: data.moonSign, symbol: '☽' },
    { label: 'Rising', sign: data.risingSign, symbol: '↑' },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#1A1625" />
        </Pressable>
        <Text style={styles.headerTitle}>My Birth Chart</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Big Three */}
        <View style={styles.bigThreeRow}>
          {bigThree.map(({ label, sign, symbol }) => {
            const signColor = sign ? (SIGN_COLORS[sign] ?? '#8B5CF6') : '#8B5CF6';
            return (
              <View key={label} style={[styles.pill, { backgroundColor: signColor + '22', borderColor: signColor + '44' }]}>
                <Text style={styles.pillSymbol}>{symbol}</Text>
                <View>
                  <Text style={styles.pillLabel}>{label}</Text>
                  <Text style={[styles.pillSign, { color: signColor }]}>{sign ?? '—'}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Chart */}
        <View style={styles.chartWrap}>
          <NatalChart
            size={300}
            interactive
            showZodiacSymbols
            showHouseNumbers
            showAxisLabels
          />
        </View>

        {/* House System Toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>House System</Text>
          <View style={styles.togglePills}>
            {HOUSE_SYSTEMS.map((sys) => (
              <Pressable
                key={sys}
                onPress={() => setHouseSystem(sys)}
                style={[styles.toggleBtn, houseSystem === sys && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleBtnText, houseSystem === sys && styles.toggleBtnTextActive]}>
                  {sys}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Ask VEYa */}
        <Pressable
          style={styles.askBtn}
          onPress={() => { onClose(); router.push('/(tabs)/chat'); }}
        >
          <Text style={styles.askBtnText}>Ask VEYa about your chart →</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold', fontSize: 17, color: '#1A1625',
  },

  content: { paddingHorizontal: 16, paddingTop: 20, alignItems: 'center' },

  bigThreeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    width: '100%',
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  pillSymbol: { fontSize: 20 },
  pillLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 11, color: '#64748B', marginBottom: 2,
  },
  pillSign: {
    fontFamily: 'Inter_700Bold', fontSize: 13,
  },

  chartWrap: { marginBottom: 24, alignItems: 'center' },

  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  toggleLabel: {
    fontFamily: 'Inter_400Regular', fontSize: 14, color: '#64748B',
  },
  togglePills: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  toggleBtnActive: { backgroundColor: '#8B5CF6' },
  toggleBtnText: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B',
  },
  toggleBtnTextActive: { color: '#FFFFFF', fontFamily: 'Inter_700Bold' },

  askBtn: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  askBtnText: {
    fontFamily: 'Inter_700Bold', fontSize: 15, color: '#FFFFFF',
  },
});
