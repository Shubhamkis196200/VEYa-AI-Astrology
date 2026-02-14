import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RitualsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Morning Ritual</Text>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>Breathe</Text>
          <Text style={styles.progress}>2 / 5 min</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '40%' }]} />
        </View>
        <Text style={styles.bodyText}>Slow inhales to clear space for the day ahead.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>Set Intention</Text>
          <Text style={styles.progress}>1 / 3 prompts</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>
        <Text style={styles.bodyText}>Choose one word that guides your energy today.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle}>Read Briefing</Text>
          <Text style={styles.progress}>Complete</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.bodyText}>Your daily cosmic map is ready and waiting.</Text>
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#4B433A' },
  progress: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#8B5CF6' },
  bodyText: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#4B433A', marginTop: 10 },
  progressTrack: {
    height: 8,
    backgroundColor: '#EFE7DD',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: { height: '100%', backgroundColor: '#8B5CF6' },
});
