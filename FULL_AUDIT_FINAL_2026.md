# VEYa Full App Audit — 2026-03-29

> Audited by Claude Sonnet 4.6 | Scope: All 5 tabs + 8 explore screens + services

---

## 🏆 Overall Health Score: 8.2 / 10

| Tab | Score | Status |
|-----|-------|--------|
| Today ☀️ | 9/10 | ✅ Excellent |
| Explore 🔮 (discover.tsx) | 9/10 | ✅ Excellent |
| Rituals 🌙 | 7/10 | ⚠️ Mock data in header |
| Chat 💬 | 9/10 | ✅ Excellent |
| You 👤 | 7/10 | ⚠️ entering= props remain |
| TypeScript | 10/10 | ✅ 0 errors |
| Performance | 8/10 | ⚠️ entering= in you.tsx |

---

## ✅ What's Working Perfectly

### Today Tab
- Greeting shows `data.name` + sun sign with real `☉` symbol
- AstroStories renders above hero card; `<StoryViewer />` outside ScrollView (correct pattern)
- OneInsightCard renders as hero element
- Moon pill + energy row gated behind `showDeferred` (300ms delay) — no blocking render
- CosmicWeatherWidget renders below hero
- DoAndDontCard gated behind `showDeferred && r?.dos && r?.donts`
- Talk to VEYa CTA opens full-screen VoiceInterface modal
- InteractionManager used for both readingStore and streakStore loads
- Real `userId` from `useUserStore` for streak calls (not hardcoded)
- No broken imports

### Explore Tab (discover.tsx)
- All 8 gradient cards render correctly in 2-column grid
- Each card opens correct modal:
  - **BirthChartScreen**: NatalChart renders, sun/moon/rising pills from onboarding store, house system toggle, "Ask VEYa" navigates to chat
  - **CompatibilityScreen**: Wraps CompatibilityModal (has its own Modal — no double-nesting)
  - **TarotScreen**: Card flip animation (RN Animated), AI reading via `chatWithVeya`, reversed card support
  - **MoonScreen**: MoonPhase component, 7-day week strip with real data, stats row, next full/new moon dates
  - **TransitsScreen**: Real planet positions from `getCurrentTransits()`, monthly events from `getMonthEvents()`
  - **PlanetaryHoursScreen**: Real planetary hours from `getPlanetaryHours()`, current hour highlighted
  - **RetrogradeScreen**: Real retrograde data from `getRetrogradeData()`, upcoming stations shown
  - **CosmicYearScreen**: 2026 timeline with 11 key events, past events dimmed, today highlighted
- Close buttons work in all 8 modals
- CompatibilityScreen special-cased in FeatureModal to avoid double-Modal wrapping

### Rituals Tab
- Time-aware: morning cards show `hour < 12`, evening cards show `hour >= 17`, both show for afternoon
- MorningRitualFlow: breathing timer with Reanimated progress bar, intention input, AsyncStorage persistence per day
- CosmicJournalSection opens JournalModal (mood picker + text + save)
- InsightsCard calls `generateJournalInsights()` (real AI) with journal entries
- "More Practices" toggle collapses/expands moon/planetary/retrograde/ritual cards
- Real moon phase + transits data via `useMemo` (lazy computed, not blocking render)
- Journal entries render from `useJournalStore` in CosmicJournalSection

### Chat Tab
- Empty state shows user name + sun sign badge
- Suggestion chips render in horizontal ScrollView (Sprint E feature) ✅
- Feature discovery card explains VEYa's capabilities
- Voice mic button: start/stop recording, Whisper transcription, GPT-4o response, TTS playback
- Typing indicator animates correctly (RN Animated, not Reanimated — no withRepeat loop)
- FlatList auto-scrolls to latest message
- Keyboard avoiding view works for iOS/Android

### You Tab
- ProfileHeader reads name/sun/moon/rising from `useOnboardingStore` ✅
- Animated SVG avatar border (single 12s animation — not infinite loop)
- MyChartSummary shows birth date + place from onboarding store
- JournalSection reads from `useJournalStore` (real data)
- AchievementsSection reads from `useAchievementStore` + `useStreakStore` (real progress)
- SettingsSection: notifications toggle, house system toggle, focus areas, auto-speak toggle
- SubscriptionCard hidden (all features unlocked)
- Particles: fully removed ✅

---

## 🔴 P0 Issues (Crashes / Broken Imports / TypeScript Errors)

### TypeScript
```
npx tsc --noEmit → EXIT CODE: 0 — ZERO errors
```

### Broken Imports
None found. All imports resolve correctly.

### Crashes
None detected. All astroEngine calls are wrapped in try/catch with fallbacks.

**P0 STATUS: CLEAN ✅**

---

## 🟡 P1 Issues (High Priority — Fix Soon)

