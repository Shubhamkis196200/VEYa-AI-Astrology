# VEYa V4 — Phase 1 Master Implementation Plan

> Generated: Feb 14, 2026 | Based on competitive research (CHANI, Co-Star, Moonly, Sanctuary, The Pattern, AstroTalk) + technical audit

---

## 🔴 CRITICAL ISSUES (Must Fix First)

### 1. Chat AI — Wrong Date + Generic Responses
**Current Problem:** Chat says "October 6th, 2023" — completely wrong. Responses are generic horoscope-style, not personalized to the user's chart.

**Root Cause:** 
- System prompt doesn't inject current date/time
- No birth chart data passed to the AI (it has no idea what the user's placements are)
- No current transit data passed (it invents fake transits)

**Fix — The "Smart Context" Approach:**
```
System Prompt must include:
1. Current date/time/timezone: "Today is February 14, 2026, Saturday"
2. User's natal chart data: "Sun: Scorpio 15°, Moon: Pisces 8°, Rising: Leo 22°..."
3. Current real transits: "Venus in Aries, Mercury in Aquarius, Mars in Gemini..."
4. User's name and preferences from onboarding
5. Past conversation memory (RAG) when available
```

**Implementation:**
- Use `astronomy-engine` to calculate REAL current planetary positions
- Build a `getTransitContext()` function that returns today's actual transits
- Inject user's birth chart into every API call as structured data
- Add `new Date().toLocaleDateString()` to system prompt dynamically

**Best Practice (from CHANI/Sanctuary):** Every response should reference at least ONE specific transit + ONE natal placement. Never say "the stars say" — say "Venus in your 7th house trining your natal Moon in Pisces."

---

### 2. Voice AI — Not Responding
**Current Problem:** Voice button exists but doesn't actually work. No recording, no transcription, no spoken response.

**Root Cause:** 
- VoiceInterface component exists but mic permission flow fails silently
- No error handling when recording fails
- TTS response never triggers because chat response isn't captured

**Fix — Two Implementation Options:**

**Option A: Whisper STT + GPT-4o + TTS-1-HD (Current architecture, fixed)**
- Flow: Tap mic → Record → Whisper transcribes → GPT-4o responds → TTS speaks
- Latency: ~4-6 seconds total
- Cost: ~$0.02 per interaction
- Pro: Works in Expo Go, no native modules needed
- Con: Not real-time conversational

**Option B: OpenAI Realtime API via WebRTC (Premium experience)**
- Flow: Tap mic → Live bidirectional voice conversation
- Latency: <500ms, feels like talking to a person
- Cost: ~$0.06/min audio
- Pro: Human-like conversation, interruption support
- Con: Requires `react-native-webrtc` (dev build, not Expo Go)

**Recommendation:** Ship Option A now (works today), plan Option B for Phase 2 with dev builds.

**Voice UX (from research):**
- Pulsing orb animation while listening
- Waveform visualization during playback
- "VEYa is thinking..." state with gentle animation
- Auto-stop recording after 2 seconds of silence
- Mic button in Chat tab AND standalone Voice screen

---

### 3. Rituals — Too Generic, Not Functional
**Current Problem:** Morning/Evening rituals show hardcoded text. Breathing exercise button does nothing. Journal doesn't save. Intentions don't persist.

**What CHANI Does (best-in-class):**
- Morning: Personalized intention based on TODAY's moon sign + user's chart
- Evening: Reflection prompt + 3 gratitudes + mood tracking
- Weekly: Longer ritual tied to the week's major transit
- All tied to actual celestial events (Full Moon ritual, New Moon ritual, etc.)

**Fix — Data-Driven Rituals:**
```
Morning Ritual Flow:
1. "Take 3 deep breaths" → Actually count down 3 breaths with timer
2. "Set your intention" → AI-generated based on today's transits + user chart
3. "Read daily briefing" → Links to Today tab

Evening Ritual Flow:  
1. Reflection prompt → AI-generated based on day's energy
2. 3 gratitudes → Text input that saves to journal
3. Mood check-in → Emoji picker (5 options) that saves
4. Brief evening reading → What tomorrow's energy brings

Moon Phase Rituals:
- Full Moon: Release ritual (write what to let go)
- New Moon: Intention setting (write what to manifest)
- Eclipse: Special meditation/journaling prompt
```

**Storage:** Save all ritual completions, intentions, moods to Zustand + AsyncStorage. Show patterns over time ("You journal most on Full Moon days").

---

### 4. Tarot — Not Interactive
**Current Problem:** Beautiful card back design but tapping does nothing. No actual card reveal, no reading.

**Fix — Full Tarot Implementation:**
```
78 Major + Minor Arcana cards needed:
- Card database with: name, number, image, upright meaning, reversed meaning, keywords
- Card selection: Seeded random based on date + user ID (same card all day)
- Reveal animation: 3D flip with haptic feedback

Daily Pull:
- One card per day, locked after reveal
- AI interpretation personalized to user's chart + current question

3-Card Spread (Past/Present/Future):
- 3 cards laid out with staggered reveal
- AI reads the narrative across all 3

Celtic Cross (Premium):
- 10-card spread with positional meanings
- Deep AI interpretation
```

**Implementation:** Create `src/data/tarotDeck.ts` with all 78 cards (name, arcana, element, keywords, upright/reversed meanings). Use `astronomy-engine` date + userId hash for deterministic daily card.

---

### 5. Compatibility — Not Working
**Current Problem:** "Check Your Compatibility" card shows but Start button does nothing. "Last: Marcus — 82% match" is hardcoded.

**Fix — Real Compatibility Engine:**
```
Flow:
1. User taps "Start →"
2. Enter partner's name, birth date, time (optional), place
3. Calculate partner's natal chart using astronomy-engine
4. Compare charts — Synastry analysis

Scoring Dimensions (6 areas, 0-100 each):
1. Communication — Mercury aspects between charts
2. Emotional Connection — Moon aspects, Venus-Moon contacts
3. Passion/Attraction — Mars-Venus aspects, 5th/8th house overlays
4. Growth & Support — Jupiter aspects, North Node contacts
5. Challenge Areas — Saturn aspects, square/opposition count
6. Long-term Potential — Composite chart analysis

Overall Score = Weighted average:
- Emotional (25%) + Communication (20%) + Passion (20%) + Growth (15%) + Long-term (15%) + Challenge adjustment (5%)
```

**Visual Output:**
- Circular compatibility chart showing both birth charts overlaid
- Score card with animated fill bars for each dimension
- AI narrative: "Your Venus in Pisces perfectly trines their Moon in Scorpio — deep emotional understanding"
- Share card generation for Instagram stories

---

### 6. Moon Phase — Incorrect Data
**Current Problem:** Shows "Waxing Gibbous in Gemini" but this may not be accurate for today.

**Fix — Real Astronomical Calculations:**
```javascript
// Using astronomy-engine (pure JS, works in RN)
import * as Astronomy from 'astronomy-engine';

function getCurrentMoonPhase() {
  const now = new Date();
  const moonPhase = Astronomy.MoonPhase(now); // Returns 0-360 degrees
  
  // 0° = New Moon, 90° = First Quarter, 180° = Full, 270° = Last Quarter
  const phaseName = getMoonPhaseName(moonPhase);
  
  // Moon's ecliptic longitude → zodiac sign
  const moonPos = Astronomy.EclipticGeoMoon(now);
  const moonSign = getZodiacSign(moonPos.elon); // 0-30° = Aries, etc.
  
  // Next Full Moon / New Moon
  const nextFull = Astronomy.SearchMoonPhase(180, now, 30);
  const nextNew = Astronomy.SearchMoonPhase(0, now, 30);
  
  return { phaseName, moonSign, illumination, nextFull, nextNew };
}
```

**What to show:**
- Realistic moon SVG with actual illumination percentage
- Current zodiac sign of moon (changes every ~2.5 days)
- Days until next Full Moon / New Moon
- Weekly moon phase preview (7-day strip)
- "Full Moon ritual guide available →" when within 2 days of Full Moon

---

### 7. Transit Calendar — Not Working
**Current Problem:** Calendar shows but no real transit data. Colored dots are hardcoded.

**Fix — Real Transit Engine:**
```javascript
function getMonthTransits(year, month) {
  const transits = [];
  const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  
  // For each day of the month, calculate planetary positions
  // Flag sign ingresses, retrogrades, major aspects
  
  // Key events to track:
  // - Planet enters new sign (ingress)
  // - Planet goes retrograde/direct
  // - Major aspects (conjunction, opposition, trine, square)
  // - Eclipses (using astronomy-engine SearchLunarEclipse)
  // - Full Moon / New Moon dates
  
  return transits; // [{date, type, description, impact}]
}
```

**Visual:** Calendar dots color-coded by transit type:
- 🟢 Green = Positive (trines, sextiles)
- 🔴 Red = Challenging (squares, oppositions)  
- 🟣 Purple = Significant (ingresses, retrogrades)
- 🟡 Gold = Lunar events (Full/New Moon)

Tap any date → expandable detail card with transit description.

---

### 8. Premium Sections — Unlock Everything
**Action:** Remove ALL paywall gates, make everything accessible.

**Files to update:**
- `explore.tsx` — Remove lock icons from 3-Card Spread, Celtic Cross
- `rituals.tsx` — Remove "Premium" badge from Cosmic Patterns
- `profile.tsx` — Remove subscription prompts
- Any `isSubscribed` or `isPremium` checks → always return `true`

---

## 📊 IMPLEMENTATION PRIORITY (Data-Driven)

Based on engagement data from top astrology apps:

| Priority | Feature | User Impact | Effort | Retention Effect |
|----------|---------|-------------|--------|-----------------|
| P0 | Fix Chat AI (date + personalization) | 🔴 Critical | 4h | Daily active users +40% |
| P0 | Real moon phase + transits (astronomy-engine) | 🔴 Critical | 3h | Credibility/trust |
| P0 | Unlock all premium sections | 🔴 Critical | 30min | Remove friction |
| P1 | Voice AI (Option A — Whisper+TTS) | 🟠 High | 3h | Unique differentiator |
| P1 | Tarot card system (78 cards + reveal) | 🟠 High | 4h | Daily engagement hook |
| P1 | Ritual flow (functional breathing, save intentions) | 🟠 High | 3h | Habit formation, streaks |
| P2 | Compatibility engine | 🟡 Medium | 5h | Social/viral growth |
| P2 | Transit calendar (real data) | 🟡 Medium | 3h | Power user retention |
| P2 | Cosmic patterns (AI insights from journal) | 🟡 Medium | 2h | Premium feel |

---

## 🔧 TECHNICAL FOUNDATION (Build Once, Use Everywhere)

### Core Astrology Engine (`src/services/astroEngine.ts`)
```
Single source of truth for ALL astronomical calculations:
1. getCurrentTransits() → All planet positions right now
2. getMoonPhase() → Phase name, sign, illumination, next events  
3. calculateNatalChart(birthDate, birthTime, birthPlace) → Full chart
4. calculateSynastry(chart1, chart2) → Compatibility analysis
5. getDailyTransitAspects(natalChart) → Today's transits TO user's chart
6. getMonthEvents(year, month) → Calendar data

Library: astronomy-engine (pure JS, 0 native deps, works in Expo Go)
```

### Smart AI Context Builder (`src/services/aiContext.ts`)
```
Builds the perfect prompt context for every AI call:
1. User's name, birth data, natal placements
2. Today's date, time, day of week
3. Current planetary positions (real, from astroEngine)
4. Today's transits to user's natal chart
5. Moon phase and sign
6. RAG memories from past conversations (when available)
7. Current question/topic context
```

### Ritual Data Engine (`src/services/ritualEngine.ts`)
```
Generates personalized ritual content daily:
1. Morning intention → Based on moon sign + strongest transit
2. Evening reflection → Based on day's energy signature
3. Journal prompts → Tied to current cosmic weather
4. Moon phase rituals → Special content for Full/New Moon ±2 days
```

---

## 📅 EXECUTION TIMELINE

### Day 1 (TODAY — 8 hours)
- [x] Research complete (this document)
- [ ] Install `astronomy-engine` 
- [ ] Build `astroEngine.ts` — real planet positions, moon phase, transits
- [ ] Build `aiContext.ts` — dynamic prompt builder with real data
- [ ] Fix Chat AI — inject date + chart + transits into every call
- [ ] Unlock all premium sections (30 min quick fix)
- [ ] Deploy + test

### Day 2 (8 hours)
- [ ] Tarot card database (78 cards)
- [ ] Tarot card reveal animation + AI reading
- [ ] Voice AI fix (Option A — Whisper STT + GPT-4o + TTS)
- [ ] Mic button in Chat tab
- [ ] Ritual flow — functional breathing timer, save intentions/moods
- [ ] Deploy + test

### Day 3 (8 hours)  
- [ ] Compatibility engine — partner input + synastry calculation
- [ ] Transit calendar — real data for current month
- [ ] Cosmic patterns — AI analysis of journal entries
- [ ] Moon phase — real data from astronomy-engine
- [ ] Final polish + deploy

---

## 🎯 SUCCESS METRICS (What "Working" Looks Like)

| Feature | "Working" Definition |
|---------|---------------------|
| Chat AI | Knows today's date, references YOUR placements, mentions REAL transits |
| Voice AI | Tap mic → speak → hear VEYa respond in warm voice within 5 seconds |
| Rituals | Breathing timer counts down, intentions save, mood saves, shows next day |
| Tarot | Tap card → 3D flip reveal → personalized AI interpretation |
| Compatibility | Enter partner → see real synastry score with 6 dimensions |
| Moon Phase | Shows CORRECT current moon phase + zodiac sign (verify against timeanddate.com) |
| Transit Calendar | Shows real planetary events for the month with colored indicators |
| Cosmic Patterns | Shows AI-generated insights from user's journal entries |

---

*This plan prioritizes: accuracy first, then personalization, then delight.*
*Every feature must feel REAL — no more hardcoded/fake data.*
