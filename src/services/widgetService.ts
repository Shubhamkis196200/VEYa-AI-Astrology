// ============================================================================
// VEYa Widget Data Service — Prepares data for native widgets
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const WIDGET_KEY = 'veya-widget-data';

interface WidgetData {
  energyLevel: number;
  briefing: string;
  sign: string;
  date: string;
  mood: string;
  luckyColor: string;
}

export async function updateWidgetData(reading: Record<string, unknown>): Promise<void> {
  const text = (reading.reading_text || reading.briefing || '') as string;
  const data: WidgetData = {
    energyLevel: (reading.energy_level || reading.energyScore || 5) as number,
    briefing: text.split('.')[0] + '.',
    sign: (reading.sun_sign || reading.zodiacSign || '') as string,
    date: new Date().toISOString().split('T')[0],
    mood: (reading.mood || 'balanced') as string,
    luckyColor: (reading.lucky_color || reading.luckyColor || '') as string,
  };
  await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify(data));
}

export async function getWidgetData(): Promise<WidgetData | null> {
  const raw = await AsyncStorage.getItem(WIDGET_KEY);
  return raw ? JSON.parse(raw) : null;
}
