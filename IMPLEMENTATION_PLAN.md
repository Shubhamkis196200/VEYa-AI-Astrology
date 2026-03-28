# VEYa Implementation Plan — Sprint 1 (Updated 2026-03-28)

> Based on: DEEP_AUDIT_2026.md (2026-03-28)
> Goal: Make every feature work with real data. Zero mock data in production.
> Total effort estimate: ~3 days of focused development

---

## Sprint Goal

Fix all P0 blockers, replace mock data with real data, and ensure every feature shows the actual user's information. After this sprint, VEYa should be fully personalized for any user — not just "Aria with Scorpio Sun."

---

## Sprint 1 — Week 1: Critical Fixes

### Task 1: Fix Supabase Database Types (2-3 hours)

**Problem**: `src/types/index.ts` has incorrect Database interface — tables are typed as `never` which blocks all Supabase writes across 7 files (22 TypeScript errors total).

**Files**: `src/types/index.ts`

**Steps**:
1. Run `npx supabase gen types typescript --project-id fdivwigdptmrrabpwfyi > src/types/supabase.ts`
2. Update `src/types/index.ts` to import and re-export the generated `Database` type
3. Verify `import type { Database } from '../types'` in `src/lib/supabase.ts` resolves correctly
4. Run `npx tsc --noEmit` — should drop from 22 errors to ~5

**Alternative** (if Supabase CLI unavailable): Manually write the table interfaces based on what the services insert:
```typescript
// Tables needed in Database['public']['Tables']:
// user_profiles.Row: { id, user_id, display_name, birth_date, birth_time, birth_time_precision, ... }
// birth_charts.Row: { id, user_id, house_system, sun_sign, moon_sign, rising_sign, chart_data }
// daily_readings.Row: { id, user_id, reading_date, sun_sign, reading_text, energy_level, ... }
// streaks.Row: { id, user_id, streak_type, current_streak, longest_streak, total_check_ins, last_check_in }
// user_embeddings.Row: { id, user_id, content, embedding, content_type, metadata }
// ai_conversations.Row: { id, user_id, session_id, role, content, model, tokens_used }
```

**Success criteria**: `npx tsc --noEmit` no longer shows `never` errors in service files.

---

### Task 2: Fix Sign Out — Critical UX Gap (30 minutes)

**Problem**: Sign Out button in `app/(tabs)/you.tsx:675` only fires haptic feedback — no actual logout.

**File**: `app/(tabs)/you.tsx`

**Add import** at top of file:
```typescript
import { supabase } from '@/lib/supabase';
```

**Fix line ~675**:
```typescript
// BEFORE:
<Pressable onPress={() => hapticMedium()} style={styles.signOutButton}>

// AFTER:
<Pressable
  onPress={async () => {
    await hapticMedium();
    try {
      await supabase.auth.signOut();
    } catch { /* silent fail if not authenticated */ }
    useOnboardingStore.getState().resetOnboarding();
    router.replace('/(auth)/welcome');
  }}
  style={styles.signOutButton}
>
```

**Success criteria**: Pressing "Sign Out" navigates to welcome screen, clears user data.

---

### Task 3: Replace Mock UserName in Rituals Tab (30 minutes)

**Problem**: `app/(tabs)/rituals.tsx:199` has `userName: 'Aria'` and `streakCount: 7` hardcoded.

**File**: `app/(tabs)/rituals.tsx`

In the main `RitualsScreen` export function, add store access and pass to `buildMockData`:
```typescript
// Add near top of RitualsScreen:
const { data: onboardingData } = useOnboardingStore();
const { currentStreak } = useStreakStore();

// Update buildMockData call to pass real values:
const mock = buildMockData(realRitual, onboardingData.name, currentStreak);

// Update buildMockData signature:
function buildMockData(realRitual: RealRitualContent, userName: string, currentStreak: number) {
  return {
    userName: userName || 'Star Child',
    streakCount: currentStreak,
    // ... rest stays same
  };
}
```

**Success criteria**: Rituals tab shows logged-in user's real name.

---

### Task 4: Replace Mock Stats in You Tab (1 hour)

**Problem**: `app/(tabs)/you.tsx:118-125` has `MOCK_COSMIC.stats` with hardcoded numbers (12/8/3/7).

**File**: `app/(tabs)/you.tsx`

