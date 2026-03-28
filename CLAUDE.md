# VEYa V4 — Master Context Document

> **For**: Claude Opus 4.6 Orchestrator (1M context window)
> **Purpose**: Complete system understanding for intelligent task orchestration
> **Updated**: 2026-02-14

---

## 🎯 PROJECT OVERVIEW

**VEYa** is an AI astrology app — "Your AI Astrologer Who Truly Knows You"

### The 5 Moat Features (Uncontested)
1. 🎙️ **Voice AI Astrologer** — 0 competitors have this
2. 🧠 **RAG Memory** — AI remembers past conversations
3. 🌌 **3D Immersive Design** — Every screenshot viral-worthy
4. 🔮 **Multi-System Fusion** — Western + Vedic + Chinese
5. 📖 **Personal Cosmic Narrative** — User's ongoing story

### Core Philosophy
- **Warm, not cold** — opposite of Co-Star's harsh tone
- **Personal, not generic** — uses REAL birth chart + transits
- **Empowering** — astrology shows patterns, not destiny
- **Beautiful** — cosmic dark theme, screenshot-worthy

---

## 🛠️ TECH STACK

| Layer | Technology |
|-------|------------|
| Framework | Expo ~54.0.33 (React Native) |
| Routing | Expo Router v6 (typed routes) |
| State | Zustand v5 |
| Backend | Supabase (Auth + DB + Edge Functions) |
| AI | OpenAI GPT-4o |
| Astrology | `astronomy-engine` (pure JS) |
| Voice | Whisper STT + GPT-4o + TTS-1 |
| Animations | React Native Reanimated ~4.1.1 |
| i18n | i18next (16 languages) |

---

## 📁 PROJECT STRUCTURE

