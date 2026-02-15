# VEYa v4.2 Full Audit Report
**Date:** February 15, 2026
**Auditor:** ClawdBot + BETA

---

## Executive Summary

The app has **critical performance issues** causing lag, loading problems, and occasional crashes. The root causes are:

1. **230 infinite animation loops** running simultaneously
2. **Giant components** (discover.tsx = 2209 lines)
3. **Expensive calculations in render paths** without memoization
4. **Error boundaries catching crashes** and showing "Loading VEYa..." message

---

## 🔴 CRITICAL Issues (Fix Immediately)

### 1. Animation Overload
**Severity:** CRITICAL  
**Impact:** App lag, battery drain, crashes

**Problem:** 230 instances of `withRepeat`/`withSequence` animations running continuously across all screens.

**Locations:**
- `app/(tabs)/_layout.tsx:52-68` — Tab icons animate on every focus change
- `app/(tabs)/discover.tsx` — Star particles, pulse effects, glow animations
- `src/components/stories/AstroStories.tsx` — Story ring animations
- `src/components/home/*.tsx` — Multiple widget animations

**Fix:**
```javascript
// BAD: Runs forever
pulseScale.value = withRepeat(withSequence(...), -1, true);

// GOOD: Run once or on trigger
pulseScale.value = withSpring(focused ? 1.05 : 1);
```

---

### 2. Giant Component Files
**Severity:** CRITICAL  
**Impact:** Slow tab switching, memory pressure

| File | Lines | Status |
|------|-------|--------|
| `app/(tabs)/discover.tsx` | 2209 | 🔴 Split immediately |
| `app/(tabs)/explore.tsx` | 1496 | 🟠 Consider splitting |
| `app/(tabs)/rituals.tsx` | 1416 | 🟠 Consider splitting |
| `app/(tabs)/index.tsx` | 931 | 🟡 Acceptable |

**Fix:** Split `discover.tsx` into:
- `BirthChartSection.tsx`
- `TarotSection.tsx`
- `CompatibilitySection.tsx`
- `TransitCalendarSection.tsx`
- `MoonTrackerSection.tsx`
- Lazy load with `React.lazy()` and `Suspense`

---

### 3. Expensive Render-Path Calculations
**Severity:** HIGH  
**Impact:** Lag on every re-render

**Problem:** Astronomical calculations run on every render without memoization.

**Locations:**
- `app/(tabs)/index.tsx:328` — `getMoonPhase(new Date())` in render
- `app/(tabs)/rituals.tsx:107-108` — Both `getMoonPhase()` and `getCurrentTransits()` 
- `app/(tabs)/discover.tsx:969` — `getMoonPhase(d)` in calendar loop

**Fix:**
```javascript
// BAD: Recalculates every render
const moon = getMoonPhase(new Date());

// GOOD: Memoize with proper deps
const moon = useMemo(() => getMoonPhase(new Date()), []);
// Or with date dependency
const moon = useMemo(() => getMoonPhase(date), [date.toDateString()]);
```

---

### 4. Error Boundary Masking Crashes
**Severity:** HIGH  
**Impact:** Shows "Loading VEYa..." on crashes

**Location:** `app/(tabs)/_layout.tsx:277-305`

**Problem:** The `TabsErrorBoundary` catches render errors and shows a generic "Loading VEYa..." message, which is what the user sees when the app lags.

**Fix:** Add proper error logging and crash reporting:
```javascript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('[Tabs] Crash:', error.message);
  // Send to Sentry/Crashlytics
  crashReporting.capture(error, errorInfo);
}
```

---

## 🟠 HIGH Issues

### 5. Auth State Race Condition
**Severity:** HIGH  
**Location:** `app/_layout.tsx:96-118`

**Problem:** Auth listener updates user state but doesn't handle the loading->authenticated transition gracefully.

**Fix:** Add `isAuthLoading` state and show splash until auth is resolved.

---

### 6. Missing useEffect Cleanup
**Severity:** MEDIUM  
**Locations:** Multiple files

**Problem:** Some `useEffect` hooks don't clean up subscriptions/timers.

**Example Fix:**
```javascript
useEffect(() => {
  const subscription = someApi.subscribe();
  return () => subscription.unsubscribe(); // ✅ Cleanup
}, []);
```

---

### 7. Large Bundle Imports
**Severity:** MEDIUM  

**Problem:** Heavy imports loaded eagerly:
- `expo-haptics` — Should be dynamic
- `react-native-svg` — Every screen imports full library
- `@expo/vector-icons` — Could tree-shake better

**Fix:** Use dynamic imports:
```javascript
// Instead of
import * as Haptics from 'expo-haptics';

// Use
const hapticFeedback = async () => {
  const Haptics = await import('expo-haptics');
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
```

---

## 🟡 MEDIUM Issues

### 8. Hardcoded Mock Data
**Severity:** MEDIUM  
**Location:** `app/(tabs)/discover.tsx:146-180`

**Problem:** Mock data still present:
```javascript
const MOCK = {
  userName: 'Aria',
  bigThree: [...],
  lastCompatibility: { partnerName: 'Marcus', ... }
};
```

**Fix:** Replace with actual user data from stores.

---

### 9. Date Display Wrong Year Issue
**Severity:** LOW (Fixed)  
**Location:** `src/services/voiceService.ts`, `src/services/aiContext.ts`

**Status:** ✅ Fixed — Date context now emphatic about current year being 2026.

---

## 📊 Data Accuracy Check

### Astrology Engine (`src/services/astroEngine.ts`)

| Feature | Status | Notes |
|---------|--------|-------|
| Moon phase calculation | ✅ Accurate | Uses astronomy-engine library |
| Planetary positions | ✅ Accurate | Real ephemeris data |
| Transit aspects | ✅ Working | Proper orb calculations |
| House calculations | ⚠️ Check | Placidus vs Whole Sign toggle works |
| Retrograde detection | ✅ Working | Checks velocity direction |

---

## 🛠️ Recommended Fix Order

1. **[URGENT]** Kill infinite animations in tab icons and discover page
2. **[URGENT]** Split discover.tsx into lazy-loaded sections
3. **[HIGH]** Add useMemo to astroEngine calls
4. **[HIGH]** Fix auth loading state race condition
5. **[MEDIUM]** Remove/replace mock data
6. **[MEDIUM]** Add useEffect cleanup
7. **[LOW]** Dynamic import heavy libraries

---

## Performance Budget

**Target:**
- Time to Interactive: < 2s
- Tab switch: < 300ms
- Animation FPS: 60fps stable

**Current (estimated):**
- Time to Interactive: ~4-6s (too slow)
- Tab switch: ~800ms-2s (laggy)
- Animation FPS: 30-45fps (drops with many animations)

---

## Next Steps

1. Create `fix/performance` branch
2. Apply critical fixes (animations + split components)
3. Test on real device
4. Deploy OTA update
5. Monitor crash reports

---

*Report generated by ClawdBot QA System*