**Fix `CosmicStatsCard()` component**:
```typescript
function CosmicStatsCard() {
  const entries = useJournalStore((s) => s.entries);
  const { currentStreak } = useStreakStore();

  const stats = [
    { id: 'readings', label: 'Readings', value: '1', icon: '📖' },
    { id: 'journal', label: 'Journal entries', value: String(entries.length), icon: '✍️' },
    { id: 'tarot', label: 'Tarot pulls', value: '–', icon: '🃏' },
    { id: 'streak', label: 'Day streak', value: String(currentStreak), icon: '🔥' },
    { id: 'topic', label: 'Favorite topic', value: 'Love', icon: '💕' },
    { id: 'active', label: 'Most active', value: 'Mornings', icon: '☀️' },
  ];
  // ... render stats array
}
```

**Success criteria**: Journal count and streak are live numbers from stores.

---

### Task 5: Fix Transit Calendar — Show Real Current Month (2-3 hours)

**Problem**: `app/(tabs)/discover.tsx:199-218` uses `MOCK.transitCalendar` with hardcoded "February 2026" and fake planetary events.

**File**: `app/(tabs)/discover.tsx`

**Approach**:
```typescript
// Add state for real calendar data:
const [monthEvents, setMonthEvents] = useState<MonthEvent[]>([]);
const [selectedDate, setSelectedDate] = useState<number>(new Date().getDate());

useEffect(() => {
  const events = getMonthEvents(new Date());
  setMonthEvents(events);
}, []);

// Build calendar from real events:
const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

const calendarDays = Array.from({ length: daysInMonth }, (_, i) => {
  const dayEvents = monthEvents.filter(e => new Date(e.date).getDate() === i + 1);
  return {
    date: i + 1,
    transits: dayEvents.map(e => e.type || 'opportunity'),
  };
});
```

**Success criteria**: Calendar shows current month + year with real planetary event dots.

---

### Task 6: Fix Planet Interpretations in FullChartModal (1-2 hours)

**Problem**: `app/(tabs)/discover.tsx:453-464` has hardcoded interpretations for "Your Scorpio Sun", "Your Pisces Moon" etc — shown to ALL users regardless of their actual chart.

**File**: `app/(tabs)/discover.tsx`

**Replace the hardcoded object** with a dynamic function:
```typescript
function getPlanetInterpretation(planetName: string, degree: number): string {
  const signIndex = Math.floor(((degree % 360) + 360) % 360 / 30);
  const sign = ZODIAC_SIGNS[signIndex]?.name || 'Unknown';

  const templates: Record<string, string> = {
    Sun: `Your ${sign} Sun reveals`,
    Moon: `Your ${sign} Moon brings`,
    Mercury: `Mercury in ${sign} gives your mind`,
    Venus: `Venus in ${sign} shapes how you love`,
    Mars: `Mars in ${sign} channels your energy`,
    Jupiter: `Jupiter in ${sign} expands your`,
    Saturn: `Saturn in ${sign} teaches you`,
    Uranus: `Uranus in ${sign} revolutionizes your`,
    Neptune: `Neptune in ${sign} deepens your`,
    Pluto: `Pluto in ${sign} transforms your`,
  };

  return `${templates[planetName] || `${planetName} in ${sign}`} — tap Chat to ask VEYa what this means for you personally.`;
}
```

**Success criteria**: Planet taps show sign-correct interpretations for any user's chart.

---

### Task 7: Fix TypeScript Errors in Rituals (15 minutes)

**Problem**: `app/(tabs)/rituals.tsx:633,711,712` — comparison of `'ready'` with `'complete'` and `'locked'` has no overlap.

**File**: `app/(tabs)/rituals.tsx`

Find the status comparisons and fix the union type:
```typescript
// Find and update the ritual status type:
type RitualStatus = 'ready' | 'complete' | 'locked' | 'in_progress';

// OR: if evening ritual is always 'ready', simplify the comparisons:
// Remove checks for 'complete' and 'locked' if they're never used
```

---

### Task 8: Fix VoicePortal onTranscript Prop (15 minutes)

**Problem**: `src/components/voice/VoicePortal.tsx:62` passes `onTranscript` prop that doesn't exist in `VoiceInterfaceProps`.

**Files**: `src/components/voice/VoicePortal.tsx`, `src/components/voice/VoiceInterface.tsx`

**Option A**: Add the prop to VoiceInterface:
```typescript
// In VoiceInterface.tsx props:
interface VoiceInterfaceProps {
  onClose: () => void;
  onTranscript?: (text: string) => void;  // Add this
}
```

**Option B**: Remove `onTranscript` from VoicePortal if unused.

---

### Task 9: Fix SmartNotifications TypeScript (30 minutes)

