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

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export async function getStreak(userId: string): Promise<Streak | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('streak_type', 'daily_check_in')
    .maybeSingle();

  if (error) {
    console.error('[StreakService] getStreak error:', error.message);
    return null;
  }

  return data;
}

export async function checkIn(userId: string): Promise<Streak | null> {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const existing = await getStreak(userId);

  // If no streak exists yet, create one
  if (!existing) {
    const insertRecord = {
      user_id: userId,
      streak_type: 'daily_check_in',
      current_streak: 1,
      longest_streak: 1,
      total_check_ins: 1,
      last_check_in: today,
    };

    const { data, error } = await supabase
      .from('streaks')
      .upsert(insertRecord, { onConflict: 'user_id,streak_type' })
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
  const previousTotal = existing.total_check_ins || 0;

  const shouldIncrement = existing.last_check_in === yesterday;
  const nextCurrent = shouldIncrement ? previousStreak + 1 : 1;
  const nextLongest = Math.max(previousLongest, nextCurrent);
  const nextTotal = previousTotal + 1;

  const { data, error } = await supabase
    .from('streaks')
    .update({
      current_streak: nextCurrent,
      longest_streak: nextLongest,
      total_check_ins: nextTotal,
      last_check_in: today,
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error) {
    console.error('[StreakService] checkIn update error:', error.message);
    return { ...existing, current_streak: nextCurrent, longest_streak: nextLongest, total_check_ins: nextTotal, last_check_in: today } as Streak;
  }

  return data;
}
