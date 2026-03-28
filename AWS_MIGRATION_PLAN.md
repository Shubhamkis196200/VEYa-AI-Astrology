# VEYa AWS Migration Plan
**Date:** 2026-03-28
**From:** Supabase (self-hosted PostgreSQL + Auth + Edge Functions + pgvector)
**To:** AWS Native Services
**Status:** Planning

---

## Current Supabase Usage Inventory

### 1. Authentication (`supabase.auth.*`)
| File | Call | Purpose |
|------|------|---------|
| `app/_layout.tsx` | `auth.onAuthStateChange()` | Listen for login/logout events |
| `app/_layout.tsx` | `auth.getSession()` | Check session on startup |
| `src/services/onboarding.ts` | `auth.getUser()` | Get current user before saving data |

### 2. Database (`supabase.from().*`)
| File | Table | Operation | Purpose |
|------|-------|-----------|---------|
| `src/services/onboarding.ts` | `user_profiles` | upsert | Save user profile after onboarding |
| `src/services/onboarding.ts` | `birth_charts` | insert | Save natal chart data |
| `src/services/dailyReading.ts` | `daily_readings` | upsert | Cache AI-generated daily readings |
| `src/services/streakService.ts` | `streaks` | upsert, update | Track daily check-in streaks |
| `src/services/rag.ts` | `user_embeddings` | insert | Store vector embeddings for RAG |
| `src/services/rag.ts` | `ai_conversations` | insert | Store conversation history |

### 3. RPC / pgvector (`supabase.rpc()`)
| File | Function | Purpose |
|------|----------|---------|
| `src/services/ai.ts` | `match_user_embeddings` | Vector similarity search for RAG memory |

### 4. Edge Functions (`supabase.functions.invoke()`)
| File | Usage | Purpose |
|------|-------|---------|
| `src/services/ai.ts` | `invoke(name, {body})` | Server-side AI processing (API key proxy) |

### 5. DB Tables Full Schema
| Table | Key Columns | AWS Target |
|-------|-------------|-----------|
| `user_profiles` | user_id, display_name, birth_date, birth_time, sun_sign, moon_sign, rising_sign, focus_areas | RDS PostgreSQL |
| `birth_charts` | user_id, house_system, sun_sign, moon_sign, rising_sign, chart_data (JSONB) | RDS PostgreSQL |
| `daily_readings` | user_id, reading_date, reading_text, energy_level, transit_highlights (JSONB) | RDS PostgreSQL |
| `streaks` | user_id, streak_type, current_streak, longest_streak, total_check_ins, last_check_in | RDS PostgreSQL |
| `user_embeddings` | user_id, content, embedding (pgvector), content_type, metadata (JSONB) | RDS PostgreSQL + pgvector extension |
| `ai_conversations` | user_id, session_id, role, content, model, tokens_used | RDS PostgreSQL |

---

## AWS Service Equivalents

| Supabase Feature | AWS Equivalent | Notes |
|-----------------|----------------|-------|
| **Auth** | **AWS Cognito** | User Pools for email/social auth, identity pools for federated identity |
| **PostgreSQL DB** | **AWS RDS PostgreSQL** | Enable pgvector extension for embeddings |
| **Edge Functions** | **AWS Lambda + API Gateway** | REST API for server-side AI processing |
| **Realtime** | **AWS AppSync (GraphQL subscriptions)** | Or API Gateway WebSockets for simpler use |
| **File Storage** | **AWS S3** | For birth chart images, share cards, audio |
| **Row Level Security** | **RDS + App-level JWT validation** | Validate Cognito JWT in Lambda before DB access |
| **pgvector** | **RDS PostgreSQL with pgvector extension** | Supported on RDS PostgreSQL 15+ |

---

## Migration Phases

### Phase 0: Preparation (No Code Changes Yet)
**Effort:** 3-5 days
**Goal:** Set up AWS infrastructure, keep Supabase running in parallel

Tasks:
- [ ] Create AWS account / set up organization
- [ ] Configure VPC, subnets, security groups
- [ ] Provision RDS PostgreSQL 15+ instance (enable pgvector extension)
- [ ] Set up AWS Cognito User Pool (configure email/password + Google/Apple OAuth)
- [ ] Create S3 bucket for media assets
- [ ] Set up API Gateway + Lambda scaffold
- [ ] Install AWS Amplify SDK (replaces Supabase client) or use custom fetch wrapper
- [ ] Run Supabase DB export: `pg_dump` full schema + data

### Phase 1: Auth Migration
**Effort:** 4-6 days
**Files affected:** `app/_layout.tsx`, `src/services/onboarding.ts`, `src/lib/supabase.ts`
**Risk:** MEDIUM — auth touches session management across the whole app

Steps:
1. Configure Cognito User Pool with same OAuth providers (Google, Apple)
2. Create `src/lib/auth.ts` wrapping Cognito SDK (same interface as supabase.auth.*)
3. Replace `supabase.auth.onAuthStateChange()` with Cognito `Hub.listen('auth', ...)`
4. Replace `supabase.auth.getSession()` with `Auth.currentSession()`
5. Replace `supabase.auth.getUser()` with `Auth.currentAuthenticatedUser()`
6. Keep JWT handling: Cognito issues ID tokens (short-lived), refresh tokens (30 days)
7. Test login/logout/session restore flows on device

**Offline fallback during migration:** Keep `src/lib/supabase.ts` with a feature flag `USE_AWS_AUTH=true` to dual-run both auth systems until validated.

### Phase 2: Database Migration
**Effort:** 5-7 days
**Files affected:** All service files using `supabase.from()`
**Risk:** MEDIUM — schema must match exactly