**Problem**: `src/services/smartNotifications.ts:56,246` — Expo Notifications API v0.28+ changed.

**File**: `src/services/smartNotifications.ts`

```typescript
// Line 56: Add missing fields
handleNotification: async () => ({
  shouldShowAlert: true,
  shouldPlaySound: true,
  shouldSetBadge: true,
  shouldShowBanner: true,   // Add
  shouldShowList: true,     // Add
}),

// Line 246: Add type field
trigger: {
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date: scheduledTime,
  channelId: Platform.OS === 'android' ? 'veya-daily' : undefined,
}
```

---

## Sprint 2 — Week 2: Feature Polish

### Task 10: Persist Settings (1 hour)

Create `src/stores/settingsStore.ts`:
```typescript
interface SettingsStore {
  notificationsEnabled: boolean;
  houseSystem: 'placidus' | 'whole-sign';
  autoSpeak: boolean;
  // setters...
}
// Persist with AsyncStorage
```
Update `you.tsx` SettingsSection to use this store instead of local state.

---

### Task 11: Add Tarot Pull Counter (30 minutes)

Add `tarotPullCount` to `src/stores/achievementStore.ts` or create `usageStore.ts`. Call increment when user flips a tarot card in discover.tsx. Surface in You tab stats.

---

### Task 12: Wire Real Streak Days to Rituals Visual (1 hour)

The streak dots `[true, true, true, true, true, true, false]` are hardcoded. Compute from `lastCheckIn` date to show which days this week the user checked in.

---

### Task 13: RAG Memory Visibility (2 hours)

Add a "VEYa Remembers" section to You tab showing the most recent RAG memories stored for this user. Surfaces the value of the memory system to users.

---

### Task 14: Upgrade Daily Reading to AI-Powered (Sprint 2+)

`readingStore.fetchTodayReading()` already calls OpenAI via `dailyReading.ts` — wire it to be called for real users (currently only `ensureGeneratedReading()` is called in index.tsx, which is offline-only). For premium users, call `fetchTodayReading()` additionally.

---

## Effort Summary

| Priority | Tasks | Estimated Time |
|----------|-------|----------------|
| P0 (must fix) | Tasks 1-6 | ~6-8 hours |
| P1 (should fix) | Tasks 7-9 | ~1 hour |
| P2 (nice to have) | Tasks 10-14 | ~5-6 hours |
| **Sprint 1 Total** | **Tasks 1-9** | **~8-10 hours** |

---

## Success Criteria Checklist

After Sprint 1, all these should pass:

- [ ] `npx tsc --noEmit` shows ≤5 errors (down from 22)
- [ ] Today tab shows real user name
- [ ] Rituals tab shows real user name (not "Aria")
- [ ] You tab streak counter matches real streak data
- [ ] You tab journal count shows real entry count
- [ ] Transit calendar shows current month + year with real events
- [ ] Birth chart planet interpretations are sign-correct for any user
- [ ] Sign Out button logs user out and navigates to welcome screen
- [ ] No hardcoded "Aria", "Marcus", or "February 2026" visible in app UI

---

## File Change Summary

| File | Sprint | Changes |
|------|--------|---------|
| `src/types/index.ts` | 1 | Regenerate/fix Database interface |
| `app/(tabs)/you.tsx` | 1 | Fix sign out, replace mock stats |
| `app/(tabs)/rituals.tsx` | 1 | Replace userName + streakCount mock, fix status types |
| `app/(tabs)/discover.tsx` | 1 | Fix transit calendar, planet interpretations, partial UserProfile |
| `src/components/voice/VoicePortal.tsx` | 1 | Fix onTranscript prop |
| `src/services/smartNotifications.ts` | 1 | Fix Expo Notifications API |
| `src/stores/settingsStore.ts` | 2 | New: persist settings |
| `src/stores/usageStore.ts` | 2 | New: tarot pull counter |

---

## Quick Wins (< 15 min each, do these first)

1. `you.tsx:675` — Sign out: Add `supabase.auth.signOut()` + router.replace
2. `rituals.tsx:199` — Replace `'Aria'` with `onboardingData.name || 'Star Child'`
3. `rituals.tsx:200` — Replace `streakCount: 7` with `currentStreak` from `useStreakStore()`
4. `you.tsx` `CosmicStatsCard` — Replace journal count and streak with real values
5. `discover.tsx:443` — Add missing UserProfile fields to fix TS error

**These 5 quick wins take ~45 minutes total and fix the most visible user-facing issues.**
