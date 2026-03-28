# VEYa AWS Migration Plan
> From Supabase → AWS Native Stack
> Created: 2026-03-28

---

## Current Supabase Services Used

| Supabase Service | Usage | AWS Equivalent |
|-----------------|-------|----------------|
| Supabase Auth | Sign up, login, session management, `onAuthStateChange` | **AWS Cognito** (User Pools + Identity Pools) |
| Supabase PostgreSQL | `user_profiles`, `birth_charts`, `daily_readings`, `streaks`, `user_embeddings`, `ai_conversations` | **AWS RDS PostgreSQL** (or Aurora Serverless v2) |
| Supabase Edge Functions | `functions.invoke()` — wraps OpenAI calls | **AWS Lambda** + **API Gateway** (HTTP API) |
| Supabase RPC | `match_user_embeddings` — pgvector similarity search | **RDS with pgvector extension** + Lambda |
| Supabase Realtime | Not used | N/A |
| Supabase Storage | Not used | N/A |

---

## Migration Phases

### Phase 1: Fix Immediate Issues (Week 1)
**Goal:** Make app resilient to Supabase downtime without migrating.

- [ ] Wrap ALL Supabase calls in try/catch with graceful fallbacks
- [ ] Add offline-first caching: store last readings/profile in AsyncStorage
- [ ] Add 10-second timeout to all Supabase network calls using `AbortController`
- [ ] Generate fresh Supabase types: `supabase gen types typescript --project-id fdivwigdptmrrabpwfyi > src/types/supabase.ts`
- [ ] Fix the 20 TypeScript errors (schema mismatches, reanimated SharedValue)

**Files to change:**
- `src/services/onboarding.ts`
- `src/services/rag.ts`
- `src/services/ai.ts`
- `src/services/dailyReading.ts`
- `src/services/streakService.ts`

---

### Phase 2: Set Up AWS Infrastructure (Week 2)

#### 2a. AWS Cognito (Auth)
```
Resources:
- User Pool: veya-users
  - Email + Google OAuth provider
  - JWT tokens (access + refresh)
  - Custom attributes: birth_date, sun_sign, moon_sign, rising_sign
- Identity Pool: veya-identity-pool
  - Unauthenticated access: disabled
  - Authenticated: full app access
```

#### 2b. AWS RDS PostgreSQL
```
Engine: PostgreSQL 16 with pgvector extension
Instance: db.t3.medium (dev) / db.r6g.large (prod)
Storage: 20GB gp3, auto-scaling to 100GB
Multi-AZ: Yes (prod)
VPC: Private subnet, only Lambda can access

Tables (same schema as Supabase):
- user_profiles
- birth_charts
- daily_readings
- ai_conversations
- streaks
- user_embeddings (with pgvector column)
```

#### 2c. AWS Lambda + API Gateway
```
Functions:
- veya-ai-chat          → POST /api/v1/chat
- veya-tarot-reading    → POST /api/v1/tarot
- veya-daily-reading    → POST /api/v1/reading/daily
- veya-voice-process    → POST /api/v1/voice
- veya-rag-search       → POST /api/v1/memory/search
- veya-rag-save         → POST /api/v1/memory/save

Runtime: Node.js 20.x
Timeout: 30s (AI calls), 10s (DB calls)
Memory: 512MB
Environment: OpenAI API key via AWS Secrets Manager
```

---

### Phase 3: Migrate Data (Week 3)

#### 3a. Export from Supabase
```bash
# Export each table as CSV
supabase db dump --data-only -t user_profiles > export/user_profiles.csv
supabase db dump --data-only -t birth_charts > export/birth_charts.csv
supabase db dump --data-only -t daily_readings > export/daily_readings.csv
supabase db dump --data-only -t ai_conversations > export/ai_conversations.csv
supabase db dump --data-only -t streaks > export/streaks.csv
supabase db dump --data-only -t user_embeddings > export/user_embeddings.csv
```

