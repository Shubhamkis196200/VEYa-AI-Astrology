import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../src/stores/onboardingStore';

export default function Index() {
  const onboardingCompleted = useOnboardingStore((s) => s.onboardingCompleted);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    const timer = setTimeout(() => {
      if (onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={{ marginTop: 12, color: '#666' }}>
        {onboardingCompleted ? 'Loading app...' : 'Starting...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
});
