// ============================================================================
// VEYa AI Service — OpenAI API Integration with Fallback
// ============================================================================

import { supabase } from '../lib/supabase';
import {
  VEYA_SYSTEM_PROMPT,
  DAILY_READING_PROMPT,
  CHAT_SYSTEM_PROMPT,
  COMPATIBILITY_PROMPT,
} from '../constants/veyaPrompt';
import { VEYA_VOICE_SYSTEM_PROMPT as VEYA_VOICE_PROMPT } from '../constants/veyaVoicePrompt';
import type {
  UserProfile,
  BirthChart,
} from '../types';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENAI_API_KEY =
  process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const OPENAI_BASE = 'https://api.openai.com/v1';

const MODELS = {
  premium: 'gpt-4o',
  free: 'gpt-4o-mini',
  embedding: 'text-embedding-3-small',
} as const;

const REQUEST_TIMEOUT = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MemoryResult {
  id: string;
  content: string;
  content_type: string;
  similarity: number;
  metadata: Record<string, unknown> | null;
}

export interface CompatibilityReport {
  overall_score: number;
  dimensions: {
    communication: { score: number; summary: string };
    emotional: { score: number; summary: string };
    passion: { score: number; summary: string };
    growth: { score: number; summary: string };
    conflict: { score: number; summary: string };
    longterm: { score: number; summary: string };
  };
  narrative: string;
  strengths: string[];
  challenges: string[];
  advice: string;
}

export interface TransitHighlight {
  planet: string;
  aspect: string;
  interpretation: string;
}

