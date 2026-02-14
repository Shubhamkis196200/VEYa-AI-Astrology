/**
 * Onboarding Service — Saves onboarding data to Supabase
 *
 * Called when the user completes onboarding.
 * Inserts into user_profiles and birth_charts tables.
 */

import { supabase } from '../lib/supabase';
import type { OnboardingData } from '../types';

interface ChartData {
  sunSign: string;
  moonSign: string;
  risingSign: string;
}

/**
 * Save the complete onboarding data to Supabase.
 * Creates/updates user_profiles and inserts a birth_chart record.
 */
export async function saveOnboardingData(
  onboardingData: OnboardingData,
  chartData?: ChartData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('No authenticated user found, saving onboarding data locally only');
      return { success: true }; // Graceful fallback — data stays in Zustand
    }

    const userId = user.id;

    // Format birth date as ISO string
    const birthDateStr = onboardingData.birthDate
      ? (onboardingData.birthDate instanceof Date
          ? onboardingData.birthDate.toISOString().split('T')[0]
          : String(onboardingData.birthDate))
      : null;

    // Format birth time as HH:MM string
    const birthTimeStr = onboardingData.birthTime
      ? (onboardingData.birthTime instanceof Date
          ? onboardingData.birthTime.toISOString().split('T')[1]?.substring(0, 5)
          : String(onboardingData.birthTime))
      : null;

    // 1. Upsert user_profiles (column names match new DB schema)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          display_name: onboardingData.name || 'Cosmic Soul',
          birth_date: birthDateStr,
          birth_time: birthTimeStr,
          birth_time_precision: onboardingData.birthTimePrecision,
          birth_time_range: onboardingData.birthTimeRange || null,
          birth_place: onboardingData.birthPlace || null,
          birth_latitude: onboardingData.birthLat,
          birth_longitude: onboardingData.birthLng,
          sun_sign: chartData?.sunSign || onboardingData.sunSign || null,
          moon_sign: chartData?.moonSign || null,
          rising_sign: chartData?.risingSign || null,
          focus_areas: onboardingData.focusAreas || [],
          interests: onboardingData.purpose || [],
          personality_traits: onboardingData.methodology || [],
          onboarding_completed: true,
          onboarding_step: 9,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (profileError) {
      console.error('Error saving user profile:', profileError);
      return { success: false, error: profileError.message };
    }

    // 2. Insert birth_charts (if chart data is available)
    if (chartData) {
      const { error: chartError } = await supabase
        .from('birth_charts')
        .insert({
          user_id: userId,
          house_system: 'placidus',
          sun_sign: chartData.sunSign,
          moon_sign: chartData.moonSign,
          rising_sign: chartData.risingSign,
          chart_data: {
            sun_sign: chartData.sunSign,
            moon_sign: chartData.moonSign,
            rising_sign: chartData.risingSign,
          },
        });

      if (chartError) {
        console.error('Error saving birth chart:', chartError);
        // Don't fail the whole onboarding for chart insert errors
      }
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Onboarding save error:', message);
    return { success: false, error: message };
  }
}
