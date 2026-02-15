# VEYa V4 — UX Research & Architecture

> Phase 1 Overnight Build | Completed: Feb 15, 2026

---

## 1. Competitive Analysis: Top Astrology Apps

### Co-Star (Gold Standard)

**Navigation Philosophy:**
- **Minimalist approach**: Clean, monochrome aesthetic with strategic purple accents
- **One notification per day**: "Day at a Glance" — creates anticipation, prevents notification fatigue
- **Social-first design**: App designed to open with friends at bars/brunch
- **2-tap rule**: Every feature reachable in maximum 2 taps

**Key Design Decisions:**
- Black/white palette with constellation illustrations
- Hyper-personalized daily insights (famously "brutally honest")
- Compatibility with friends as a core social feature
- Birth chart complexity hidden behind simple UI
- Shareable content optimized for Twitter/social virality

**What Makes It Work:**
> "People flock to Co-Star because they realize the existing spaces are too crowded, loud and brazen — and we're showing them a different type of online experience that's personal, emotional and deep." — Andrew Lu, Lead Designer

### The Pattern

**Navigation Philosophy:**
- **Deep psychological insights** over daily horoscopes
- **Timing-based notifications**: "Your [aspect] is active now"
- **Gradual content revelation**: Features unlock over time
- **Social bonds focus**: Emphasizes relationship compatibility

**Key Design Decisions:**
- Dark mode default with cosmic gradients
- Pattern "worlds" for different life areas
- Heavy use of circular/orbital navigation metaphors
- Push notifications tied to actual planetary transits

### Sanctuary

**Navigation Philosophy:**
- **Live readings** as differentiator (human astrologers)
- **Educational approach**: Teaches astrology concepts
- **Tab-based navigation**: Clear separation of features
- **Premium upsell**: Free features lead to paid readings

**Key Design Decisions:**
- Warm, approachable color palette
- Video/audio content integration
- Clear "book a reading" CTAs throughout
- Community features and forums

---

## 2. Navigation Best Practices (Synthesized)

### The 2-Tap Rule
Every feature should be accessible within 2 taps from home. This is the gold standard.

| Tap 1 | Tap 2 | Feature |
|-------|-------|---------|
| Today (Home) | - | Daily insight, weather, streak |
| Today | Feature card | Tarot, Chart, Compatibility |
| Chat | - | AI conversation |
| Discover | Section | Deep dive features |
| You | - | Profile, settings |

### Feature Discovery Patterns

1. **Quick Actions Grid**: 4-6 colorful cards on home screen
2. **Section Headers**: Clear labels with icons (not just icons)
3. **Subtle Animations**: Entrance animations guide attention
4. **Progressive Disclosure**: Show preview → tap for full feature

### Visual Hierarchy Guidelines

```
Priority 1: Today's Insight (the "money shot")
Priority 2: Quick Actions Grid (feature discovery)
Priority 3: Secondary Content (weather, streak, etc.)
Priority 4: Navigation Elements (always visible but not dominant)
```

---

## 3. VEYa V4 Feature Inventory

### Current Tab Structure (4 tabs ✅)

| Tab | Purpose | Status |
|-----|---------|--------|
| **Today** | Daily home screen | ✅ Primary |
| **Chat** | AI conversation | ✅ Working |
| **Discover** | Deep features | ✅ Content-rich |
| **You** | Profile/settings | ⚠️ Needs work |

### Feature Map by Location

#### Today Tab (Home)
- [x] Daily Insight Card (AI-generated)
- [x] Daily Briefing Card (expandable)
- [x] Streak Counter
- [x] Energy Meter
- [x] Do & Don't Card
- [x] Transit Highlights
- [x] Cosmic Weather Widget
- [x] Daily Affirmation
- [x] Quick Feature Cards (discovery)
- [x] AstroStories (Instagram-style)
- [x] Voice Interface

#### Chat Tab
- [x] AI Chat Interface
- [x] Message History
- [ ] Suggested Questions (missing)
- [ ] Voice Input (partial)

#### Discover Tab
- [x] Natal Birth Chart (interactive)
- [x] Compatibility Check
- [x] Tarot Card Pull
- [x] Moon Phase Tracker
- [x] Transit Calendar
- [x] Cosmic Year Timeline
- [x] Soundscape Player
- [x] Soul Connection Screen

#### You Tab
- [ ] Profile Display (minimal)
- [ ] Settings (incomplete)
- [ ] Birth Data Edit
- [ ] Notification Preferences
- [ ] Theme/Appearance
- [ ] Export Data
- [ ] Delete Account

### Hidden/Accessible Screens
- `explore` - Legacy, hidden
- `profile` - Legacy, hidden  
- `rituals` - Planned feature, hidden

### Components Library (74 files)

**Home Components (9):**
- CosmicWeatherWidget
- DoAndDontCard
- TransitHighlights
- StreakCounter
- OneInsightCard
- DailyBriefingCard
- DailyAffirmation
- EnergyMeter
- QuickFeatureCard

**Shared Components (13):**
- ShareableCard
- MomentCaptureButton
- CompatibilityModal
- SoundscapePlayer
- NatalChart
- ZodiacIcon
- MoonPhase
- TarotCard
- CosmicYearTimeline
- ShareCardDesigns
- LoadingStates
- AchievementToast
- ErrorBoundary