```
veya-v4/
├── app/                          # Expo Router pages
│   ├── _layout.tsx              # Root layout (fonts, providers)
│   ├── index.tsx                # Entry point (redirect logic)
│   ├── (auth)/                  # Auth flow
│   │   ├── _layout.tsx          # Auth stack
│   │   ├── welcome.tsx          # Landing page
│   │   └── onboarding/          # 9-step onboarding
│   │       ├── _layout.tsx
│   │       ├── name.tsx         # Step 1
│   │       ├── birth-date.tsx   # Step 2
│   │       ├── birth-time.tsx   # Step 3
│   │       ├── birth-place.tsx  # Step 4
│   │       ├── chart-reveal.tsx # Step 5 (wow moment)
│   │       ├── personality.tsx  # Step 6
│   │       ├── methodology.tsx  # Step 7
│   │       ├── purpose.tsx      # Step 8
│   │       └── interests.tsx    # Step 9 → tabs
│   └── (tabs)/                  # Main app
│       ├── _layout.tsx          # Tab navigator
│       ├── index.tsx            # Today ☀️
│       ├── chat.tsx             # AI Chat 💬
│       ├── explore.tsx          # Discovery 🔮
│       ├── rituals.tsx          # Rituals 🌙
│       └── profile.tsx          # You 👤
│
├── src/
│   ├── components/
│   │   ├── home/               # Today tab components
│   │   │   ├── DailyBriefingCard.tsx
│   │   │   ├── DoAndDontCard.tsx
│   │   │   ├── EnergyMeter.tsx
│   │   │   ├── StreakCounter.tsx
│   │   │   └── TransitHighlights.tsx
│   │   ├── shared/             # Reusable components
│   │   │   ├── CompatibilityModal.tsx
│   │   │   ├── MoonPhase.tsx
│   │   │   ├── NatalChart.tsx
│   │   │   ├── ShareableCard.tsx
│   │   │   ├── ShareButton.tsx
│   │   │   ├── TarotCard.tsx
│   │   │   └── ZodiacIcon.tsx
│   │   ├── voice/              # Voice AI
│   │   │   ├── VoiceButton.tsx
│   │   │   ├── VoiceInterface.tsx
│   │   │   └── VoicePortal.tsx
│   │   ├── onboarding/
│   │   │   ├── OnboardingLayout.tsx
│   │   │   └── StepIndicator.tsx
│   │   └── ui/                 # Base UI
│   │       ├── AnimatedPressable.tsx
│   │       ├── DesignTokens.ts
│   │       ├── GradientCard.tsx
│   │       └── SectionHeader.tsx
│   │
│   ├── services/               # Business logic
│   │   ├── ai.ts              # OpenAI API calls
│   │   ├── aiContext.ts       # Smart prompt builder ⭐
│   │   ├── astroEngine.ts     # Astronomy calculations ⭐
│   │   ├── dailyReading.ts    # Daily reading generator
│   │   ├── dailyReadingGenerator.ts
│   │   ├── notificationService.ts
│   │   ├── onboarding.ts      # Onboarding flow
│   │   ├── rag.ts             # Memory/RAG
│   │   ├── shareService.ts    # Share cards
│   │   ├── streakService.ts   # Streak tracking
│   │   ├── voiceService.ts    # Voice AI ⭐
│   │   └── widgetService.ts
│   │
│   ├── stores/                 # Zustand state
│   │   ├── chatStore.ts       # Chat messages
│   │   ├── onboardingStore.ts # Onboarding data
│   │   ├── readingStore.ts    # Daily readings
│   │   ├── streakStore.ts     # Streak data
│   │   ├── userStore.ts       # User profile
│   │   └── voiceStore.ts      # Voice state
│   │
│   ├── lib/
│   │   ├── openai.ts          # OpenAI client
│   │   └── supabase.ts        # Supabase client
│   │
│   ├── data/
│   │   └── tarotDeck.ts       # 78 tarot cards
│   │
│   ├── theme/
│   │   ├── colors.ts          # Color palette
│   │   ├── typography.ts      # Fonts
│   │   ├── spacing.ts         # Spacing scale
│   │   ├── borderRadius.ts
│   │   ├── shadows.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   │
│   ├── constants/
│   │   ├── veyaPrompt.ts      # Chat prompt
│   │   └── veyaVoicePrompt.ts # Voice prompt
│   │
│   └── i18n/
│       └── index.ts           # i18next setup
│
├── assets/                     # Images, fonts
├── agents/                     # Agent prompt files
├── .env.local                 # Environment variables
├── app.json                   # Expo config
├── eas.json                   # EAS build config
├── package.json
└── tsconfig.json
```

---

## 🔧 KEY SERVICES EXPLAINED

### 1. `astroEngine.ts` — Real Astronomical Calculations
Uses `astronomy-engine` (pure JS) for accurate planetary positions.

**Functions**:
- `getCurrentTransits(date)` — All planet positions right now
- `getMoonPhase(date)` — Phase, sign, illumination
- `calculateNatalChart(birthData)` — Full birth chart
- `calculateAspects(transits, natal)` — Transit-to-natal aspects
- `getDailyTransitSummary(date, natal)` — Daily cosmic weather

### 2. `aiContext.ts` — Smart Prompt Builder ⭐
Builds personalized AI context by combining:
- Current date/time
- Real planetary transits
- User's natal chart
- Moon phase
- RAG memories

**Main function**: `buildSmartContext(userData)` → returns enriched system prompt

### 3. `voiceService.ts` — Voice AI Pipeline
Flow: Tap mic → Record → Whisper STT → GPT-4o → TTS playback

### 4. `ai.ts` — OpenAI API Integration
Chat completion with smart context injection.

---

## 🎨 DESIGN SYSTEM

### Colors (Cosmic Dark Theme)
```typescript
colors = {
  background: '#0F0B1A',      // Deep space
  surface: '#1A1625',         // Card backgrounds
  surfaceHover: '#252033',
  primary: '#7C3AED',         // Cosmic purple
  primaryLight: '#A78BFA',
  accent: '#F59E0B',          // Warm gold
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
}
```

### Typography
- **Headers**: Playfair Display (elegant serif)
- **Body**: Inter (clean sans-serif)

### UI Patterns
- Card-based layouts
- Cosmic gradients (purple → blue → black)
- Subtle glow effects
- Smooth animations
- 5-tab navigation: Today, Chat, Explore, Rituals, Profile

