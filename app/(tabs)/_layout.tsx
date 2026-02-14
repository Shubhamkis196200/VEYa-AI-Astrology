import { Tabs } from 'expo-router';
import { Platform, Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9B9BAD',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: 'rgba(0,0,0,0.06)',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 88 : 64,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Today', tabBarIcon: () => <Text style={{ fontSize: 20 }}>☀️</Text> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Chat', tabBarIcon: () => <Text style={{ fontSize: 20 }}>💬</Text> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ title: 'Explore', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔮</Text> }}
      />
      <Tabs.Screen
        name="rituals"
        options={{ title: 'Rituals', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🌙</Text> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'You', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tabs>
  );
}
