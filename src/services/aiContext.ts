// ============================================================================
// VEYa AI Context Builder — Dynamic Prompt Enrichment
// ============================================================================
// Builds rich, personalized context for every AI call by combining:
// 1. Current date/time
// 2. Real planetary transits (from astroEngine)
// 3. User's natal chart data
// 4. Moon phase information
// 5. RAG memories (when available)
// ============================================================================

import {
  getCurrentTransits,
  getMoonPhase,
  formatTransitsForPrompt,
  formatMoonForPrompt,
  calculateAspects,
  getDailyTransitSummary,
  type PlanetPosition,
} from './astroEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserChartData {
  name?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  sunSign?: string | null;
  moonSign?: string | null;
  risingSign?: string | null;
  focusAreas?: string[];
  natalPositions?: PlanetPosition[];
}

export interface AIContext {
  systemPrompt: string;
  transitContext: string;
  moonContext: string;
  chartContext: string;
  dateContext: string;
  fullContext: string;
}

// ---------------------------------------------------------------------------
// Smart Context Builder
// ---------------------------------------------------------------------------

/**
 * Builds the complete AI context for any VEYa interaction.
 * This is the master function — call this before every AI API call.
 */
export function buildSmartContext(userData: UserChartData): AIContext {
  const now = new Date();

  // 1. Date Context
  const dateContext = buildDateContext(now);

  // 2. Transit Context (real astronomical data)
  const transits = getCurrentTransits(now);
  const transitContext = formatTransitsForPrompt(transits);

  // 3. Moon Context
  const moonPhase = getMoonPhase(now);
  const moonContext = formatMoonForPrompt(moonPhase);

  // 4. Chart Context (user's natal data)
  const chartContext = buildChartContext(userData);

  // 5. Personal Transit Aspects (if we have natal positions)
  let personalAspectsContext = '';
  if (userData.natalPositions?.length) {
    const aspects = calculateAspects(transits, userData.natalPositions);
    if (aspects.length > 0) {
      personalAspectsContext = '\n\nToday\'s Transits to Your Chart:\n' +
        aspects.slice(0, 6).map((a) =>
          `  ${a.transitPlanet} ${a.aspectSymbol} natal ${a.natalPlanet} (${a.aspectType}, orb ${a.orb}°) — ${a.interpretation}`
        ).join('\n');
    }
  }

  // 6. Cosmic Weather Summary
  const summary = getDailyTransitSummary(now, userData.natalPositions);
  const weatherContext = `\nCosmic Weather: ${summary.cosmicWeather}\nEnergy Level: ${summary.energyLevel}/10`;

  // Full combined context
  const fullContext = [
    dateContext,
    '',
    transitContext,
    '',
    moonContext,
    '',
    chartContext,
    personalAspectsContext,
    weatherContext,
  ].join('\n');

  // System prompt with personality + real data
  const systemPrompt = buildEnrichedSystemPrompt(userData, fullContext);

  return {
    systemPrompt,
    transitContext,
    moonContext,
    chartContext,
    dateContext,
    fullContext,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDateContext(now: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  const formatted = now.toLocaleDateString('en-US', options);
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const year = now.getFullYear();

  return `⚠️ CURRENT DATE (USE THIS): ${formatted}
CURRENT YEAR: ${year} (NOT 2023 or 2024 - we are in ${year})
Day of Year: ${dayOfYear}/365`;
}

function buildChartContext(userData: UserChartData): string {
  const lines: string[] = ['User\'s Birth Chart:'];

  if (userData.name) lines.push(`  Name: ${userData.name}`);
  if (userData.birthDate) lines.push(`  Birth Date: ${userData.birthDate}`);
  if (userData.birthTime) lines.push(`  Birth Time: ${userData.birthTime}`);
  if (userData.birthPlace) lines.push(`  Birth Place: ${userData.birthPlace}`);
  if (userData.sunSign) lines.push(`  ☉ Sun: ${userData.sunSign}`);
  if (userData.moonSign) lines.push(`  ☽ Moon: ${userData.moonSign}`);
  if (userData.risingSign) lines.push(`  ASC Rising: ${userData.risingSign}`);

  if (userData.natalPositions?.length) {
    lines.push('  Full Natal Positions:');
    for (const p of userData.natalPositions) {
      const retro = p.retrograde ? ' (Rx)' : '';
      lines.push(`    ${p.symbol} ${p.name}: ${p.sign} ${p.signDegree}°${p.signMinute}'${retro}`);
    }
  }

  if (userData.focusAreas?.length) {
    lines.push(`  Focus Areas: ${userData.focusAreas.join(', ')}`);
  }

  return lines.join('\n');
}

function buildEnrichedSystemPrompt(userData: UserChartData, context: string): string {
  const userName = userData.name || 'dear one';
  const sunSign = userData.sunSign || 'a beautiful soul';

  return `You are VEYa, a warm, wise, and deeply knowledgeable AI astrologer.

WHO YOU ARE:
- A trusted friend who is also an expert astrologer with 20+ years of experience
- Your tone is warm, insightful, empowering, occasionally playful — like a wise mentor
- You NEVER sound cold, robotic, dismissive, or generic
- You are the OPPOSITE of Co-Star (which users find harsh) — you lead with warmth and empowerment
- You believe in agency: astrology reveals energy patterns, not fixed destiny

CRITICAL RULES:
- ALWAYS reference today's ACTUAL date and planetary positions (provided below)
- ALWAYS mention at least ONE specific transit when giving advice
- ALWAYS reference the user's natal placements when relevant
- ALWAYS use ${userName}'s name naturally in conversation
- NEVER invent or fabricate planetary positions — use ONLY the real data below
- NEVER give generic horoscope-style responses — be deeply personal
- Keep responses concise: 2-3 paragraphs for chat, 3-4 for readings
- Use emoji sparingly and tastefully (✨ 🌙 ☉ ♀️)
- When discussing challenges, lead with empathy, end with empowerment

ASTROLOGICAL KNOWLEDGE:
- Expert in Western tropical astrology (Placidus + Whole Sign house systems)
- Knowledgeable in Vedic sidereal astrology
- Familiar with Chinese zodiac and Numerology
- You explain the WHY behind every insight (which transit, which placement)

THE USER:
${userName} has their Sun in ${sunSign}.

--- REAL-TIME COSMIC DATA (USE THIS, DO NOT INVENT) ---
${context}
--- END COSMIC DATA ---

Remember: Every response must feel like it was written specifically for ${userName}, referencing their chart and today's actual sky.`;
}

/**
 * Build context specifically for voice mode (shorter, more conversational)
 */
export function buildVoiceContext(userData: UserChartData): string {
  const ctx = buildSmartContext(userData);
  return `${ctx.systemPrompt}

VOICE MODE RULES (additional):
- Keep responses to 2-3 sentences max — they'll be spoken aloud
- Sound natural and conversational, like talking to a friend
- Avoid lists, bullet points, or formatting — just flowing speech
- Use shorter words and simpler sentence structure
- Start with warmth: "Hey ${userData.name || 'love'}", "Oh, interesting..."
- End with an engaging question to keep the conversation flowing`;
}

/**
 * Build context for daily reading generation
 */
export function buildDailyReadingContext(userData: UserChartData): string {
  const ctx = buildSmartContext(userData);
  return `${ctx.systemPrompt}

DAILY READING RULES (additional):
- This is the user's morning cosmic briefing — make it feel special
- Start with the overall energy of the day
- Highlight the most important 2-3 transits affecting THEM specifically
- Include one actionable DO and one DON'T, tied to specific transits
- End with an empowering affirmation
- If it's a Full Moon or New Moon, make that the centerpiece
- Reference their Sun, Moon, and Rising if available`;
}

/**
 * Build context for compatibility analysis
 */
export function buildCompatibilityContext(
  user1Data: UserChartData,
  user2Data: UserChartData,
): string {
  const ctx = buildSmartContext(user1Data);
  const user2Chart = buildChartContext(user2Data);

  return `${ctx.systemPrompt}

COMPATIBILITY ANALYSIS:
Person 1 (the user): ${user1Data.name || 'User'}
Person 2: ${user2Data.name || 'Their partner'}

${user2Chart}

Analyze the synastry between these two charts. Be specific about planetary contacts.
Focus on: emotional connection, communication style, physical chemistry, growth potential, and challenge areas.`;
}