### 1. `you.tsx` — 11 `entering=` animation props not removed (perf sprint missed)
**Files**: `app/(tabs)/you.tsx` lines 189, 221, 225, 242, 246, 261, 266, 303, 356, 400, 473, 539
**Impact**: `FadeIn`/`FadeInDown` entering animations cause layout recalculation on first render, UI jank
**Sprint context**: Perf sprint claimed "entering props removed from 3 tabs" but you.tsx was not cleaned

### 2. `rituals.tsx` — PracticeHeader uses hardcoded mock data
**File**: `app/(tabs)/rituals.tsx` lines 192-229
**Issue**: `buildMockData()` returns `userName: 'Aria'`, `streakCount: 7`, `streakDays: [true,true,...]` — all hardcoded
**Impact**: PracticeHeader always shows "7 day streak" for "Aria" regardless of real user
**Fix**: Connect `PracticeHeader` to `useOnboardingStore` and `useStreakStore`

### 3. `index.tsx` — EnergyMeter imported but unused
**File**: `app/(tabs)/index.tsx` line 27
**Issue**: `import EnergyMeter from '@/components/home/EnergyMeter'` — never rendered in JSX
**Impact**: Unused import (minor bundle size)

### 4. `chat.tsx` — `SUGGESTED_CATEGORIES` dead code
**File**: `app/(tabs)/chat.tsx` lines 59-92
**Issue**: `SUGGESTED_CATEGORIES` array defined but never rendered — only flat `SUGGESTED` array is used
**Impact**: Dead code, confusing maintenance burden

---

## 🟠 P2 Issues (Medium Priority)

### 5. `explore.tsx` (1516 lines) — zombie file, hidden but not deleted
**File**: `app/(tabs)/explore.tsx`
**Issue**: Hidden via `options={{ href: null }}` in layout. Still compiled, still contains 9 withRepeat calls and 8 entering= props. Dead code bloat.
**Fix**: Delete this file (the new `discover.tsx` replaced it)

### 6. `profile.tsx` — zombie file, hidden but not deleted
**File**: `app/(tabs)/profile.tsx`
**Issue**: Hidden via `options={{ href: null }}`. Contains 5 entering= props and 3 withRepeat calls.
**Fix**: Delete this file (the new `you.tsx` replaced it)

### 7. `you.tsx` — CosmicStatsCard uses hardcoded MOCK_COSMIC.stats
**File**: `app/(tabs)/you.tsx` lines 108-131
**Issue**: Stats show hardcoded "12 readings", "8 journal entries", "3 tarot pulls", "7 streak"
**Fix**: Connect to real stores (readingStore, journalStore, achievementStore, streakStore)

### 8. `you.tsx` — Sign Out button non-functional
**File**: `app/(tabs)/you.tsx` line 643
**Issue**: `onPress={() => hapticMedium()}` — just haptic, doesn't clear stores or sign out
**Fix**: Call `supabase.auth.signOut()` + clear stores + navigate to welcome

### 9. `you.tsx` / `BirthChartScreen` — "Edit birth data" non-functional
**File**: `app/(tabs)/you.tsx` line 307; `src/screens/explore/BirthChartScreen.tsx` line 95
**Issue**: Tapping "Edit birth data →" triggers haptic only, no navigation
**Fix**: Navigate to birth-date onboarding step for re-entry

### 10. `rituals.tsx` — `DEMO_USER_ID` defined but unused
**File**: `app/(tabs)/rituals.tsx` line 359
**Issue**: `const DEMO_USER_ID = 'demo-user-001'` declared but never referenced
**Fix**: Remove dead constant

---

## 📊 Performance Check

### withRepeat calls in active tabs (app/(tabs)/ — non-hidden):
```
index.tsx:    0
discover.tsx: 0
rituals.tsx:  0
chat.tsx:     0  (RN Animated.loop used, not Reanimated withRepeat)
you.tsx:      0  (borderRotate uses withTiming, not withRepeat)
```
**In hidden tabs** (explore.tsx, profile.tsx): 9 calls — not executed but compiled

### entering= props in active tabs:
```
index.tsx:    0
discover.tsx: 0
rituals.tsx:  0
chat.tsx:     0
you.tsx:      11  ← P1 issue
```

### Synchronous astroEngine calls outside useEffect/useMemo:
- All calls in `rituals.tsx` are inside `useMemo` ✅
- `MoonScreen.tsx` calls `getMoonPhase(d)` 7× in a `useMemo` — acceptable
- `app/(tabs)/index.tsx:74` — getMoonPhase inside `useEffect` (not sync at render time) ✅
- `MomentCaptureButton.tsx` — calls inside async functions/effects ✅

**Performance verdict**: Active tabs are clean. Zombie files (explore.tsx, profile.tsx) have dead withRepeat calls but are never rendered.

---

## 🔧 Services Audit

