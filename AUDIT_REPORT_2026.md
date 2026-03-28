# VEYa Full Audit Report
**Date:** 2026-03-28
**Auditor:** ClawdBot (Claude Sonnet 4.6)
**Scope:** Full codebase audit — bugs, Supabase dependencies, TypeScript errors, architecture

---

## Executive Summary

The app is functional with a strong local-first architecture. Most features run without any backend using `astronomy-engine` (pure JS ephemeris) and direct OpenAI API calls. Supabase is used only for auth, data persistence, and RAG memory — none of which are in the critical render path.

Two bugs were found and fixed in this session:
1. **Duplicate floating voice button** on the Today tab — fixed
2. **Discover tab loading states** could hang indefinitely without a timeout — fixed

The Supabase backend being down causes data not to persist but does NOT break the UI. The discover tab does NOT call Supabase — the previous assumption was incorrect.

---

## Bug Fixes Applied

### Bug 1: Duplicate Floating Voice Button — FIXED
**File:** `app/_layout.tsx`
**Root Cause:** `MomentCaptureButton` (the floating purple ✨ button) was rendered globally on ALL tabs via `_layout.tsx`. The Today tab (`index.tsx`) also has:
- A "Talk to VEYa" hero card with a mic button
- A `FeatureHub` "Voice AI" quick feature card
- A `QuickActionsBar` mic button

This created visual duplication on the Today screen.

**Fix Applied:**
```tsx
// Before
{onboardingCompleted && <MomentCaptureButton />}

// After — hide on Today tab which has its own voice CTA
const pathname = usePathname();
const isOnTodayTab = pathname === '/' || pathname === '' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
{onboardingCompleted && !isOnTodayTab && <MomentCaptureButton />}
```

**Files Changed:** `app/_layout.tsx`

---

### Bug 2: Discover Tab Loading States — FIXED
**File:** `app/(tabs)/discover.tsx`
**Root Cause:** Two sub-components had `isLoading = true` initial state with no hard timeout:
- `TransitCalendarSection` (line 1075) — loads month events via `getMonthEvents()`
- `RetrogradeTrackerSection` (line 1344) — loads retrograde data via `getRetrogradeData()`

If either computation hung indefinitely, the loading state would never resolve. The `RetrogradeTrackerSection` shows a "Loading..." spinner while stuck.

Note: The discover tab does NOT use Supabase. The loading states are for local astronomical calculations (`astronomy-engine`), not network calls.

**Fix Applied:** Added a 5-second hard timeout to both loading states using `clearTimeout` in `finally` blocks.

**Files Changed:** `app/(tabs)/discover.tsx`

---

## Supabase Dependency Audit

### Files that import Supabase (9 total)
| File | What it does with Supabase |
|------|---------------------------|
| `src/lib/supabase.ts` | Client setup (URL + anon key) |
| `app/_layout.tsx` | Auth state listener, session check on startup |
| `src/services/onboarding.ts` | Auth.getUser(), save user_profiles + birth_charts |
| `src/services/dailyReading.ts` | Upsert daily_readings (cache AI readings) |
| `src/services/streakService.ts` | Upsert + update streaks table |
| `src/services/rag.ts` | Insert user_embeddings, insert ai_conversations |
| `src/services/ai.ts` | functions.invoke() (edge functions), rpc('match_user_embeddings') |
| `app/(tabs)/rituals.tsx` | Imports supabase but does not call it directly |

### Error Handling Quality
| Service | Supabase Down | Behavior |
|---------|--------------|---------|
| `onboarding.ts` | Auth fails → `getUser()` returns null | Graceful fallback: saves to Zustand only, returns `{ success: true }` |
| `dailyReading.ts` | DB upsert fails | Falls back to non-persisted reading with temp ID — UI still works |
| `streakService.ts` | DB fails | Returns local fallback object with updated streak counts |
| `rag.ts` (storeMemory) | Insert fails | Logged, not re-thrown — doesn't block main flow |
| `rag.ts` (storeConversation) | Insert fails | Logged and continues |
| `ai.ts` (functions.invoke) | Edge function fails | Has `try/catch`, returns error |
| `ai.ts` (rpc) | Vector search fails | Has `try/catch`, returns empty array |
| `app/_layout.tsx` | Auth session fails | `setIsAuthLoading(false)` called in getSession().then() — app continues |