---

## 🔴 KNOWN ISSUES (from PHASE1_MASTERPLAN.md)

### P0 — Critical
1. ✅ Chat AI wrong date — FIXED (uses aiContext.ts)
2. ✅ Real transits — FIXED (uses astronomy-engine)
3. ✅ Premium unlocked — FIXED

### P1 — High Priority
1. ✅ Voice AI pipeline — FIXED (race condition resolved)
2. ✅ Tarot card system — FIXED (78 cards + reveal)
3. ⚠️ Rituals — Partially working (needs polish)

### P2 — Medium Priority
1. ✅ Compatibility engine — Working
2. ⚠️ Transit calendar — Needs real data integration
3. ⚠️ Cosmic patterns — Needs implementation

### Remaining Issues
- TypeScript errors (non-blocking, Supabase types)
- Supabase schema missing columns (see SUPABASE_AUDIT.md)
- Some animations need performance optimization

---

## 📱 APP FLOW

### Onboarding (9 screens)
```
Welcome → Name → Birth Date → Birth Time → Birth Place 
→ Chart Reveal (wow!) → Personality → Methodology 
→ Purpose → Interests → Main App
```

### Main App (5 tabs)
1. **Today** ☀️ — Daily briefing, energy meter, do/don't
2. **Chat** 💬 — AI conversation with voice
3. **Explore** 🔮 — Tarot, compatibility, transits
4. **Rituals** 🌙 — Morning/evening rituals, journal
5. **Profile** 👤 — Settings, birth chart, account

---

## 🔑 ENVIRONMENT VARIABLES

```bash
# .env.local
EXPO_PUBLIC_SUPABASE_URL=https://ennlryjggdoljgbqhttb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=***
EXPO_PUBLIC_OPENAI_API_KEY=***
```

---

## 🚀 BUILD & DEPLOY

```bash
# Source credentials
source /home/ubuntu/.openclaw/env.sh

# Development
cd /home/ubuntu/.openclaw/workspace/veya-v4
npm start

# Build for testing
npx eas build --platform all --profile preview

# OTA Update
npx eas update --branch preview --message "description"

# Push to GitHub
git add . && git commit -m "message" && git push origin master
```

---

## 📊 SUPABASE TABLES

| Table | Status | Notes |
|-------|--------|-------|
| user_profiles | ✅ | Missing `name` column |
| birth_charts | ✅ | Working |
| daily_readings | ✅ | Working |
| ai_conversations | ✅ | Missing `messages` column |
| rituals | ✅ | Missing `completed_at`, `data` |
| streaks | ✅ | Working |
| user_embeddings | ✅ | RAG storage |

---

## 🎯 SUCCESS CRITERIA

| Feature | "Working" Definition |
|---------|---------------------|
| Chat AI | Shows correct date, references user's placements, real transits |
| Voice AI | Tap → speak → hear response in <5 seconds |
| Today Tab | Shows real daily reading, correct moon phase |
| Tarot | Tap card → flip animation → AI interpretation |
| Compatibility | Enter partner → real synastry score |
| Rituals | Breathing timer works, intentions save |

---

## 🤖 AGENT ORCHESTRATION NOTES

### For Orchestrator (Claude Opus 4.6)
- You have full context — use it wisely
- Break tasks into atomic units for GPT Codex agents
- Always specify exact file paths for sub-agents
- Validate outputs before accepting

### For Developer Agent (GPT 5.2 Codex)
- Cannot read entire codebase
- Needs: specific files, clear task, success criteria
- One task at a time
- Returns code + explanation

### For Design Agent (Claude Opus 4.6)
- Has full context + design tools
- Creates beautiful React Native components
- References theme system
- Outputs screenshot-worthy UI

### For QA Agent (GPT 5.2 Codex)
- Tests specific features
- Validates with clear scenarios
- Reports bugs with reproduction steps
- Checks TypeScript, renders, data flow

---

*This document is the single source of truth for VEYa V4 development.*
