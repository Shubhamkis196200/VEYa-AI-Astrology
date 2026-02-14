import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props { children: React.ReactNode; screenName?: string; }
interface State { hasError: boolean; }

export class ScreenErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={s.c}>
          <Text style={s.t}>Something went wrong</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={s.b}>
            <Text style={s.bt}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDFBF7', padding: 24 },
  t: { fontSize: 18, fontWeight: 'bold', color: '#1A1A2E', marginBottom: 16 },
  b: { backgroundColor: '#8B5CF6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  bt: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