**UI Components (4):**
- GradientCard
- AnimatedPressable
- SectionHeader
- DesignTokens

**Voice Components (3):**
- VoiceInterface
- VoiceButton
- VoicePortal

**Stories Components (2):**
- StoryViewer
- AstroStories

**Social Components (1):**
- SoulConnectionScreen

**Onboarding Components (2):**
- StepIndicator
- OnboardingLayout

---

## 4. Services Architecture

| Service | Purpose | Status |
|---------|---------|--------|
| `ai.ts` | OpenAI integration, chat | ✅ Working |
| `aiContext.ts` | Prompt building, context | ✅ Working |
| `astroEngine.ts` | Planetary calculations | ✅ Working |
| `dailyReading.ts` | Daily content generation | ✅ Working |
| `dailyReadingGenerator.ts` | Complex reading logic | ✅ Working |
| `notificationService.ts` | Push notifications | ⚠️ Basic |
| `onboarding.ts` | Onboarding flow | ✅ Working |
| `rag.ts` | RAG for AI responses | ⚠️ Minimal |
| `rateLimiter.ts` | API rate limiting | ✅ New |
| `shareService.ts` | Social sharing | ✅ Working |
| `smartNotifications.ts` | Smart push timing | ✅ New |
| `soundscapeService.ts` | Ambient sounds | ✅ Working |
| `streakService.ts` | Streak tracking | ✅ Working |
| `voiceService.ts` | Voice I/O | ⚠️ Partial |
| `widgetService.ts` | Home widgets | ✅ New |

---

## 5. Specific Recommendations for VEYa

### High Priority (Do First)

1. **Complete the "You" Tab**
   - Profile display with birth chart summary
   - Settings organized by category
   - Clear edit birth data flow
   - Notification preferences

2. **Add Suggested Questions to Chat**
   - "What should I focus on today?"
   - "Tell me about my rising sign"
   - "What's my moon sign about?"
   - "How's my compatibility with [Taurus]?"

3. **Improve Feature Discovery**
   - Make Quick Actions more prominent
   - Add "New" badges to features
   - Show feature tooltips on first use

### Medium Priority

4. **Social Sharing Polish**
   - Pre-designed shareable cards
   - Story-format exports
   - Direct share to Instagram Stories

5. **Onboarding Refinement**
   - Show value props earlier
   - Skip option for returning users
   - Progress persistence

6. **Voice Experience**
   - Complete voice commands
   - Voice response option
   - Ambient mode while listening

### Lower Priority (Nice to Have)

7. **Rituals Tab**
   - Morning/evening routines
   - Moon ritual suggestions
   - Meditation guides

8. **Widget System**
   - iOS home screen widget
   - Lock screen widget
   - Daily insight widget

9. **Gamification**
   - Achievement badges
   - Streak milestones
   - Learning progress

---

## 6. Design System Recommendations

### Color Usage
```
Primary: #8B5CF6 (VEYa Purple)
Background: #FDFBF7 (Warm Cream)
Surface: #FFFFFF (Cards)
Text Primary: #1A1A2E (Near Black)
Text Muted: #9B9BAD (Secondary)
Border: #E5DFD5 (Subtle)
```

### Typography Hierarchy
```
H1: Inter-Bold, 28px (Page titles)
H2: Inter-SemiBold, 22px (Section headers)
H3: Inter-SemiBold, 18px (Card titles)
Body: Inter-Regular, 16px (Content)
Caption: Inter-Medium, 13px (Labels)
```

### Spacing System
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
xxl: 48px
```

### Animation Guidelines
- Use `FadeInUp` for content appearing
- 300-400ms duration for most transitions
- Stagger delays by 50-100ms for lists
- Haptic feedback on meaningful actions

---

## 7. Architecture Decisions

### State Management
- Zustand stores for global state
- Local useState for component state
- AsyncStorage for persistence

### Navigation Pattern
```
app/
├── _layout.tsx          # Root layout
├── index.tsx            # Redirect to auth/tabs
├── (auth)/              # Authentication flow
│   ├── _layout.tsx
│   ├── welcome.tsx
│   └── onboarding/      # Multi-step onboarding
└── (tabs)/              # Main app (protected)
    ├── _layout.tsx      # Tab navigator
    ├── index.tsx        # Today
    ├── chat.tsx         # Chat
    ├── discover.tsx     # Discover
    └── you.tsx          # Profile
```

### API Pattern
```typescript
// All AI calls go through ai.ts
// Rate limiting in rateLimiter.ts
// Context building in aiContext.ts
```

---

## 8. Success Metrics

### User Experience
- [ ] 2-tap access to all features
- [ ] < 3s load time for any screen
- [ ] No dead ends in navigation
- [ ] Clear labels on all features

### Engagement
- [ ] Daily notification opens app
- [ ] Social sharing increases
- [ ] Streak continuation rate > 70%
- [ ] Chat messages per session > 3

---

*Research compiled from competitive analysis and codebase review*
*Ready for Phase 2: Quick Actions Implementation*
