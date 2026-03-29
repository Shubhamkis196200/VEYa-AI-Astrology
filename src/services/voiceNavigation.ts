// ============================================================================
// VEYa Voice Navigation — Maps speech to app actions
// User-isolated: all context uses caller's data only. No global/shared state.
// ============================================================================

import { router } from 'expo-router';

export type VoiceAction =
  | { type: 'navigate'; screen: string; params?: Record<string, string> }
  | { type: 'answer'; question: string }
  | { type: 'open_tarot' }
  | { type: 'open_compatibility'; sign?: string }
  | { type: 'open_chart' }
  | { type: 'open_moon' }
  | { type: 'open_transits' }
  | { type: 'start_ritual'; time?: 'morning' | 'evening' }
  | { type: 'open_journal' }
  | { type: 'open_chat' }
  | { type: 'go_home' }
  | { type: 'unknown' };

// ---------------------------------------------------------------------------
// Navigation pattern map
// ---------------------------------------------------------------------------

const NAV_PATTERNS: Array<{ patterns: string[]; action: VoiceAction }> = [
  {
    patterns: ['birth chart', 'natal chart', 'my chart', 'show chart', 'open chart', 'view chart'],
    action: { type: 'open_chart' },
  },
  {
    patterns: ['tarot', 'pull a card', 'draw a card', 'daily card', 'card reading', 'pull card'],
    action: { type: 'open_tarot' },
  },
  {
    patterns: ['moon phase', 'moon tracker', 'lunar', 'current moon', 'show moon'],
    action: { type: 'open_moon' },
  },
  {
    patterns: ['transit', 'planets today', 'planetary', 'planet positions'],
    action: { type: 'open_transits' },
  },
  {
    patterns: ['morning ritual', 'morning practice', 'start my morning', 'morning routine'],
    action: { type: 'start_ritual', time: 'morning' },
  },
  {
    patterns: ['evening ritual', 'evening practice', 'wind down', 'night ritual', 'evening routine'],
    action: { type: 'start_ritual', time: 'evening' },
  },
  {
    patterns: ['ritual', 'daily ritual', 'my ritual', 'start ritual'],
    action: { type: 'start_ritual' },
  },
  {
    patterns: ['journal', 'write in journal', 'journal entry', 'open journal'],
    action: { type: 'open_journal' },
  },
  {
    patterns: ['go to chat', 'open chat', 'message veya', 'text mode', 'type to veya'],
    action: { type: 'open_chat' },
  },
  {
    patterns: ['go home', 'main screen', 'today tab', 'home screen', 'go back home'],
    action: { type: 'go_home' },
  },
];

const ZODIAC_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

// ---------------------------------------------------------------------------
// Parse intent from transcript
// ---------------------------------------------------------------------------

export function parseVoiceIntent(transcript: string): VoiceAction {
  const lower = transcript.toLowerCase().trim();

  // Compatibility check — detect before nav patterns to avoid false positives
  if (
    lower.includes('compat') ||
    lower.includes('match') ||
    lower.includes('synastry') ||
    lower.includes('chemistry with') ||
    lower.includes('good with')
  ) {
    const foundSign = ZODIAC_SIGNS.find((s) => lower.includes(s));
    return { type: 'open_compatibility', sign: foundSign };
  }

  // Check nav patterns
  for (const { patterns, action } of NAV_PATTERNS) {
    if (patterns.some((p) => lower.includes(p))) {
      return action;
    }
  }

  // Default: conversational answer
  return { type: 'answer', question: transcript };
}

// ---------------------------------------------------------------------------
// Execute a navigation action — returns true if navigation happened
// ---------------------------------------------------------------------------

export function executeVoiceAction(action: VoiceAction): boolean {
  switch (action.type) {
    case 'open_chart':
    case 'open_tarot':
    case 'open_moon':
    case 'open_transits':
    case 'open_compatibility':
      router.push('/(tabs)/discover');
      return true;
    case 'start_ritual':
    case 'open_journal':
      router.push('/(tabs)/rituals');
      return true;
    case 'open_chat':
      router.push('/(tabs)/chat');
      return true;
    case 'go_home':
      router.push('/(tabs)/');
      return true;
    case 'navigate':
      if (action.screen) {
        router.push(action.screen as Parameters<typeof router.push>[0]);
        return true;
      }
      return false;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Get a short spoken response for navigation actions
// ---------------------------------------------------------------------------

export function getNavigationResponse(action: VoiceAction, userName: string): string {
  const name = userName || 'friend';
  switch (action.type) {
    case 'open_chart':
      return `Opening your birth chart, ${name}.`;
    case 'open_tarot':
      return `Let's pull your tarot card.`;
    case 'open_moon':
      return `Here's the current moon phase.`;
    case 'open_transits':
      return `Showing planetary transits.`;
    case 'open_compatibility':
      return action.sign
        ? `Checking your compatibility with ${action.sign}.`
        : `Opening compatibility.`;
    case 'start_ritual':
      return `Starting your ${action.time || 'daily'} ritual.`;
    case 'open_journal':
      return `Opening your journal.`;
    case 'open_chat':
      return `Switching to chat mode.`;
    case 'go_home':
      return `Taking you home.`;
    default:
      return '';
  }
}
