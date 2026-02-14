import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../../src/stores/onboardingStore';

export default function Welcome() {
  const { completeOnboarding } = useOnboardingStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to VEYa ✨</Text>
      <Text style={styles.subtitle}>TEST: Minimal onboarding</Text>

      <Pressable
        onPress={() => {
          completeOnboarding();
          router.replace('/(tabs)');
        }}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Complete & Go to App →</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/(auth)/onboarding/name')}
        style={[styles.button, { backgroundColor: '#D4A547', marginTop: 12 }]}
      >
        <Text style={styles.buttonText}>Full Onboarding →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B6B80', marginBottom: 32 },
  button: { backgroundColor: '#8B5CF6', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
