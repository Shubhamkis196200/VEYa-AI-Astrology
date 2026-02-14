# VEYa V4 — Multi-Agent Implementation Plan

> **Goal**: Build a robust, working VEYa V4 app using specialized agents with proper orchestration
> **Date**: 2026-02-14

---

## 🏗️ AGENT ARCHITECTURE

### Overview
```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR (Claude Opus 4.6)               │
│                    1M Token Context Window                       │
│                    Full System Understanding                     │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   DEVELOPER   │     │    DESIGN     │     │      QA       │
│  GPT 5.2 Codex│     │ Claude Opus   │     │ GPT 5.2 Codex │
│               │     │   4.6 (1M)    │     │               │
│ - Code tasks  │     │ - UI/UX       │     │ - Testing     │
│ - Debug fixes │     │ - Components  │     │ - Validation  │
│ - Build/Deploy│     │ - Animations  │     │ - Research    │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## 1. 🎯 ORCHESTRATOR AGENT

**Model**: `amazon-bedrock/us.anthropic.claude-opus-4-6-v1` (1M context)
**Role**: Master coordinator — reads ENTIRE codebase, plans tasks, delegates to specialists
**ID**: `veya-orchestrator`

### Responsibilities
- Load full VEYa V4 codebase into context
- Understand project state, bugs, requirements
- Break down work into atomic tasks for sub-agents
- Validate outputs before merging
- Maintain project coherence

### System Prompt Context (CLAUDE.md)
- Full project structure
- All service files
- Current bugs/issues
- Feature requirements
- API configurations

### Tools Access
- `read`, `write`, `edit` (full filesystem)
- `sessions_spawn`, `sessions_send`, `sessions_list`, `sessions_history`
- `exec` (for git, build commands)
- `memory_search`, `memory_get`

---

## 2. 💻 DEVELOPER AGENT

**Model**: `openai/gpt-5.2-codex` (256K context)
**Role**: Code implementation, debugging, fixing issues
**ID**: `veya-developer`

### Responsibilities
- Implement specific features (one at a time)
- Fix bugs with clear reproduction steps
- Write TypeScript/React Native code
- Handle Expo builds and deployments

### Key Limitation ⚠️
GPT Codex cannot read entire system — MUST receive:
1. Specific file paths to read
2. Clear task description
3. Expected output format
4. Related context (max 5-10 files)

### Tools Access
- `read`, `write`, `edit`
- `exec` (npm, expo, eas commands)
- `web_fetch` (documentation lookup)

### API Keys Needed
- `EXPO_TOKEN` — builds
- `GITHUB_TOKEN` — push code
- `OPENAI_API_KEY` — AI features in app
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — backend

### Task Format (from Orchestrator)
```markdown
## TASK: [Feature/Bug Name]

### Context Files (READ THESE FIRST)
1. `/path/to/file1.tsx` — Main component
2. `/path/to/file2.ts` — Related service

