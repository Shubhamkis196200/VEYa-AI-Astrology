import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Talk to VEYa</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emoji}>✨</Text>
          <Text style={styles.emptyTitle}>Ask me anything</Text>
          <Text style={styles.emptyBody}>Insights, rituals, and gentle guidance await.</Text>
        </View>

        <Text style={styles.sectionLabel}>Suggested questions</Text>
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>What is my energy for today?</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>How can I feel more grounded?</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>What does my moon sign mean?</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Give me a short ritual</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        <Text style={styles.inputPlaceholder}>Type your question…</Text>
        <View style={styles.sendBubble}>
          <Text style={styles.sendText}>Send</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { padding: 20, paddingBottom: 120 },
  header: { fontSize: 28, fontFamily: 'PlayfairDisplay-Bold', color: '#2B2620', marginBottom: 18 },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  emoji: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#3A322A' },
  emptyBody: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#6A6259', marginTop: 6 },
  sectionLabel: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#8B5CF6', marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1E6D8',
  },
  chipText: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#4B433A' },
  inputBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  inputPlaceholder: { fontFamily: 'Inter-Regular', color: '#9B8F84' },
  sendBubble: { backgroundColor: '#8B5CF6', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  sendText: { fontFamily: 'Inter-SemiBold', color: '#FFFFFF', fontSize: 12 },
});
