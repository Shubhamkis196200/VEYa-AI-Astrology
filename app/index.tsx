import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // TEST: Skip everything, go straight to tabs
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8B5CF6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7' },
});
