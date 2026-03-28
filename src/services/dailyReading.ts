// ============================================================================
// VEYa Daily Reading Service
// ============================================================================

import { supabase } from '../lib/supabase';
import { generateDailyReading } from './ai';
import type { DailyReadingAIResponse } from './ai';
import type { UserProfile, BirthChart, DailyReading } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Resolve auth UID → profiles.id (the profile UUID used as FK in child tables).
 * Returns null if no profile found.
 */
async function getProfileId(authUid: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', authUid)
    .single();

  if (error || !data) {
    console.warn('[DailyReading] getProfileId: no profile for', authUid);
    return null;
  }
  return data.id;
}

// ---------------------------------------------------------------------------
// 1. getTodayReading — Check cache first
// ---------------------------------------------------------------------------

/**
 * @param userId Can be auth UID or profile UUID. If auth UID is passed,
 *               we resolve to profile.id first so the FK query is correct.
 */
export async function getTodayReading(
  userId: string,
): Promise<DailyReading | null> {
  const today = getTodayDateString();

  // Resolve to profile.id if the caller passed auth UID
  // (safe to call with profile.id too — will not find a match on user_id
  //  and return null, so we try the direct query first)
  let profileId = userId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directData } = await (supabase as any)
    .from('daily_readings')
    .select('*')
    .eq('user_id', userId)
    .eq('reading_date', today)
    .maybeSingle();

  if (directData) return directData;

  // Try resolving as auth UID → profile.id
  const resolvedId = await getProfileId(userId);
  if (!resolvedId || resolvedId === userId) return null;
  profileId = resolvedId;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('daily_readings')
    .select('*')
    .eq('user_id', profileId)
    .eq('reading_date', today)
    .maybeSingle();

  if (error) {
    console.error('[DailyReading] getTodayReading error:', error.message);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// 2. generateAndCacheDailyReading — Generate via AI + store
// ---------------------------------------------------------------------------

export async function generateAndCacheDailyReading(
  userProfile: UserProfile,
  chartData?: BirthChart | null,
): Promise<DailyReading> {
  const today = getTodayDateString();

  // Generate the reading via OpenAI
  const aiResponse: DailyReadingAIResponse = await generateDailyReading(
    userProfile,
    chartData,
  );

  // userProfile.id is the profile UUID (FK in daily_readings)
  // userProfile.user_id is the auth UUID — do NOT use this as FK
  const profileId = userProfile.id;

  // Build the record to insert (matches real DB schema)
  const readingRecord = {
    user_id: profileId,
    reading_date: today,
    sun_sign: userProfile.sun_sign || null,
    reading_text: aiResponse.reading_text,
    energy_level: aiResponse.energy_level,
    energy_summary: `Energy level ${aiResponse.energy_level}/10`,
    do_guidance: aiResponse.do_guidance,
    dont_guidance: aiResponse.dont_guidance,
    transit_highlights: aiResponse.transit_highlights as unknown as Record<string, unknown>[],
    lucky_number: Math.floor(Math.random() * 9) + 1,
    lucky_color: getCosmicColor(aiResponse.energy_level),
    mood: getMoodFromEnergy(aiResponse.energy_level),
    affirmation: null,
  };

  // Upsert (in case there's a race condition with multiple tabs)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('daily_readings')
    .upsert(readingRecord, {
      onConflict: 'user_id,reading_date',
    })
    .select()
    .single();

  if (error) {
    console.error('[DailyReading] cache error:', error.message);
    // Return a non-persisted version so the UI still works
    return {
      id: 'temp-' + Date.now(),
      ...readingRecord,
      focus_areas: null,
      share_card_url: null,
      created_at: new Date().toISOString(),
    } as DailyReading;
  }

  return data;
}

// ---------------------------------------------------------------------------
// 3. fetchUserChart — Helper to get chart data
// ---------------------------------------------------------------------------

/**
 * @param userId Can be auth UID or profile UUID.
 */
export async function fetchUserChart(
  userId: string,
): Promise<BirthChart | null> {
  // Try direct query first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: directData } = await (supabase as any)
    .from('birth_charts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (directData) return directData;

  // Try resolving as auth UID → profile.id
  const profileId = await getProfileId(userId);
  if (!profileId || profileId === userId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('birth_charts')
    .select('*')
    .eq('user_id', profileId)
    .maybeSingle();

  if (error) {
    console.error('[DailyReading] fetchUserChart error:', error.message);
    return null;
  }

  return data;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCosmicColor(energyLevel: number): string {
  if (energyLevel >= 8) return 'Gold';
  if (energyLevel >= 6) return 'Amethyst Purple';
  if (energyLevel >= 4) return 'Rose Quartz';
  if (energyLevel >= 2) return 'Moonstone Silver';
  return 'Deep Indigo';
}

function getMoodFromEnergy(energyLevel: number): string {
  if (energyLevel >= 8) return 'radiant';
  if (energyLevel >= 6) return 'inspired';
  if (energyLevel >= 4) return 'balanced';
  if (energyLevel >= 2) return 'reflective';
  return 'introspective';
}
