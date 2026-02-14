import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const MORNING_MESSAGE =
  'Your cosmic briefing awaits ✨ The stars have a message for you today.';
const STREAK_MESSAGE =
  "Don't break your X-day streak! 🔥 Your cosmic journey continues.";

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8B5CF6',
  });
}

export async function requestPermissions() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
    await ensureAndroidChannel();
    return Notifications.getPermissionsAsync();
  } catch (e) {
    console.warn('[Notifications] permission error', e);
    return { status: 'undetermined' as const };
  }
}

export async function scheduleMorningNotification() {
  try {
    const permission = await requestPermissions();
    if (permission.status !== 'granted') return null;

    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Good morning ✨',
        body: MORNING_MESSAGE,
        data: { screen: '/(tabs)/index' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 8,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch (e) {
    console.warn('[Notifications] schedule morning error', e);
    return null;
  }
}

export async function scheduleStreakReminder() {
  try {
    const permission = await requestPermissions();
    if (permission.status !== 'granted') return null;

    return Notifications.scheduleNotificationAsync({
      content: {
        title: 'Keep the flame alive 🔥',
        body: STREAK_MESSAGE,
        data: { screen: '/(tabs)/index' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: 20,
        minute: 0,
        repeats: true,
      } as any,
    });
  } catch (e) {
    console.warn('[Notifications] schedule streak error', e);
    return null;
  }
}

export async function scheduleTransitAlert(
  planet: string,
  sign: string,
  message: string,
) {
  try {
    const permission = await requestPermissions();
    if (permission.status !== 'granted') return null;

    return Notifications.scheduleNotificationAsync({
      content: {
        title: `${planet} in ${sign}`,
        body: message,
        data: { screen: '/(tabs)/explore' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      } as any,
    });
  } catch (e) {
    console.warn('[Notifications] schedule transit error', e);
    return null;
  }
}

export async function cancelAllNotifications() {
  return Notifications.cancelAllScheduledNotificationsAsync();
}
