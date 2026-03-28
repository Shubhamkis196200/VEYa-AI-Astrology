// ============================================================================
// VEYa Streak Service
// ============================================================================

import { supabase } from '../lib/supabase';
import type { Streak } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getTodayDateString(): string {
  return getDateString(new Date());
}

function getYesterdayDateString(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return getDateString(yesterday);
}

/**
 * Resolve auth UID → profiles.id.
 * Returns the input unchanged if it can't resolve (may already be profile.id).
 */
async function getProfileId(authUid: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', authUid)
    .single();
  return data?.id ?? authUid;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export async function getStreak(userId: string): Promise<Streak | null> {
  const profileId = await getProfileId(userId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('streaks')
    .select('*')
    .eq('user_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('[StreakService] getStreak error:', error.message);
    return null;
  }

  return data;
}

export async function checkIn(userId: string): Promise<Streak | null> {
  const profileId = await getProfileId(userId);
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const existing = await getStreak(profileId);

  // If no streak exists yet, create one
  if (!existing) {
    const insertRecord = {
      user_id: profileId,
      current_streak: 1,
      longest_streak: 1,
      total_days: 1,
      last_check_in: today,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('streaks')
      .upsert(insertRecord, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('[StreakService] checkIn insert error:', error.message);
      return null;
    }

    return data;
  }

  // No-op if already checked in today
  if (existing.last_check_in === today) {
    return existing;
  }

  const previousStreak = existing.current_streak || 0;
  const previousLongest = existing.longest_streak || 0;
  const previousTotal = existing.total_days || 0;

  const shouldIncrement = existing.last_check_in === yesterday;
  const nextCurrent = shouldIncrement ? previousStreak + 1 : 1;
  const nextLongest = Math.max(previousLongest, nextCurrent);
  const nextTotal = previousTotal + 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('streaks')
    .update({
      current_streak: nextCurrent,
      longest_streak: nextLongest,
      total_days: nextTotal,
      last_check_in: today,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    console.error('[StreakService] checkIn update error:', error.message);
    return { ...existing, current_streak: nextCurrent, longest_streak: nextLongest, total_days: nextTotal, last_check_in: today } as Streak;
  }

  return data;
}
