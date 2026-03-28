/**
 * Onboarding Service — Saves onboarding data to Supabase
 *
 * Called when the user completes onboarding.
 * Inserts into profiles and birth_charts tables.
 *
 * NOTE: profiles.user_id = auth UID
 *       profiles.id      = profile UUID (used as FK in all child tables)
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
 * Creates/updates profiles and inserts a birth_chart record.
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

    const authUid = user.id;

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

    // 1. Upsert profiles (column names match real DB schema)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .upsert(
        {
          user_id: authUid,
          name: onboardingData.name || 'Cosmic Soul',
          display_name: onboardingData.name || 'Cosmic Soul',
          birth_date: birthDateStr,
          birth_time: birthTimeStr,
          birth_place: onboardingData.birthPlace || null,
          sun_sign: chartData?.sunSign || onboardingData.sunSign || null,
          moon_sign: chartData?.moonSign || onboardingData.moonSign || null,
          rising_sign: chartData?.risingSign || onboardingData.risingSign || null,
          focus_areas: onboardingData.focusAreas || [],
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (profileError) {
      console.error('Error saving user profile:', profileError);
      return { success: false, error: profileError.message };
    }

    // 2. Fetch the profile UUID (profiles.id) — needed as FK for birth_charts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRow, error: fetchError } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('user_id', authUid)
      .single();

    if (fetchError || !profileRow) {
      console.error('Error fetching profile id:', fetchError?.message);
      // Birth chart won't be saved but profile is OK
      return { success: true };
    }

    const profileId = profileRow.id;

    // 3. Insert birth_charts (uses profiles.id as FK)
    if (chartData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: chartError } = await (supabase as any)
        .from('birth_charts')
        .insert({
          user_id: profileId,
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
