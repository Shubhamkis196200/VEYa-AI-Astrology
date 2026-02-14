import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

export default function ProfileScreen() {
  const name = useOnboardingStore((s) => s.data.name) || 'Cosmic Soul';
  const sunSign = useOnboardingStore((s) => s.data.sunSign) || 'Scorpio';
  const resetOnboarding = useOnboardingStore((s) => s.resetOnboarding);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Your Cosmic Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>♏️</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.sign}>{sunSign} Sun</Text>
      </View>

      <View style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Notifications</Text>
          <Text style={styles.settingValue}>Daily</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Theme</Text>
          <Text style={styles.settingValue}>Cream</Text>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Focus Area</Text>
          <Text style={styles.settingValue}>Self-growth</Text>
        </View>
      </View>

      <Pressable
        style={styles.resetButton}
        onPress={() => {
          resetOnboarding();
          router.replace('/(auth)/welcome');
        }}
      >
        <Text style={styles.resetText}>Reset Onboarding</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  header: { fontSize: 28, fontFamily: 'PlayfairDisplay-Bold', color: '#2B2620' },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4E7D3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarEmoji: { fontSize: 32 },
  name: { fontFamily: 'PlayfairDisplay-SemiBold', fontSize: 18, color: '#2B2620' },
  sign: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#8B5CF6', marginTop: 4 },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  settingsTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#5C4C3C', marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  settingLabel: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#4B433A' },
  settingValue: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#8B5CF6' },
  resetButton: {
    backgroundColor: '#2B2620',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  resetText: { fontFamily: 'Inter-SemiBold', color: '#FFFFFF' },
});
