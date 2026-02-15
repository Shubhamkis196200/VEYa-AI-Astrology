# VEYa V4 Overnight Build Plan
## Mission: Production-Ready App by Morning

**Started:** 2026-02-15 03:30 UTC
**Target:** 2026-02-15 09:00 UTC (6 hours)
**Owner:** Shubham Kishore

---

## CRITICAL REQUIREMENTS

### DO NOT IMPLEMENT:
- ❌ Payment/Subscription
- ❌ Authentication/Login

### MUST FIX:
- ✅ Design consistency across ALL screens
- ✅ Navigation — features MUST be easy to find
- ✅ "Wow effect" — users should be delighted discovering features
- ✅ All features must ACTUALLY WORK (not just exist)
- ✅ Visual polish — looks professional, not prototype

---

## DESIGN PRINCIPLES (from UX research)

### 1. Navigation Hierarchy
```
TODAY (Home) — Daily essentials, entry point
├── Stories carousel (top)
├── Main insight card (prominent)
├── Quick actions (clearly labeled)
├── Weather + Moon (glanceable)
└── Voice button (floating, obvious)

DISCOVER — Exploration hub
├── Birth Chart (hero section)
├── Tools grid (Tarot, Compatibility, etc.)
├── Transit Calendar
└── Learning content

CHAT — AI Companion
├── Full-screen chat
├── Suggested prompts
└── Voice input option

PROFILE — Personal space
├── User info + chart summary
├── Journal entries
├── Achievements/Progress
├── Settings
```

### 2. Feature Discoverability
- Every feature needs a CLEAR entry point
- Use cards with icons + titles + brief descriptions
- Group related features together
- Add subtle animations to draw attention

### 3. Visual Consistency
- Color palette: Deep purple (#1a1a2e) base, gold (#FFD700) accents
- Typography: Playfair for headers, Inter for body
- Spacing: 16px base unit
- Border radius: 16px for cards, 24px for modals
- Gradients: Purple to indigo for backgrounds

### 4. The "Wow Effect"
- Smooth transitions between screens
- Micro-animations on interactions
- Particle effects for cosmic theme
- Haptic feedback on key actions
- Progressive disclosure of features

---

## PHASES

### Phase 1: UX Research & Architecture (30 min)
- [ ] Analyze top astrology apps (Co-Star, Pattern, Sanctuary)
- [ ] Document their navigation patterns
- [ ] Create feature map for VEYa
- [ ] Plan information architecture

### Phase 2: Navigation Overhaul (1 hour)
- [ ] Redesign tab bar with clear icons + labels
- [ ] Create feature discovery sections on each tab
- [ ] Add section headers and descriptions
- [ ] Implement smooth tab transitions
- [ ] Add onboarding tooltips for features

### Phase 3: Today Tab Polish (1 hour)
- [ ] Hero greeting card with personalization
- [ ] Stories carousel (working, tappable)
- [ ] Daily insight card (prominent, shareable)
- [ ] Cosmic weather widget (clear, informative)
- [ ] Moon phase display (beautiful, accurate)
- [ ] Quick actions bar (Voice, Journal, Share)
- [ ] Moment capture (easy to find)

### Phase 4: Discover Tab Complete (1.5 hours)
- [ ] Birth chart viewer (interactive, zoomable)
- [ ] House system toggle (visible, working)
- [ ] "Explain My Chart" button (prominent)
- [ ] Feature cards grid:
  - Tarot Reading
  - Compatibility Checker
  - Transit Calendar
  - Planetary Hours
  - Retrograde Tracker
- [ ] Each feature: icon, title, description, tap to open

### Phase 5: Chat Tab Enhancement (45 min)
- [ ] Clean chat interface
- [ ] Suggested conversation starters
- [ ] AI responds with astrology context
- [ ] Message history persists
- [ ] Voice input button
- [ ] Typing indicator

### Phase 6: Profile Tab Complete (45 min)
- [ ] User profile header with signs
- [ ] Birth chart summary card
- [ ] Journal section with entries list
- [ ] Create journal entry flow
- [ ] Achievements/badges display
- [ ] Cosmic Year Timeline
- [ ] Settings (notifications, preferences)

### Phase 7: Cross-Feature Polish (1 hour)
- [ ] Consistent card designs
- [ ] Unified color scheme
- [ ] Typography hierarchy
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Animations and transitions

### Phase 8: Full QA & Deploy (30 min)
- [ ] Test every feature systematically
- [ ] Fix any broken features
- [ ] Remove debug code
- [ ] Deploy to Expo
- [ ] Create summary report

---

## QA CHECKLIST

### Today Tab
- [ ] App loads without crash
- [ ] Greeting shows correct time + name
- [ ] Stories carousel scrolls and taps work
- [ ] Insight card shows real transit data
- [ ] Weather widget updates correctly
- [ ] Moon phase is astronomically accurate
- [ ] Voice button opens voice interface
- [ ] Moment capture saves correctly

### Discover Tab
- [ ] Birth chart renders with real data
- [ ] House toggle switches view
- [ ] Explain chart calls AI
- [ ] Tarot: card selection + interpretation
- [ ] Compatibility: input + results
- [ ] Transit calendar shows events
- [ ] All features accessible within 2 taps

### Chat Tab
- [ ] Can send messages
- [ ] AI responds appropriately
- [ ] History persists across sessions
- [ ] Voice input works

### Profile Tab
- [ ] Profile info displays correctly
- [ ] Can create journal entry
- [ ] Can view journal entries
- [ ] Achievements show progress
- [ ] Settings options work

### Global
- [ ] No crashes on any screen
- [ ] No infinite loading states
- [ ] Consistent design language
- [ ] Smooth transitions
- [ ] Features easy to find

---

## STATUS UPDATES

Format for 15-minute updates:
```
🔄 VEYa Build Update [TIME]
Phase: X/8 - [Phase Name]
Progress: X%
Currently: [What's being worked on]
Completed: [Recent completions]
Issues: [Any blockers]
```

---

## LOOP PROTECTION

- Max 10 retries per feature fix
- If stuck, document in QA_RESULTS.md and move on
- Prioritize working features over perfect features
- Deploy incrementally (after each phase)

---

## AGENT ASSIGNMENTS

| Agent | Responsibility |
|-------|---------------|
| OMEGA | Orchestration, architecture decisions |
| ALPHA | UI implementation, component building |
| BETA | QA testing, bug finding |
| GAMMA | Design consistency, visual polish |
| DELTA | Deployment, build management |

Agents communicate via task-queue.json and output files.