Steps:
1. Apply Supabase `pg_dump` schema to RDS (tables, indexes, constraints)
2. Enable pgvector: `CREATE EXTENSION vector;` on RDS
3. Migrate data: `pg_dump --data-only | psql` to RDS
4. Create `src/lib/db.ts` — thin wrapper around `fetch()` calling Lambda endpoints
5. Replace each `supabase.from(table)` call with equivalent Lambda API call:
   - `POST /api/v1/user-profiles` (upsert)
   - `POST /api/v1/birth-charts` (insert)
   - `POST /api/v1/daily-readings` (upsert)
   - `POST /api/v1/streaks` (upsert/update)
   - `POST /api/v1/memories` (insert embedding)
   - `GET  /api/v1/memories/search` (vector similarity)
6. All Lambda functions validate Cognito JWT before executing queries
7. Row-level isolation enforced: `WHERE user_id = $1` in every query (parameterized)

### Phase 3: RAG / Vector Search Migration
**Effort:** 3-4 days
**Files affected:** `src/services/rag.ts`, `src/services/ai.ts`
**Risk:** LOW — isolated service, already has error handling

Steps:
1. Confirm pgvector on RDS: `SELECT * FROM pg_extension WHERE extname='vector';`
2. Re-create `match_user_embeddings` RPC as a Lambda function using raw SQL:
   ```sql
   SELECT content, metadata, 1 - (embedding <=> $1::vector) AS similarity
   FROM user_embeddings
   WHERE user_id = $2
   ORDER BY embedding <=> $1::vector
   LIMIT $3;
   ```
3. Replace `supabase.rpc('match_user_embeddings', ...)` with `fetch('/api/v1/memories/search', ...)`
4. Replace `supabase.functions.invoke(...)` with direct Lambda call or keep OpenAI direct

### Phase 4: Edge Functions Migration
**Effort:** 2-3 days
**Files affected:** `src/services/ai.ts`
**Risk:** LOW — only 1 edge function call, already has fallback

Steps:
1. Identify what the edge function does (likely OpenAI API key proxy)
2. Create Lambda function that forwards to OpenAI with server-side key
3. Update `src/services/ai.ts` line 124 to call Lambda URL instead
4. Note: direct OpenAI calls from client (key in env vars) may be sufficient for MVP

### Phase 5: Cleanup and Supabase Sunset
**Effort:** 1-2 days

Steps:
1. Remove `@supabase/supabase-js` from `package.json`
2. Delete `src/lib/supabase.ts`
3. Remove all `import { supabase }` references (9 files)
4. Delete Supabase project (keep as backup for 30 days)
5. Update `.env.local` with AWS credentials only

---

## What Can Be Done Offline (No Supabase Dependency)

These features work 100% without any backend:

| Feature | Implementation | Status |
|---------|---------------|--------|
| Daily reading generation | OpenAI direct call (`src/services/ai.ts`) | Working |
| Birth chart calculation | `astronomy-engine` (pure JS) | Working |
| Moon phase / transits | `astronomy-engine` (pure JS) | Working |
| Tarot card reading | Local deck (`src/data/tarotDeck.ts`) | Working |
| Voice AI (STT + TTS) | Whisper + OpenAI TTS | Working |
| Compatibility engine | Local calculation (`astroEngine.ts`) | Working |
| Streak tracking (local) | `AsyncStorage` via `streakStore.ts` | Working |
| Moment capture | `AsyncStorage` in `MomentCaptureButton.tsx` | Working |
| Planetary hours | Local calculation (`astroEngine.ts`) | Working |
| Retrograde tracker | Local calculation (`astroEngine.ts`) | Working |

Features that require a backend:
- User authentication (login/account creation)
- RAG memory (conversation history in DB)
- Cross-device sync (readings, streaks, moments)
- Onboarding data persistence to cloud

During migration downtime, the app can show a "Currently upgrading — your data is safe" notice while all local features continue working.

---

## Estimated Timeline

| Phase | Duration | Can Parallelize? |
|-------|----------|-----------------|
| Phase 0: Infrastructure | 3-5 days | Yes (Supabase stays live) |
| Phase 1: Auth | 4-6 days | No (sequential) |
| Phase 2: Database | 5-7 days | Partial (one table at a time) |
| Phase 3: RAG/Vector | 3-4 days | Yes (after Phase 2) |
| Phase 4: Edge Functions | 2-3 days | Yes (after Phase 3) |
| Phase 5: Cleanup | 1-2 days | No (final step) |
| **Total** | **18-27 days** | 1 developer |

---

## Risk Mitigation

1. **Feature flags:** `USE_AWS=true/false` env var lets you switch between backends without code changes
2. **Dual-write period:** Write to both Supabase and AWS simultaneously during migration, read from Supabase until AWS is validated
3. **Offline-first design:** All critical features already work via AsyncStorage + direct OpenAI, so a backend outage does not break the app
4. **Data backup:** Run `pg_dump` before migration starts; keep Supabase active for 30 days post-migration as fallback
5. **Incremental rollout:** Migrate one table/service at a time, validate on staging before production

---

## AWS Cost Estimate (Monthly)

| Service | Usage | Est. Cost/Month |
|---------|-------|----------------|
| RDS PostgreSQL (db.t3.medium) | 24/7 | ~$50-70 |
| Lambda (10M requests) | Normal usage | ~$2-5 |
| API Gateway (10M calls) | Normal usage | ~$3.50 |
| Cognito (up to 50K MAU) | Free tier | $0 |
| S3 (1GB storage) | Share cards, audio | ~$0.02 |
| CloudWatch logs | Monitoring | ~$2-5 |
| **Total** | | **~$60-85/month** |

Note: Supabase Pro is $25/month. AWS is ~3x more expensive but provides greater control, compliance, and scalability for a production app.

---

*Generated by VEYa audit system — 2026-03-28*
