import type { RefObject } from 'react';
import { Linking } from 'react-native';
import * as Sharing from 'expo-sharing';
import type ViewShot from 'react-native-view-shot';
import type { GeneratedDailyReading } from './dailyReadingGenerator';

export interface ShareCardData {
  title: string;
  body: string;
  signName: string;
  date: string;
}

export interface ShareUserData {
  name: string;
  signName: string;
  signEmoji?: string;
  date?: string;
}

function formatDate(dateString?: string) {
  const date = dateString ? new Date(dateString) : new Date();
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

async function captureCard(
  viewRef: RefObject<ViewShot | null> | undefined,
  width: number,
  height: number,
) {
  if (!viewRef?.current?.capture) return null;

  return viewRef.current.capture({
    format: 'png',
    quality: 1,
    width,
    height,
  });
}

export async function captureAndShare(
  viewRef: RefObject<ViewShot | null>,
): Promise<boolean> {
  try {
    const uri = await viewRef.current?.capture?.({
      format: 'png',
      quality: 1,
    });

    if (!uri) return false;

    const available = await Sharing.isAvailableAsync();
    if (!available) return false;

    await Sharing.shareAsync(uri);
    return true;
  } catch (error) {
    console.error('[ShareService] captureAndShare error:', error);
    return false;
  }
}

export async function generateStoryCard(
  insight: string,
  userData: ShareUserData,
  viewRef?: RefObject<ViewShot | null>,
) {
  void insight;
  void userData;
  return captureCard(viewRef, 1080, 1920);
}

export async function generatePostCard(
  insight: string,
  userData: ShareUserData,
  viewRef?: RefObject<ViewShot | null>,
) {
  void insight;
  void userData;
  return captureCard(viewRef, 1080, 1080);
}

export async function shareToInstagram(cardUri: string): Promise<boolean> {
  try {
    if (!cardUri) return false;

    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(cardUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share to Instagram',
      });
      return true;
    }

    const instagramUrl = `instagram://library?AssetPath=${encodeURIComponent(cardUri)}`;
    const canOpen = await Linking.canOpenURL(instagramUrl);
    if (canOpen) {
      await Linking.openURL(instagramUrl);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[ShareService] shareToInstagram error:', error);
    return false;
  }
}

export function shareReading(
  reading: GeneratedDailyReading,
  signName: string,
): ShareCardData {
  return {
    title: `Your ${signName} Cosmic Briefing`,
    body: reading.briefing,
    signName,
    date: formatDate(reading.date),
  };
}

export function shareChatResponse(
  message: string,
  signName: string,
): ShareCardData {
  return {
    title: `Cosmic Insight for ${signName}`,
    body: message,
    signName,
    date: formatDate(),
  };
}
