# Sprint 1 — Implementation Status
Date: 2026-03-28

## What Was Fixed

### 1. .env.local — Updated to new Supabase project
- URL changed to: `https://ennlryjggdoljgbqhttb.supabase.co`
- **ANON_KEY is PLACEHOLDER** — needs to be replaced with real key from Supabase dashboard

### 2. src/lib/supabase.ts — New project URL
- Removed hardcoded old anon key fallback
- Now reads entirely from env vars (no hardcoded credentials)

### 3. src/types/index.ts — Full schema sync with new DB
- Updated `AIConversation`: now uses `messages jsonb` (not per-row role/content)
- Updated `Ritual`: new fields (`ritual_date`, `completed`, `completed_at`, `duration_sec`, `notes`, `data`)
- Updated `Streak`: removed `streak_type`, `total_check_ins`; added `total_days`
- Updated `Subscription`: `plan` is now `free|premium|pro` (not `lifetime`); `status` includes `trialing`
- Updated `BirthChart`: simplified to match new schema (jsonb columns for planets/houses/aspects)
- Added `JournalEntry` interface and table type
- Added `DailyHoroscopeCache` interface and table type
- Added `moonSign` and `risingSign` to `OnboardingData` (were in store but not in shared types)

### 4. TypeScript `as any` casts — Already present in services
- `onboarding.ts`: upsert + insert already have `as any`
- `dailyReading.ts`: upsert already has `as any`
- `rag.ts`: insert already has `as any`

### 5. app/explore.tsx — Already using real onboarding data
- `MyBirthChartSection` already reads from `useOnboardingStore`
- `BigThreePills` already reads `sunSign`/`moonSign`/`risingSign` from store data

### 6. src/components/voice/VoiceInterface.tsx — Props fixed
- Added `onTranscript?: (text: string) => void` to `VoiceInterfaceProps`
- Added `responseText?: string | null` to `VoiceInterfaceProps`
- Resolves TypeScript error in VoicePortal.tsx

### 7. app/_layout.tsx — Auth timeout added
- 8-second timeout: if Supabase auth doesn't resolve, app proceeds in offline mode
- `clearTimeout` called on both `onAuthStateChange` and `getSession` success paths
- Cleanup properly clears timeout on unmount

### 8. src/stores/readingStore.ts — Offline fallback improved
- On `fetchTodayReading` failure, returns `generatedReading` (offline-first reading)
- Prevents blank UI when Supabase is unreachable
- Generated reading is already persisted via Zustand + AsyncStorage

## What Needs the Supabase Anon Key to Activate

1. **Auth** — `supabase.auth.getSession()` and `onAuthStateChange` will fail silently (8s timeout kicks in, app runs in offline mode)
2. **User profile saves** — Onboarding data won't persist to DB (stays in Zustand locally)
3. **Daily readings** — Supabase cache won't work; offline generated readings will be used instead
4. **RAG memory** — Embeddings won't be stored or retrieved
5. **Streaks** — Won't sync to DB

The app will function in offline mode for all features until the anon key is provided.

## What to Do After Receiving the Anon Key

1. Replace `PLACEHOLDER_ANON_KEY` in `.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

2. Run the schema SQL on the new Supabase project:
   ```bash
   # In Supabase dashboard: SQL Editor > paste supabase_schema.sql > Run
   ```

3. Test auth flow:
   ```bash
   npx expo start
   ```

4. Verify DB connections work by checking the console for Supabase errors

## File Summary

| File | Change |
|------|--------|
| `.env.local` | New Supabase URL, placeholder anon key |
| `src/lib/supabase.ts` | New URL, no hardcoded key |
| `src/types/index.ts` | Full schema sync, new interfaces |
| `src/components/voice/VoiceInterface.tsx` | Added onTranscript, responseText props |
| `app/_layout.tsx` | 8s auth timeout |
| `src/stores/readingStore.ts` | Offline fallback on error |
