// ============================================================================
// VEYa Smart Notifications — Quality Over Quantity
// ============================================================================

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMoonPhase, getCurrentTransits } from './astroEngine';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NOTIFICATION_STORAGE_KEY = 'veya-notification-prefs';
const MAX_NOTIFICATIONS_PER_WEEK = 5; // Quality over spam

export interface NotificationPreferences {
  enabled: boolean;
  dailyInsight: boolean;
  moonEvents: boolean;
  majorTransits: boolean;
  streakReminders: boolean;
  quietHoursStart: number; // 0-23
  quietHoursEnd: number;   // 0-23
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  dailyInsight: true,
  moonEvents: true,
  majorTransits: true,
  streakReminders: true,
  quietHoursStart: 22, // 10 PM
  quietHoursEnd: 8,    // 8 AM
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export async function setupNotifications(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // Set up notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('veya-cosmic', {
      name: 'Cosmic Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
      sound: 'default',
    });
  }

  return true;
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export async function getNotificationPrefs(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('[Notifications] Failed to load prefs:', e);
  }
  return DEFAULT_PREFS;
}

export async function setNotificationPrefs(prefs: Partial<NotificationPreferences>): Promise<void> {
  const current = await getNotificationPrefs();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(updated));
}

// ---------------------------------------------------------------------------
// Smart Notification Scheduling
// ---------------------------------------------------------------------------

interface CosmicNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  triggerDate: Date;
  priority: 'high' | 'medium' | 'low';
}

// Check if current time is in quiet hours
function isQuietHours(prefs: NotificationPreferences): boolean {
  const hour = new Date().getHours();
  if (prefs.quietHoursStart > prefs.quietHoursEnd) {
    // Overnight quiet hours (e.g., 22:00 - 08:00)
    return hour >= prefs.quietHoursStart || hour < prefs.quietHoursEnd;
  }
  return hour >= prefs.quietHoursStart && hour < prefs.quietHoursEnd;
}

// Generate meaningful notifications for the week
export async function generateWeeklyNotifications(
  userName: string,
  sunSign?: string
): Promise<CosmicNotification[]> {
  const notifications: CosmicNotification[] = [];
  const now = new Date();
  
  const moonPhase = getMoonPhase(now);
  const transits = getCurrentTransits(now);

  // 1. Full Moon notification (if within next 7 days)
  if (moonPhase.daysUntilFullMoon <= 7 && moonPhase.daysUntilFullMoon > 0) {
    const fullMoonDate = new Date(now.getTime() + moonPhase.daysUntilFullMoon * 24 * 60 * 60 * 1000);
    fullMoonDate.setHours(9, 0, 0, 0); // 9 AM
    
    notifications.push({
      id: `full-moon-${fullMoonDate.toISOString().split('T')[0]}`,
      title: '🌕 Full Moon Approaching',
      body: `${userName}, the Full Moon in ${moonPhase.moonSign} arrives ${moonPhase.daysUntilFullMoon === 1 ? 'tomorrow' : `in ${moonPhase.daysUntilFullMoon} days`}. Time to release what no longer serves you.`,
      triggerDate: new Date(fullMoonDate.getTime() - 24 * 60 * 60 * 1000), // Day before
      priority: 'high',
    });
  }

  // 2. New Moon notification (if within next 7 days)
  if (moonPhase.daysUntilNewMoon <= 7 && moonPhase.daysUntilNewMoon > 0) {
    const newMoonDate = new Date(now.getTime() + moonPhase.daysUntilNewMoon * 24 * 60 * 60 * 1000);
    newMoonDate.setHours(9, 0, 0, 0);
    
    notifications.push({
      id: `new-moon-${newMoonDate.toISOString().split('T')[0]}`,
      title: '🌑 New Moon Energy',
      body: `${userName}, the New Moon in ${moonPhase.moonSign} is perfect for setting intentions. What do you want to manifest?`,
      triggerDate: new Date(newMoonDate.getTime() - 24 * 60 * 60 * 1000),
      priority: 'high',
    });
  }

  // 3. Morning insight notification (daily)
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(8, 30, 0, 0);

  // Find most significant transit for the user
  const significantPlanet = transits.find(t => 
    ['Venus', 'Mars', 'Jupiter'].includes(t.planet)
  );
  
  if (significantPlanet) {
    notifications.push({
      id: `daily-${tomorrowMorning.toISOString().split('T')[0]}`,
      title: `✨ Good morning, ${userName}`,
      body: `${significantPlanet.planet} in ${significantPlanet.sign} colors your day. Tap to see your personalized insight.`,
      triggerDate: tomorrowMorning,
      priority: 'medium',
    });
  }

  // 4. Streak reminder (if enabled)
  const eveningReminder = new Date(now);
  eveningReminder.setHours(20, 0, 0, 0);
  if (eveningReminder <= now) {
    eveningReminder.setDate(eveningReminder.getDate() + 1);
  }

  notifications.push({
    id: `streak-${eveningReminder.toISOString().split('T')[0]}`,
    title: '🔥 Keep your streak alive',
    body: `${userName}, don't forget to check in today! Your cosmic journey continues.`,
    triggerDate: eveningReminder,
    priority: 'low',
  });

  // Sort by priority and limit
  return notifications
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    })
    .slice(0, MAX_NOTIFICATIONS_PER_WEEK);
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

