import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ExploreScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Explore</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Birth Chart Snapshot</Text>
        <View style={styles.chartRow}>
          <View style={styles.chartCircle}>
            <Text style={styles.chartEmoji}>♏️</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.bodyText}>Sun in Scorpio • Moon in Taurus</Text>
            <Text style={styles.bodyText}>Rising sign: Leo</Text>
            <Text style={styles.bodyText}>Element balance: Water + Earth</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Compatibility Preview</Text>
        <View style={styles.compatRow}>
          <View style={styles.compatBadge}>
            <Text style={styles.compatEmoji}>♉️</Text>
          </View>
          <View>
            <Text style={styles.compatTitle}>Taurus</Text>
            <Text style={styles.bodyText}>Grounding, loyal, and steady energy today.</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.tarotCard}>
          <Text style={styles.tarotLabel}>Tarot Pull</Text>
          <View style={styles.tarotBack}>
            <Text style={styles.tarotBackText}>VEYa</Text>
          </View>
        </View>
        <View style={styles.moonCard}>
          <Text style={styles.cardTitle}>Moon Phase</Text>
          <Text style={styles.moonEmoji}>🌔</Text>
          <Text style={styles.bodyText}>Waxing Gibbous</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  header: { fontSize: 28, fontFamily: 'PlayfairDisplay-Bold', color: '#2B2620' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#5C4C3C', marginBottom: 8 },
  bodyText: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#4B433A', lineHeight: 18 },
  chartRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  chartCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F4E7D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmoji: { fontSize: 28 },
  compatRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  compatBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E9E1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatEmoji: { fontSize: 22 },
  compatTitle: { fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 16, color: '#2B2620' },
  cardRow: { flexDirection: 'row', gap: 12 },
  tarotCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  tarotLabel: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#5C4C3C', marginBottom: 10 },
  tarotBack: {
    flex: 1,
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7D9C7',
    backgroundColor: '#2B2620',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tarotBackText: { fontFamily: 'PlayfairDisplay-Bold', color: '#F4E7D3', fontSize: 18, letterSpacing: 2 },
  moonCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  moonEmoji: { fontSize: 34, marginBottom: 6 },
});
