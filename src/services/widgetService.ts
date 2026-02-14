// ============================================================================
// VEYa Home Screen Widget Configuration
// ============================================================================
//
// Configures iOS Widgets and Android App Widgets for VEYa.
// Shows today's cosmic summary at a glance.
//
// Uses expo-widget (or react-native-widget-extension) for implementation.
// This file provides the data layer and update logic.
//

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMoonPhase, getCurrentTransits, type MoonPhaseData } from '@/services/astroEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WidgetData {
  // Small widget
  sunSign: string;
  zodiacEmoji: string;
  moonPhaseEmoji: string;
  moonPhaseName: string;
  energyScore: number;
  
  // Medium widget (adds these)
  dailyInsight: string;
  luckyColor: string;
  luckyNumber: number;
  
  // Large widget (adds these)
  topTransit: string;
  bestTimeOfDay: string;
  cosmicWeather: 'excellent' | 'good' | 'mixed' | 'challenging';
  
  // Metadata
  lastUpdated: string;
  date: string;
}

// ---------------------------------------------------------------------------
// Zodiac Emojis
// ---------------------------------------------------------------------------

const ZODIAC_EMOJIS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

// ---------------------------------------------------------------------------
// Daily Insights Pool
// ---------------------------------------------------------------------------

const DAILY_INSIGHTS: Record<string, string[]> = {
  Aries: [
    "Your fire burns bright today — lead with confidence",
    "A bold move now pays off in unexpected ways",
    "Channel your warrior energy into creative projects",
  ],
  Taurus: [
    "Grounding energy surrounds you — trust your senses",
    "Financial intuition is heightened today",
    "Slow and steady reveals hidden beauty",
  ],
  Gemini: [
    "Your words carry extra power today — choose wisely",
    "A conversation opens an unexpected door",
    "Your dual nature finds harmony in creative expression",
  ],
  Cancer: [
    "Home is where your power is strongest today",
    "Emotional intelligence guides you to the right choice",
    "Nurture yourself first — then the world",
  ],
  Leo: [
    "Your radiance inspires someone who needs it",
    "Step into the spotlight — it was made for you",
    "Generosity returns to you tenfold today",
  ],
  Virgo: [
    "Details matter today — trust your analytical eye",
    "Organization creates space for unexpected magic",
    "Your healing energy touches everyone around you",
  ],
  Libra: [
    "Balance comes through embracing both sides",
    "A relationship deepens through honest conversation",
    "Beauty in unexpected places reveals your path",
  ],
  Scorpio: [
    "Your intuition is laser-sharp today — trust it",
    "Transformation happens in the quiet moments",
    "Let go of what no longer serves your highest self",
  ],
  Sagittarius: [
    "Adventure calls — even a small one feeds your soul",
    "Your optimism is contagious and needed today",
    "Truth spoken with kindness opens all doors",
  ],
  Capricorn: [
    "Your discipline is your superpower today",
    "Long-term vision brings clarity to today's choices",
    "The mountain you're climbing has a beautiful view",
  ],
  Aquarius: [
    "Your unique perspective solves an old problem",
    "Community connections strengthen your path",
    "Innovation flows through you — let it out",
  ],
  Pisces: [
    "Dreams carry messages today — pay attention",
    "Your compassion is a bridge between worlds",
    "Creative expression channels cosmic energy",
  ],
};

// ---------------------------------------------------------------------------
// Widget Data Generator
// ---------------------------------------------------------------------------

export async function generateWidgetData(sunSign: string): Promise<WidgetData> {
  const moonPhase = getMoonPhase();
  const transits = getCurrentTransits();
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Deterministic daily selection based on date
  const insights = DAILY_INSIGHTS[sunSign] || DAILY_INSIGHTS.Aries;
  const dailyInsight = insights[dayOfYear % insights.length];

  // Lucky elements
  const colors = ['Amethyst Purple', 'Rose Gold', 'Ocean Blue', 'Forest Green', 
                  'Sunset Orange', 'Midnight Blue', 'Silver', 'Emerald', 'Ruby Red',
                  'Cosmic Teal', 'Golden Honey', 'Lavender'];
  const luckyColor = colors[dayOfYear % colors.length];
  const luckyNumber = ((dayOfYear * 7 + 3) % 99) + 1;

  // Energy score based on moon phase + transits
  const moonEnergy = moonPhase.illumination / 100;
  const beneficTransits = transits.filter(t => 
    ['Venus', 'Jupiter'].includes(t.name)
  ).length;
  const energyScore = Math.min(100, Math.round(
    50 + moonEnergy * 30 + beneficTransits * 10
  ));

  // Cosmic weather
  const maleficTransits = transits.filter(t =>
    ['Mars', 'Saturn'].includes(t.name)
  ).length;
  const cosmicWeather: WidgetData['cosmicWeather'] = 
    energyScore >= 80 ? 'excellent' :
    energyScore >= 60 ? 'good' :
    maleficTransits > 1 ? 'challenging' : 'mixed';

  // Best time
  const times = ['Morning (6-9am)', 'Late morning (9-12pm)', 'Afternoon (1-4pm)', 
                 'Evening (6-9pm)', 'Night (9pm-12am)'];
  const bestTimeOfDay = times[dayOfYear % times.length];

  // Top transit
  const topTransit = transits.length > 0
    ? `${transits[0].name} in ${transits[0].sign}`
    : 'Clear skies';

  const widgetData: WidgetData = {
    sunSign,
    zodiacEmoji: ZODIAC_EMOJIS[sunSign] || '⭐',
    moonPhaseEmoji: moonPhase.emoji,
    moonPhaseName: moonPhase.name,
    energyScore,
    dailyInsight,
    luckyColor,
    luckyNumber,
    topTransit,
    bestTimeOfDay,
    cosmicWeather,
    lastUpdated: new Date().toISOString(),
    date: today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  };

  // Cache for widget extension to read
  await AsyncStorage.setItem('veya-widget-data', JSON.stringify(widgetData));

  return widgetData;
}

// ---------------------------------------------------------------------------
// Widget Update Scheduler
// ---------------------------------------------------------------------------

export async function scheduleWidgetUpdates(): Promise<void> {
  // In production, this would use expo-task-manager to schedule
  // background updates every 6 hours
  console.log('[Widget] Widget updates scheduled');
}

// ---------------------------------------------------------------------------
// Widget Configuration for expo-widget
// ---------------------------------------------------------------------------

export const WIDGET_CONFIG = {
  ios: {
    name: 'VEYaWidget',
    displayName: 'VEYa Cosmic',
    description: 'Your daily cosmic summary at a glance',
    supportedFamilies: ['small', 'medium', 'large'],
    backgroundColor: '#1B0B38',
    accentColor: '#8B5CF6',
  },
  android: {
    name: 'VEYaWidget',
    label: 'VEYa Cosmic',
    description: 'Your daily cosmic summary',
    minWidth: '180dp',
    minHeight: '110dp',
    updatePeriodMs: 21600000, // 6 hours
    previewImage: 'widget_preview',
  },
};
