# VEYa Full Audit Report — 2026-03-28

## Bug Fixes Applied

### Bug 1: Duplicate Floating Button (FIXED)
**File:** `app/_layout.tsx`
**Problem:** `MomentCaptureButton` was rendering globally, including on the Today tab which already has its own "Talk to VEYa ✨" card and QuickActionsBar voice button — creating duplicate floating buttons.
**Fix:** Added `usePathname` from expo-router. `MomentCaptureButton` is now hidden when `pathname` matches `/`, `/(tabs)`, or `/(tabs)/index`.

### Bug 2: Discover Tab Loading State (FIXED)
**Files:** `app/(tabs)/discover.tsx`
**Problem:** `TransitCalendarSection` and `RetrogradeTrackerSection` both set `isLoading = true` on mount. If the astro computation hung (e.g., due to a slow device), the loading state would never resolve.
**Fix:** Added 5-second hard timeouts to both useEffect hooks. If computation exceeds 5 seconds, `setIsLoading(false)` is called with fallback empty data, so the UI always resolves.

---

## Supabase Usage Catalog

### Auth Calls
| File | Line | Method | Purpose |
|------|------|--------|---------|
| `app/_layout.tsx` | 137 | `supabase.auth.onAuthStateChange()` | Listen for login/logout events globally |
| `app/_layout.tsx` | 153 | `supabase.auth.getSession()` | Get initial session on app load |
| `src/services/onboarding.ts` | 27 | `supabase.auth.getUser()` | Get current user during onboarding save |

### Database Calls
| File | Line | Table | Operation | Purpose |
|------|------|-------|-----------|---------|
| `app/_layout.tsx` | ~140 | `user_profiles` | SELECT | Fetch user profile on auth state change |
| `src/services/onboarding.ts` | 53 | `user_profiles` | INSERT | Save user profile after onboarding |
| `src/services/onboarding.ts` | 86 | `birth_charts` | INSERT | Save calculated birth chart |
| `src/services/rag.ts` | 42 | `user_embeddings` | INSERT | Store RAG memory embeddings |
| `src/services/rag.ts` | 113 | `ai_conversations` | INSERT | Store conversation history |
| `src/services/ai.ts` | 703 | `user_embeddings` | RPC (`match_user_embeddings`) | Vector similarity search for RAG |
| `src/services/dailyReading.ts` | 78 | `daily_readings` | INSERT | Persist daily reading |
| `src/services/streakService.ts` | 64 | `streaks` | INSERT (upsert) | Create/update streak record |
| `src/services/streakService.ts` | 92 | `streaks` | UPDATE | Update streak on check-in |

### Edge Function Calls
| File | Line | Function | Purpose |
|------|------|----------|---------|
| `src/services/ai.ts` | 124 | `supabase.functions.invoke(name, { body })` | Generic edge function invoker (wraps OpenAI calls server-side) |

### Realtime / Storage
No realtime subscriptions or storage calls found.

---

## TypeScript Errors (`npx tsc --noEmit`)

> These are non-blocking (app runs), but indicate schema mismatches and type issues.

### Critical: Supabase Schema Mismatches
These errors all stem from the Supabase-generated types being out of sync with the actual database schema. Tables like `user_profiles`, `birth_charts`, `daily_readings`, `streaks`, `user_embeddings`, and `ai_conversations` are typed as `never` in the generated types, meaning the Supabase schema was likely never pushed or the types are stale.

| File | Error |
|------|-------|
| `src/services/onboarding.ts:53` | `user_profiles` insert: argument type not assignable to `never` |
| `src/services/onboarding.ts:86` | `birth_charts` insert: argument type not assignable to `never` |
| `src/services/rag.ts:42` | `user_embeddings` insert: argument type not assignable to `never` |
| `src/services/rag.ts:113` | `ai_conversations` insert: argument type not assignable to `never` |
| `src/services/dailyReading.ts:78` | `daily_readings` insert: argument type not assignable to `never` |
| `src/services/streakService.ts:64,92` | `streaks` insert/update: argument type not assignable to `never` |

**Root cause:** Supabase client types generated with empty/placeholder schema. Fix: run `supabase gen types typescript` to regenerate.

### React Native / Reanimated Type Errors
| File | Error |
|------|-------|
| `app/(auth)/onboarding/interests.tsx:636` | `SharedValue` not exported from reanimated Animated namespace |
| `src/components/shared/LoadingStates.tsx:115,131` | Same `SharedValue` export issue |
| `src/components/shared/LoadingStates.tsx:173` | `width: string | number` not assignable to `DimensionValue` |

**Root cause:** Type import path mismatch — use `import { SharedValue } from 'react-native-reanimated'` directly.

### Other Type Errors
| File | Error |
|------|-------|
| `app/(tabs)/discover.tsx:443` | `UserProfile` type mismatch — partial object passed where full type required |
| `app/(tabs)/rituals.tsx:633,711,712` | Unreachable comparisons (`'ready'` vs `'complete'`/`'locked'`) — stale state type |
| `src/components/voice/VoicePortal.tsx:62` | `onTranscript` prop doesn't exist on `VoiceInterfaceProps` |
| `src/services/smartNotifications.ts:56,246` | Missing `shouldShowBanner`/`shouldShowList` + missing `type` in `DateTriggerInput` |
| `src/stores/readingStore.ts:182` | `date` property doesn't exist on `DailyReading` type |

**Total errors: 20 (all non-blocking)**

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Bugs fixed | 2 | ✅ Done |
| Supabase auth calls | 3 | Cataloged |
| Supabase DB calls | 9 | Cataloged |
| Supabase edge function calls | 1 | Cataloged |
| Supabase realtime/storage | 0 | N/A |
| TypeScript errors | 20 | Non-blocking |
