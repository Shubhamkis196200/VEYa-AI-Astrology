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

// ---------------------------------------------------------------------------
// 1. getTodayReading — Check cache first
// ---------------------------------------------------------------------------

export async function getTodayReading(
  userId: string,
): Promise<DailyReading | null> {
  const today = getTodayDateString();

  const { data, error } = await supabase
    .from('daily_readings')
    .select('*')
    .eq('user_id', userId)
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

  // Build the record to insert (matches new DB schema)
  const readingRecord = {
    user_id: userProfile.user_id,
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
  const { data, error } = await supabase
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

export async function fetchUserChart(
  userId: string,
): Promise<BirthChart | null> {
  const { data, error } = await supabase
    .from('birth_charts')
    .select('*')
    .eq('user_id', userId)
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
