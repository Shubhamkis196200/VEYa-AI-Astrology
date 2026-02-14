import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useOnboardingStore } from '../src/stores/onboardingStore';

export default function Index() {
  const onboardingCompleted = useOnboardingStore((s) => s.onboardingCompleted);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [onboardingCompleted]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
});