### Current Issue
[Clear description of what's broken]

### Expected Behavior
[What should happen]

### Implementation Steps
1. Step 1
2. Step 2
3. Step 3

### Success Criteria
- [ ] Criteria 1
- [ ] Criteria 2
```

---

## 3. 🎨 DESIGN AGENT

**Model**: `amazon-bedrock/us.anthropic.claude-opus-4-6-v1` (1M context)
**Role**: UI/UX design, components, animations, visual polish
**ID**: `veya-designer`

### Responsibilities
- Create beautiful React Native components
- Implement cosmic gradients, animations
- Design onboarding flows
- Make every screen "screenshot-worthy"
- Research competitor designs for inspiration

### Tools Access
- `read`, `write`, `edit`
- `web_search`, `web_fetch` (design research)
- `browser` (screenshot competitor apps)
- `image` (analyze design references)

### API Keys Needed
- `FIGMA_ACCESS_TOKEN` — extract designs
- `TWENTY_FIRST_API_KEY` — 21st.dev Magic UI generation
- `BRAVE_API_KEY` — design research
- `PERPLEXITY_API_KEY` — design trends research
- `EXA_API_KEY` — semantic design search

### Design Resources to Load
- VEYa Master Blueprint (design section)
- Competitor screenshots
- Theme tokens (`src/theme/`)
- Existing component patterns

---

## 4. 🧪 QA AGENT

**Model**: `openai/gpt-5.2-codex` (256K context)
**Role**: Testing, validation, bug detection, research
**ID**: `veya-qa`

### Responsibilities
- Test features after Developer implements
- Validate astrological calculations (astronomy-engine)
- Check UI renders correctly
- Research edge cases
- Document bugs with reproduction steps

### Key Limitation ⚠️
Same as Developer — needs specific, scoped tasks

### Tools Access
- `read`, `write`, `edit`
- `exec` (run tests, expo start)
- `web_search`, `web_fetch` (research)
- `browser` (manual testing)

### API Keys Needed
- `PERPLEXITY_API_KEY` — research
- `BRAVE_API_KEY` — search
- `EXA_API_KEY` — semantic search
- `EXPO_TOKEN` — test builds

### Test Format (from Orchestrator)
```markdown
## TEST: [Feature Name]

### Files to Verify
1. `/path/to/component.tsx`
2. `/path/to/service.ts`

### Test Scenarios
1. Scenario 1: [Expected outcome]
2. Scenario 2: [Expected outcome]

### Validation Criteria
- [ ] No TypeScript errors
- [ ] Component renders without crash
- [ ] Data flows correctly
- [ ] Edge cases handled
```

---

## 📋 IMPLEMENTATION STEPS

### Phase 1: Setup Agents (Today)
1. ✅ Create agent configurations in `openclaw.json`
2. ✅ Create CLAUDE.md for VEYa V4 with full context
3. ✅ Create agent-specific prompt files
4. ✅ Test each agent can spawn and communicate

### Phase 2: Orchestrator Loads Context
1. Orchestrator reads entire VEYa V4 codebase
2. Orchestrator reads PHASE1_MASTERPLAN.md
3. Orchestrator creates prioritized task list
4. Orchestrator identifies current blockers

### Phase 3: Execute Tasks
1. Orchestrator breaks work into atomic tasks
2. Developer receives focused coding tasks
3. Designer receives UI/UX tasks
4. QA validates each completed task
5. Orchestrator reviews and merges

### Phase 4: Build & Deploy
1. Developer runs `eas build`
2. QA tests on device
3. Orchestrator validates everything works
4. Deploy to Expo

---

## 🔄 WORKFLOW EXAMPLE

```
1. YOU → Orchestrator: "Fix the chat AI showing wrong date"

2. Orchestrator (reads codebase):
   - Identifies: src/services/aiContext.ts, src/services/ai.ts
   - Understands: System prompt doesn't inject current date
   
3. Orchestrator → Developer:
   "TASK: Fix date injection in AI context
   FILES: aiContext.ts (lines 1-50), ai.ts (lines 20-80)
   ISSUE: Date is hardcoded or missing
   FIX: Add new Date().toISOString() to buildContext()"
   
4. Developer → implements fix → returns code

5. Orchestrator → QA:
   "TEST: Verify chat AI shows correct date
   FILES: aiContext.ts
   SCENARIO: Send 'what day is it?' — should return Feb 14, 2026"
   
6. QA → tests → reports success/failure

7. Orchestrator → YOU: "Fixed. Chat now shows correct date."
```

---

## 🔑 API KEY DISTRIBUTION

| Agent | APIs |
|-------|------|
| **Orchestrator** | ALL (full system access) |
| **Developer** | EXPO, GITHUB, OPENAI, SUPABASE, AZURE |
| **Designer** | FIGMA, 21ST_DEV, BRAVE, PERPLEXITY, EXA |
| **QA** | PERPLEXITY, BRAVE, EXA, EXPO |

---

## 📁 FILES TO CREATE

1. `/veya-v4/CLAUDE.md` — Full project context (for Opus 4.6)
2. `/veya-v4/agents/DEVELOPER.md` — Developer agent prompt
3. `/veya-v4/agents/DESIGNER.md` — Designer agent prompt
4. `/veya-v4/agents/QA.md` — QA agent prompt
5. Update `openclaw.json` — Add new agent configurations

---

## ⚠️ CRITICAL RULES

### For GPT Codex Agents (Developer, QA)
1. **NEVER** ask them to "understand the whole project"
2. **ALWAYS** provide specific file paths
3. **LIMIT** context to 5-10 files per task
4. **DEFINE** clear success criteria
5. **ONE** task at a time

### For Claude Opus Agents (Orchestrator, Designer)
1. **CAN** load large context (up to 1M tokens)
2. **USE** for planning, architecture, design
3. **USE** for code review and validation
4. **USE** for research-heavy tasks

### Communication Flow
```
User → Orchestrator (always)
Orchestrator → Specialists (via sessions_spawn)
Specialists → Orchestrator (results)
Orchestrator → User (final response)
```

---

## 🚀 READY TO IMPLEMENT

Confirm to proceed with:
1. Creating agent configurations
2. Creating CLAUDE.md with full VEYa V4 context
3. Creating agent-specific prompts
4. Testing the multi-agent workflow
