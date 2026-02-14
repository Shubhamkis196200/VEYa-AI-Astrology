import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

export default function TodayScreen() {
  const name = useOnboardingStore((s) => s.data.name) || 'friend';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Good morning, {name} ☉</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Scorpio</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Energy Meter</Text>
          <Text style={styles.cardTitle}>75%</Text>
        </View>
        <View style={styles.meterTrack}>
          <View style={styles.meterFill} />
        </View>
        <Text style={styles.bodyText}>
          Your focus is strong today. Lean into steady progress rather than quick wins.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Briefing</Text>
        <Text style={styles.bodyText}>
          The moon harmonizes with your sun sign, making it a perfect day to simplify routines and protect your
          energy. Conversations feel more meaningful when you lead with curiosity.
        </Text>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.miniCard}>
          <Text style={styles.cardTitle}>Lucky Color</Text>
          <Text style={styles.highlight}>Deep Plum</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.cardTitle}>Lucky Number</Text>
          <Text style={styles.highlight}>8</Text>
        </View>
        <View style={styles.miniCard}>
          <Text style={styles.cardTitle}>Lucky Time</Text>
          <Text style={styles.highlight}>4:32 PM</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Do / Don't</Text>
        <View style={styles.splitRow}>
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>Do</Text>
            <Text style={styles.bodyText}>Outline your top three priorities.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.splitCol}>
            <Text style={styles.splitLabel}>Don't</Text>
            <Text style={styles.bodyText}>Overcommit to last-minute plans.</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  headerRow: { gap: 10 },
  header: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#2B2620',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4E7D3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontFamily: 'Inter-SemiBold', color: '#7A5A3A', fontSize: 12, letterSpacing: 0.5 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#5C4C3C', marginBottom: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bodyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#4B433A', lineHeight: 20 },
  meterTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#F1EEE9',
    overflow: 'hidden',
    marginBottom: 12,
  },
  meterFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  cardRow: { flexDirection: 'row', gap: 12 },
  miniCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  highlight: { fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 16, color: '#2E2520' },
  splitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  splitCol: { flex: 1, gap: 6 },
  splitLabel: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#8B5CF6', textTransform: 'uppercase' },
  divider: { width: 1, height: '100%', backgroundColor: '#EFE7DD' },
});