export interface DailyReadingAIResponse {
  reading_text: string;
  energy_level: number;
  do_guidance: string;
  dont_guidance: string;
  transit_highlights: TransitHighlight[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAbortSignal(ms: number = REQUEST_TIMEOUT): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function openAIFetch<T>(
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number = REQUEST_TIMEOUT,
): Promise<T> {
  const response = await fetch(`${OPENAI_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
    signal: buildAbortSignal(timeoutMs),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

async function invokeEdgeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    throw new Error(error.message);
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data as T;
}

function formatChartContext(profile: UserProfile, chart?: BirthChart | null): string {
  const lines: string[] = [];

  if (profile.name) lines.push(`User's name: ${profile.name}`);
  if (profile.sun_sign) lines.push(`Sun sign: ${profile.sun_sign}`);
  if (profile.moon_sign) lines.push(`Moon sign: ${profile.moon_sign}`);
  if (profile.rising_sign) lines.push(`Rising sign: ${profile.rising_sign}`);
  if (profile.chinese_zodiac) lines.push(`Chinese zodiac: ${profile.chinese_zodiac}`);
  if (profile.vedic_nakshatra) lines.push(`Vedic nakshatra: ${profile.vedic_nakshatra}`);
  if (profile.life_path_number) lines.push(`Life path number: ${profile.life_path_number}`);
  if (profile.focus_areas?.length) {
    lines.push(`Focus areas: ${profile.focus_areas.join(', ')}`);
  }

  if (chart?.planets) {
    lines.push('\nNatal Chart Placements:');
    const planets = chart.planets;
    for (const [planet, placement] of Object.entries(planets)) {
      if (placement) {
        const house = placement.house ? ` in House ${placement.house}` : '';
        lines.push(`  ${planet}: ${placement.sign} ${placement.degree.toFixed(1)}°${house}`);
      }
    }
  }

  if (chart?.aspects?.length) {
    lines.push('\nKey Natal Aspects:');
    for (const aspect of chart.aspects.slice(0, 10)) {
      lines.push(`  ${aspect.planet1} ${aspect.type} ${aspect.planet2} (orb ${aspect.orb.toFixed(1)}°)`);
    }
  }

  if (chart?.houses?.length) {
    lines.push('\nHouses:');
    for (const house of chart.houses) {
      lines.push(`  House ${house.number}: ${house.sign} ${house.degree.toFixed(1)}°`);
    }
  }

  return lines.join('\n');
}

function formatRAGContext(memories: MemoryResult[]): string {
  if (!memories.length) return '';

  const lines = ['\n--- Past Conversation Memories ---'];
  for (const m of memories) {
    lines.push(`[${m.content_type}] ${m.content}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Smart Fallback Responses
// ---------------------------------------------------------------------------

const FALLBACK_RESPONSES: Record<string, string[]> = {
  love: [
    "Venus is weaving her golden threads through your chart right now, and I see beautiful potential in your romantic sphere ✨ The cosmos is inviting you to open your heart a little wider — not with reckless abandon, but with the quiet confidence of someone who knows they deserve deep, authentic love.\n\nPay attention to synchronicities this week, especially around conversations that feel unusually meaningful. The universe often speaks through seemingly ordinary moments. Trust that your heart already knows what your mind is still figuring out 🌙",
    "The stars reveal a fascinating dance between your desire for deep connection and your need for personal space 💫 This tension isn't a flaw — it's your soul's way of seeking a love that honors ALL of you, not just the parts that are easy to love.\n\nI sense a period of emotional clarity approaching. Whether you're in a relationship or seeking one, the cosmos is helping you understand what truly nourishes your heart versus what merely excites it. Both matter, but wisdom lies in knowing the difference ✨",
  ],
  career: [
    "I see powerful currents of ambition and creativity swirling in your chart right now ⚡ The cosmic energy is particularly supportive of bold moves — not impulsive ones, but those decisions you've been quietly building courage for.\n\nYour professional path isn't meant to be a straight line. The detours and unexpected turns? They're developing skills and perspectives you'll need for what's coming. Trust the process, even when it feels uncertain. The stars suggest that something you've been working toward is closer to fruition than you realize 🌟",
    "The celestial energies are highlighting your professional sphere in a magnificent way 🔮 There's a tension between playing it safe and taking a meaningful leap — and the cosmos is gently nudging you toward the brave choice.\n\nRemember that your unique perspective IS your superpower in your career. What feels obvious to you is brilliant to others. Don't dim your light to make others comfortable. The next few weeks are excellent for making your vision known and planting seeds for long-term growth ✨",
  ],
  general: [
    "I feel the cosmic winds shifting around you in the most beautiful way ✨ Right now, the universe is asking you to pay attention to what lights you up — not what you think SHOULD light you up, but what genuinely makes your soul sing.\n\nThis is a powerful time for self-discovery. The stars are illuminating parts of yourself you may have neglected or forgotten. Embrace this energy. Journal, meditate, take walks in nature — whatever helps you listen to your inner voice. The answers you're seeking are already within you; you just need the quiet to hear them 🌙",
    "The cosmic tapestry being woven around you right now is truly remarkable 🌟 I sense you're at one of those pivotal moments where small choices create big ripples. The universe isn't asking you to have everything figured out — it's asking you to take the next step with faith.\n\nThere's a beautiful alignment between your intuition and your circumstances right now. Trust those gut feelings, especially the ones that seem to defy logic. Your inner compass is finely tuned to the stars, and it's pointing you toward growth, connection, and purpose. Don't overthink it — feel it ✨",
    "The stars are holding space for you today in the most nurturing way 💫 I sense a period of transformation — not the dramatic, lightning-bolt kind, but the slow, beautiful unfolding of a flower. You're becoming more yourself with each passing day.\n\nWhat's calling to you right now? That quiet pull you feel toward something new or different isn't random — it's the cosmos guiding you toward your next chapter. The energy around you supports taking gentle but intentional steps forward. You don't need permission from anyone to grow 🌙",
  ],
  today: [
    "Today's cosmic weather is particularly interesting for you ☀️ The planetary alignments are creating a pocket of clarity — those foggy feelings that may have clouded recent days are starting to lift. Use this mental freshness to make decisions you've been putting off.\n\nThe afternoon brings a surge of creative energy. Whether that manifests as an actual creative project or simply a new way of looking at an old problem, lean into it. The stars are supporting innovative thinking and heart-centered solutions today ✨",
    "The celestial currents today are flowing in your favor, though they're asking for something in return: presence 🌙 The more you can stay grounded in this moment — rather than worrying about tomorrow or replaying yesterday — the more magic you'll notice unfolding around you.\n\nI see a potential for a meaningful interaction today, possibly with someone you don't expect. Stay open. The universe loves to surprise us when we're actually paying attention. Also, trust your energy levels — if you need rest, honor that. The stars respect those who respect their own rhythms ✨",
  ],
};

function detectTopic(message: string): string {
  const lower = message.toLowerCase();
  if (/love|relationship|partner|dating|romance|heart|soulmate|crush|ex\b/.test(lower)) return 'love';
  if (/career|job|work|professional|business|money|promotion|interview/.test(lower)) return 'career';
  if (/today|daily|morning|tonight|this week|right now/.test(lower)) return 'today';
  return 'general';
}

function getPersonalizedFallback(message: string, sunSign?: string | null, name?: string | null): string {
  const topic = detectTopic(message);
  const pool = FALLBACK_RESPONSES[topic] || FALLBACK_RESPONSES.general;
  const response = pool[Math.floor(Math.random() * pool.length)];

  // Personalize with sun sign if available
  let personalized = response;
  if (sunSign) {
    const signInserts: Record<string, string> = {
      Aries: 'With your fiery Aries energy',
      Taurus: 'With your grounded Taurus nature',
      Gemini: 'With your curious Gemini spirit',
      Cancer: 'With your nurturing Cancer heart',
      Leo: 'With your radiant Leo presence',
      Virgo: 'With your discerning Virgo mind',
      Libra: 'With your harmonious Libra grace',
      Scorpio: 'With your transformative Scorpio depth',
      Sagittarius: 'With your adventurous Sagittarius fire',
      Capricorn: 'With your determined Capricorn ambition',
      Aquarius: 'With your visionary Aquarius spirit',
      Pisces: 'With your intuitive Pisces wisdom',
    };
    const insert = signInserts[sunSign];
    if (insert) {
      // Add sign reference at the start of the second paragraph
      const paragraphs = personalized.split('\n\n');
      if (paragraphs.length > 1) {
        paragraphs[1] = `${insert}, ${paragraphs[1].charAt(0).toLowerCase()}${paragraphs[1].slice(1)}`;
        personalized = paragraphs.join('\n\n');
      }
    }
  }

  if (name) {
    // Occasionally prefix with the name
    if (Math.random() > 0.5) {
      personalized = `${name}, ${personalized.charAt(0).toLowerCase()}${personalized.slice(1)}`;
    }
  }

  return personalized;
}

// ---------------------------------------------------------------------------
// Build Chat System Prompt
// ---------------------------------------------------------------------------

function buildChatSystemPrompt(sunSign?: string | null, birthDate?: string | null): string {
  const signStr = sunSign || 'a beautiful soul';
  const dateStr = birthDate || 'a date the stars remember well';
  return `You are VEYa, a warm, wise AI astrologer. You combine deep astrological knowledge with genuine care. You know the user's birth chart: Sun in ${signStr}, born on ${dateStr}. Speak with warmth, use cosmic metaphors naturally, and provide personalized guidance. Keep responses concise (2-3 paragraphs max). Never be cold or robotic.`;
}

// ---------------------------------------------------------------------------
// 1. generateDailyReading
// ---------------------------------------------------------------------------

export async function generateDailyReading(
  userProfile: UserProfile,
  chartData?: BirthChart | null,
): Promise<DailyReadingAIResponse> {
  const chartContext = formatChartContext(userProfile, chartData);
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${VEYA_SYSTEM_PROMPT}\n\n${DAILY_READING_PROMPT}`,
    },
    {
      role: 'user',
      content: `Today's date: ${today}\n\nUser's chart data:\n${chartContext}\n\nGenerate today's personalized daily reading.`,
    },
  ];

  // Try Edge Function first (keeps API keys off client)
  try {
    const edgePayload = await invokeEdgeFunction<DailyReadingAIResponse>(
      'generate-reading',
      { userProfile, chartData },
    );

    return {
      reading_text: edgePayload.reading_text || 'Your cosmic briefing is being prepared...',
      energy_level: Math.min(10, Math.max(1, edgePayload.energy_level || 5)),
      do_guidance: edgePayload.do_guidance || 'Follow your intuition today.',
      dont_guidance: edgePayload.dont_guidance || 'Avoid overthinking.',
      transit_highlights: Array.isArray(edgePayload.transit_highlights)
        ? edgePayload.transit_highlights
        : [],
    };
  } catch (err) {
    console.warn('[AI] Edge function generate-reading failed, using direct OpenAI:', err instanceof Error ? err.message : err);
  }

  const data = await openAIFetch<{
    choices: Array<{ message: { content: string } }>;
  }>('/chat/completions', {
    model: MODELS.free,
    messages,
    temperature: 0.7,
    max_tokens: 1200,
  });

  const raw = data.choices[0]?.message?.content ?? '';

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as DailyReadingAIResponse;

    return {
      reading_text: parsed.reading_text || 'Your cosmic briefing is being prepared...',
      energy_level: Math.min(10, Math.max(1, parsed.energy_level || 5)),
      do_guidance: parsed.do_guidance || 'Follow your intuition today.',
      dont_guidance: parsed.dont_guidance || 'Avoid overthinking.',
      transit_highlights: Array.isArray(parsed.transit_highlights)
        ? parsed.transit_highlights
        : [],
    };
  } catch {
    return {
      reading_text: raw,
      energy_level: 5,
      do_guidance: 'Follow your intuition today.',
      dont_guidance: 'Avoid overthinking.',
      transit_highlights: [],
    };
  }
}

// ---------------------------------------------------------------------------
// 2. chatWithVeya — OpenAI with smart fallback
// ---------------------------------------------------------------------------

export async function chatWithVeya(
  message: string,
  conversationHistory: ChatMessage[],
  userProfile: UserProfile,
  ragContext: MemoryResult[] = [],
  isPremium: boolean = false,
  isVoiceMode: boolean = false,
): Promise<string> {
  // Build system prompt with user birth data
  const personalSystemPrompt = buildChatSystemPrompt(
    userProfile.sun_sign,
    userProfile.birth_date,
  );

  const chartContext = formatChartContext(userProfile);
  const ragContextStr = formatRAGContext(ragContext);

  const systemContent = [
    personalSystemPrompt,
    isVoiceMode ? VEYA_VOICE_PROMPT : null,
    '\n--- User Chart Context ---',
    chartContext,
    ragContextStr,
  ]
    .filter(Boolean)
    .join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: systemContent },
    ...conversationHistory.slice(-20),
    { role: 'user', content: message },
  ];