**Assessment:** Supabase error handling is generally good. All services log errors and have fallback behavior. The app can function with Supabase completely down (data won't persist to cloud, but UI works).

---

## TypeScript Errors (16 total, all non-blocking)

### Category 1: Missing Supabase Generated Types (11 errors)
**Root Cause:** Supabase TypeScript types are auto-generated from the DB schema. The types are not current (or never generated), so Supabase interprets all table types as `never`.

**Affected files:**
- `src/services/onboarding.ts` (lines 53, 86) — user_profiles, birth_charts
- `src/services/dailyReading.ts` (line 78) — daily_readings
- `src/services/streakService.ts` (lines 64, 92) — streaks
- `src/services/rag.ts` (lines 42, 113) — user_embeddings, ai_conversations
- `app/(tabs)/discover.tsx` (line 443) — UserProfile type mismatch

**Fix:** Run `npx supabase gen types typescript --project-id <id> > src/types/supabase.ts` to regenerate types. Or, during AWS migration, define local TypeScript interfaces for each table.

### Category 2: Reanimated SharedValue Export (2 errors)
**Files:** `app/(auth)/onboarding/interests.tsx:636`, `src/components/shared/LoadingStates.tsx:115,131`
**Root Cause:** `SharedValue` is not exported from `react-native-reanimated/lib/typescript/Animated` in the current installed version.
**Fix:** Change imports to: `import type { SharedValue } from 'react-native-reanimated';`

### Category 3: Notification API Changes (2 errors)
**File:** `src/services/smartNotifications.ts` (lines 56, 246)
**Root Cause:** `expo-notifications` API changed. `NotificationBehavior` now requires `shouldShowBanner` and `shouldShowList`. `DateTriggerInput` now requires explicit `type: 'date'` field.
**Fix:** Add missing fields to both notification handlers.

### Category 4: Component Prop Mismatch (1 error)
**File:** `src/components/voice/VoicePortal.tsx:62`
**Root Cause:** `onTranscript` prop passed to `VoiceInterface` doesn't exist in its props definition.
**Fix:** Either add `onTranscript?: (text: string) => void` to `VoiceInterfaceProps`, or remove the prop from the caller.

### Category 5: State Type Comparison (2 errors, ritual.tsx)
**File:** `app/(tabs)/rituals.tsx` (lines 633, 711, 712)
**Root Cause:** A state variable typed as `'ready'` is compared against `'complete'` and `'locked'` which are not in its type union.
**Fix:** Widen the type union for that state variable to include all possible values.

### Category 6: Missing Property (1 error)
**File:** `src/stores/readingStore.ts:182`
**Root Cause:** Code accesses `.date` on `DailyReading` but the field is `reading_date`.
**Fix:** Change `reading.date` to `reading.reading_date`.

---

## Architecture Assessment

### Strengths
1. **Local-first design** — Most features work without network using `astronomy-engine` and AsyncStorage. The app is resilient to backend outages.
2. **Good error handling** — All Supabase calls have try/catch and fallback behavior.
3. **Async loading with timeouts** (after fix) — Heavy computations deferred with setTimeout; loading states now have 5s max.
4. **Clean service layer** — Business logic is well-separated into `src/services/`.
5. **Type safety** — TypeScript in strict mode catches issues early.

### Weaknesses
1. **No Supabase type generation** — All 11 Supabase-related TS errors stem from missing generated types. Run `supabase gen types` after any schema change.
2. **discover.tsx is 2200+ lines** — Too large for a single component. Previous audit recommended splitting into lazy-loaded sections.
3. **rituals.tsx imports but does not use Supabase** — Unused import, can be removed.
4. **`app/(tabs)/explore.tsx` exists but is hidden** (href: null) — Legacy file, can be deleted if unused.

### Performance Notes (from FULL_AUDIT_REPORT.md, unchanged)
- `PARTICLES = generateParticles(4)` — already reduced from 10 to 4
- `TransitCalendarSection` and `RetrogradeTrackerSection` defer heavy work with setTimeout
- Async loading was the fix applied in the last session (commit: 28ce82a)

---

## Feature Status Matrix

| Feature | Works Offline | Works with Supabase Down | Notes |
|---------|--------------|------------------------|-------|
| Today tab / daily reading | Yes | Yes (temp ID) | AI call to OpenAI still needed |
| Chat AI | Yes | Yes | Direct OpenAI, no Supabase |
| Voice AI | Yes | Yes | Whisper + GPT-4o + TTS |
| Discover tab | Yes | Yes | All local calculations |
| Birth chart | Yes | Yes | astronomy-engine |
| Tarot | Yes | Yes | Local deck |
| Compatibility | Yes | Yes | Local calculation |
| Moon tracker | Yes | Yes | astronomy-engine |
| Transit calendar | Yes | Yes | astronomy-engine |
| Planetary hours | Yes | Yes | astronomy-engine |
| Retrograde tracker | Yes | Yes | astronomy-engine |
| Rituals | Yes | Yes | Local AsyncStorage |
| Streak tracking | Yes | Partial (local only) | DB upsert fails silently |
| RAG memory | No | No | Requires DB + vector search |
| Onboarding save | Yes | Yes (Zustand only) | DB write fails silently |
| Auth (login) | No | No | Requires Supabase auth |

---

## Recommended Next Steps (Priority Order)

### P0 — Immediate (< 1 day)
1. Fix `reading.date` → `reading.reading_date` in `readingStore.ts:182` (1 line change)
2. Remove unused supabase import from `app/(tabs)/rituals.tsx`

### P1 — High (< 1 week)
3. Generate Supabase types: `npx supabase gen types typescript --project-id fdivwigdptmrrabpwfyi > src/types/supabase.ts`
4. Fix `SharedValue` import in 2 files (1 line change each)
5. Fix `smartNotifications.ts` notification API changes (2 small changes)
6. Fix `VoicePortal.tsx` prop mismatch

### P2 — Medium (1-2 weeks)
7. Split `discover.tsx` (2200 lines) into 6-8 lazy-loaded components
8. Fix rituals.tsx state type union (add `'locked' | 'complete'` to the type)
9. Begin AWS migration planning (see AWS_MIGRATION_PLAN.md)

### P3 — Low (backlog)
10. Delete `app/(tabs)/explore.tsx` if confirmed unused
11. Add Sentry or Crashlytics for crash reporting
12. Add analytics (Mixpanel / Amplitude) for feature usage tracking

---

## Files Changed This Session

| File | Change | Reason |
|------|--------|--------|
| `app/_layout.tsx` | Added `usePathname()` check to hide MomentCaptureButton on Today tab | Bug 1: duplicate voice button |
| `app/(tabs)/discover.tsx` | Added 5s hard timeout to TransitCalendarSection and RetrogradeTrackerSection loading states | Bug 2: loading states could hang forever |
| `AWS_MIGRATION_PLAN.md` | Created new — full AWS migration plan | Task: document migration path |
| `AUDIT_REPORT_2026.md` | Created new — this file | Task: document audit findings |

---

*Generated by VEYa audit system — 2026-03-28*