export async function scheduleCosmicNotifications(
  userName: string,
  sunSign?: string
): Promise<void> {
  const prefs = await getNotificationPrefs();
  
  if (!prefs.enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  // Cancel existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Generate new notifications
  const notifications = await generateWeeklyNotifications(userName, sunSign);

  // Schedule each notification
  for (const notification of notifications) {
    // Skip if in quiet hours
    const triggerHour = notification.triggerDate.getHours();
    if (triggerHour >= prefs.quietHoursStart || triggerHour < prefs.quietHoursEnd) {
      // Adjust to after quiet hours
      notification.triggerDate.setHours(prefs.quietHoursEnd, 30, 0, 0);
    }

    // Skip if trigger date is in the past
    if (notification.triggerDate <= new Date()) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: true,
        },
        trigger: {
          date: notification.triggerDate,
          channelId: Platform.OS === 'android' ? 'veya-cosmic' : undefined,
        },
      });
    } catch (e) {
      console.warn('[Notifications] Failed to schedule:', notification.id, e);
    }
  }
}

// ---------------------------------------------------------------------------
// Immediate Notifications
// ---------------------------------------------------------------------------

export async function sendImmediateNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const prefs = await getNotificationPrefs();
  
  if (!prefs.enabled || isQuietHours(prefs)) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate
  });
}

// ---------------------------------------------------------------------------
// Special Event Notifications
// ---------------------------------------------------------------------------

export async function notifyMercuryRetrograde(userName: string, daysUntil: number): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.enabled || !prefs.majorTransits) return;

  await sendImmediateNotification(
    '☿️ Mercury Retrograde Alert',
    `${userName}, Mercury goes retrograde in ${daysUntil} days. Time to backup your data and avoid signing contracts!`
  );
}

export async function notifyEclipse(userName: string, type: 'solar' | 'lunar'): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.enabled || !prefs.majorTransits) return;

  const emoji = type === 'solar' ? '🌑' : '🌕';
  await sendImmediateNotification(
    `${emoji} ${type === 'solar' ? 'Solar' : 'Lunar'} Eclipse Today`,
    `${userName}, eclipses bring powerful transformation. Stay open to what wants to shift.`
  );
}

export async function notifyPersonalTransit(
  userName: string,
  planet: string,
  house: number,
  aspect: string
): Promise<void> {
  const prefs = await getNotificationPrefs();
  if (!prefs.enabled || !prefs.majorTransits) return;

  await sendImmediateNotification(
    `✨ ${planet} Activating Your Chart`,
    `${userName}, ${planet} is ${aspect} your ${house}th house. Tap to learn what this means for you.`
  );
}