#### 3b. Import to RDS
```bash
# Run migration script
psql -h $RDS_HOST -U veya_admin -d veya_db < schema.sql
psql -h $RDS_HOST -U veya_admin -d veya_db < export/user_profiles.csv
# ... repeat for each table
```

#### 3c. Migrate Auth Users
- Export Cognito-compatible user list from Supabase Auth
- Use `aws cognito-idp admin-create-user` for each user
- Send password-reset emails to all users (Supabase → Cognito migration requires password reset)

---

### Phase 4: Update App Code + Cutover (Week 4)

#### 4a. Replace `src/lib/supabase.ts`

**Current:**
```typescript
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**New `src/lib/aws.ts`:**
```typescript
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signIn, signOut, getCurrentUser } from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.EXPO_PUBLIC_AWS_USER_POOL_ID!,
      userPoolClientId: process.env.EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID!,
      identityPoolId: process.env.EXPO_PUBLIC_AWS_IDENTITY_POOL_ID!,
    }
  }
});

export const auth = { fetchAuthSession, signIn, signOut, getCurrentUser };
```

#### 4b. Replace Supabase DB calls with API calls

**Current (`src/services/onboarding.ts`):**
```typescript
const { error } = await supabase.from('user_profiles').insert({ ... });
```

**New:**
```typescript
const token = (await fetchAuthSession()).tokens?.idToken?.toString();
const res = await fetch(`${API_BASE}/api/v1/profile`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
});
```

#### 4c. Environment Variables (`.env.local` → `.env.local`)
```bash
# Remove
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...

# Add
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_AWS_USER_POOL_ID=us-east-1_XXXXXXXXX
EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_AWS_IDENTITY_POOL_ID=us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
EXPO_PUBLIC_API_BASE_URL=https://api.veyaapp.com
```

#### 4d. Files Requiring Code Changes
| File | Change |
|------|--------|
| `src/lib/supabase.ts` | Replace with `src/lib/aws.ts` using AWS Amplify |
| `app/_layout.tsx` | Replace `supabase.auth.onAuthStateChange` with Amplify Hub listener |
| `src/services/onboarding.ts` | Replace DB inserts with API calls |
| `src/services/rag.ts` | Replace `user_embeddings` + `ai_conversations` inserts/RPC with API calls |
| `src/services/ai.ts` | Replace `supabase.functions.invoke` with direct Lambda/API Gateway calls |
| `src/services/dailyReading.ts` | Replace `daily_readings` insert with API call |
| `src/services/streakService.ts` | Replace `streaks` insert/update with API call |

---

## Estimated Timeline

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1: Immediate fixes | 2–3 days | Low |
| Phase 2: AWS infrastructure setup | 3–5 days | Medium |
| Phase 3: Data migration | 1–2 days | Low (scripted) |
| Phase 4: App code cutover | 5–7 days | High |
| Testing + soft launch | 3 days | Medium |
| **Total** | **~3 weeks** | |

---

## Cost Comparison

| Service | Supabase | AWS |
|---------|----------|-----|
| Auth | Free (50k MAU) | Cognito: Free (50k MAU) |
| Database | $25/mo (Pro) | RDS t3.medium: ~$30/mo |
| Edge Functions | 500k invocations free | Lambda: ~$0.20 per 1M |
| Storage | 1GB free | S3: $0.023/GB |
| **Verdict** | Simpler, cheaper for MVP | More control, scales better |

**Recommendation:** Stay on Supabase for MVP. Migrate to AWS when reaching 10k+ MAU or needing enterprise SLAs.

---

## Risk Mitigation

1. **Auth migration**: Users will need to reset passwords. Send email campaign 1 week before cutover.
2. **pgvector**: Ensure RDS instance has pgvector extension enabled before migrating embeddings.
3. **Rollback plan**: Keep Supabase running for 30 days post-cutover. Feature flag in `src/lib/config.ts`: `USE_AWS = true/false`.
4. **Zero-downtime**: Use blue/green deployment — new app version targets AWS, old targets Supabase. Roll out 10% → 50% → 100%.