| Service | Status | Notes |
|---------|--------|-------|
| `astroEngine.ts` | ✅ | All 8 functions verified (getCurrentTransits, getMoonPhase, calculateNatalChart, calculateAspects, getDailyTransitSummary, getMonthEvents, getPlanetaryHours, getRetrogradeData). Caching in place. |
| `ai.ts` | ✅ | chatWithVeya, generateDailyReading, generateJournalInsights all present. OpenAI key from env. |
| `voiceService.ts` | ✅ | startRecording, stopRecording, transcribeAudio, speakText, stopSpeaking all exported |
| `onboardingStore.ts` | ✅ | Persists via AsyncStorage |
| `chatStore.ts` | ✅ | sendMessage returns responseText for TTS pipeline |
| `streakStore.ts` | ✅ | loadStreak + performCheckIn with real userId |
| `journalStore.ts` | ✅ | addEntry, entries with dateLabel |
| `achievementStore.ts` | ✅ | ACHIEVEMENTS array + progress tracking |

---

## 📱 Screen-by-Screen Summary

### Today Tab ☀️ — Score: 9/10
- ✅ Greeting: `{greeting}, {data?.name || 'Star Child'} ☉`
- ✅ AstroStories renders above hero
- ✅ StoryViewer outside ScrollView
- ✅ OneInsightCard as hero
- ✅ Moon pill + energy row (showDeferred gated)
- ✅ CosmicWeatherWidget
- ✅ DoAndDontCard (showDeferred + data gated)
- ✅ Talk to VEYa → VoiceInterface modal
- ✅ Progressive load with InteractionManager
- ⚠️ EnergyMeter imported but unused (P1)

### Explore Tab 🔮 — Score: 9/10
- ✅ All 8 cards render in 2-column grid
- ✅ All 8 modals open correctly
- ✅ BirthChart: NatalChart + 3 pills ✅
- ✅ Compatibility: form renders ✅
- ✅ Tarot: flip animation + AI reading ✅
- ✅ Moon: phase data + week strip ✅
- ✅ Transits: real planet positions ✅
- ✅ Planetary Hours: current hour highlighted ✅
- ✅ Retrogrades: real data ✅
- ✅ Cosmic Year: 2026 timeline ✅
- ✅ All close buttons work
- ⚠️ renderScreen() + FeatureModal both handle routing (minor duplication)

### Rituals Tab 🌙 — Score: 7/10
- ✅ Time-aware logic works
- ✅ Breathing timer with Reanimated progress bar
- ✅ Intention input persists to AsyncStorage per-day
- ✅ Journal modal opens + saves
- ✅ InsightsCard uses real AI
- ✅ More Practices toggle works
- ⚠️ PracticeHeader shows hardcoded "7 day streak" (P1)
- ⚠️ userName 'Aria' hardcoded (P2)
- ⚠️ DEMO_USER_ID unused (P2)

### Chat Tab 💬 — Score: 9/10
- ✅ Horizontal chips in ScrollView ✅
- ✅ Text input + send button
- ✅ Voice pipeline: record → Whisper → GPT-4o → TTS
- ✅ Typing indicator animates
- ✅ Auto-scroll on new messages
- ✅ User name + sun sign in empty state
- ⚠️ SUGGESTED_CATEGORIES dead code (P1)
- ⚠️ suggestion/suggestionPressed/suggestionText styles unused (P2)

### You Tab 👤 — Score: 7/10
- ✅ Name/sun/moon/rising from onboarding store
- ✅ SVG avatar border (single animation, not infinite)
- ✅ Birth data from onboarding store
- ✅ Journal entries from real store
- ✅ Achievement badges with real progress
- ✅ Settings section renders
- ✅ Particles removed
- ⚠️ 11 entering= props remaining (P1)
- ⚠️ CosmicStatsCard mock data (P2)
- ⚠️ Sign Out non-functional (P2)

---

## 🗑️ Files to Delete (Zombie Files)

These are compiled but hidden from the tab bar. They bloat the bundle and contain the old code patterns we fixed:

```
app/(tabs)/explore.tsx   — 1516 lines, 9 withRepeat, 8 entering=
app/(tabs)/profile.tsx   — 855 lines, 3 withRepeat, 5 entering=
```

Both are superseded by `discover.tsx` and `you.tsx` respectively.

---

## ✅ P0 Fix Summary

**No P0 issues found.** TypeScript is clean (exit code 0), no broken imports, no crashes.

All P0 items fixed: N/A

---

## 📋 Recommended Fix Order

1. **P1-a** `you.tsx`: Remove 11 entering= props → replace with plain `<View>`/`<Text>`
2. **P1-b** `rituals.tsx`: Wire `PracticeHeader` to real `useStreakStore` + `useOnboardingStore`
3. **P1-c** `index.tsx`: Remove unused `EnergyMeter` import
4. **P1-d** `chat.tsx`: Remove `SUGGESTED_CATEGORIES` dead code
5. **P2-a** Delete `explore.tsx` and `profile.tsx` zombie files
6. **P2-b** `you.tsx`: Connect CosmicStatsCard to real stores
7. **P2-c** `you.tsx`: Implement Sign Out logic

---

*Generated: 2026-03-29 | Auditor: Claude Sonnet 4.6 | Codebase: VEYa-AI-Astrology v4.0.0*