  const model = isPremium ? MODELS.premium : MODELS.free;

  // Try Edge Function first (keeps API keys off client)
  try {
    const edgeData = await invokeEdgeFunction<{ reply: string }>('chat', {
      message,
      conversationHistory,
      userProfile,
      ragContext,
      isPremium,
      chartData: null,
    });
    if (edgeData?.reply) return edgeData.reply;
  } catch (err) {
    console.warn('[AI] Edge function chat failed, using direct OpenAI:', err instanceof Error ? err.message : err);
  }

  // Fallback to OpenAI directly
  try {
    const data = await openAIFetch<{
      choices: Array<{ message: { content: string } }>;
    }>('/chat/completions', {
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = data.choices[0]?.message?.content;
    if (reply) return reply;
  } catch (err) {
    console.warn('[AI] OpenAI failed, using smart fallback:', err instanceof Error ? err.message : err);
  }

  // Fallback: high-quality personalized mock response
  // Add a small delay to feel natural
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));
  return getPersonalizedFallback(message, userProfile.sun_sign, userProfile.name);
}

// ---------------------------------------------------------------------------
// 3. generateCompatibility
// ---------------------------------------------------------------------------

export async function generateCompatibility(
  user1Profile: UserProfile,
  user2BirthData: {
    name?: string;
    sun_sign?: string;
    moon_sign?: string;
    rising_sign?: string;
    planets?: BirthChart['planets'];
  },
  user1Chart?: BirthChart | null,
): Promise<CompatibilityReport> {
  const user1Context = formatChartContext(user1Profile, user1Chart);

  const user2Lines: string[] = [];
  if (user2BirthData.name) user2Lines.push(`Name: ${user2BirthData.name}`);
  if (user2BirthData.sun_sign) user2Lines.push(`Sun sign: ${user2BirthData.sun_sign}`);
  if (user2BirthData.moon_sign) user2Lines.push(`Moon sign: ${user2BirthData.moon_sign}`);
  if (user2BirthData.rising_sign) user2Lines.push(`Rising sign: ${user2BirthData.rising_sign}`);
  if (user2BirthData.planets) {
    user2Lines.push('\nPlanet placements:');
    for (const [planet, placement] of Object.entries(user2BirthData.planets)) {
      if (placement) {
        user2Lines.push(`  ${planet}: ${placement.sign} ${placement.degree.toFixed(1)}°`);
      }
    }
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${VEYA_SYSTEM_PROMPT}\n\n${COMPATIBILITY_PROMPT}`,
    },
    {
      role: 'user',
      content: `Person 1 (the user):\n${user1Context}\n\nPerson 2:\n${user2Lines.join('\n')}\n\nGenerate the compatibility analysis.`,
    },
  ];

  const data = await openAIFetch<{
    choices: Array<{ message: { content: string } }>;
  }>('/chat/completions', {
    model: MODELS.premium,
    messages,
    temperature: 0.7,
    max_tokens: 1500,
  });

  const raw = data.choices[0]?.message?.content ?? '';

  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as CompatibilityReport;
  } catch {
    return {
      overall_score: 65,
      dimensions: {
        communication: { score: 65, summary: 'Analysis unavailable — try again.' },
        emotional: { score: 65, summary: 'Analysis unavailable — try again.' },
        passion: { score: 65, summary: 'Analysis unavailable — try again.' },
        growth: { score: 65, summary: 'Analysis unavailable — try again.' },
        conflict: { score: 65, summary: 'Analysis unavailable — try again.' },
        longterm: { score: 65, summary: 'Analysis unavailable — try again.' },
      },
      narrative: raw || 'The stars need a moment — please try again.',
      strengths: [],
      challenges: [],
      advice: 'Please try generating this report again.',
    };
  }
}

// ---------------------------------------------------------------------------
// 4. generateEmbedding
// ---------------------------------------------------------------------------

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error('Cannot generate embedding for empty text');
  }

  // Try Edge Function first (keeps API keys off client)
  try {
    const edgeData = await invokeEdgeFunction<{ embedding: number[] }>('generate-embedding', { text });
    if (edgeData?.embedding?.length) return edgeData.embedding;
  } catch (err) {
    console.warn('[AI] Edge function generate-embedding failed, using direct OpenAI:', err instanceof Error ? err.message : err);
  }

  const data = await openAIFetch<{
    data: Array<{ embedding: number[] }>;
  }>('/embeddings', {
    model: MODELS.embedding,
    input: text.slice(0, 8000),
  });

  const embedding = data.data?.[0]?.embedding;
  if (!embedding?.length) {
    throw new Error('No embedding returned from OpenAI');
  }

  return embedding;
}

// ---------------------------------------------------------------------------
// 5. searchMemories
// ---------------------------------------------------------------------------

export async function searchMemories(
  queryEmbedding: number[],
  userId: string,
  limit: number = 5,
): Promise<MemoryResult[]> {
  const { data, error } = await supabase.rpc('match_user_embeddings', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_count: limit,
    match_threshold: 0.7,
  });

  if (error) {
    console.error('[AI] searchMemories error:', error.message);
    return [];
  }

  return (data ?? []) as MemoryResult[];
}
