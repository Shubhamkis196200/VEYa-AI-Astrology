# Supabase Backend Audit — VEYa V4

Date: 2026-02-14 (UTC)
Project: https://fdivwigdptmrrabpwfyi.supabase.co

## 1) Table Status & Schema Verification

**Legend:** OK = column exists; MISSING = column not found in schema cache

### user_profiles
- **Exists:** YES
- **Columns:**
  - id ✅
  - user_id ✅
  - name ❌ **MISSING**
  - sun_sign ✅
  - moon_sign ✅
  - rising_sign ✅
  - birth_date ✅
  - birth_time ✅
  - birth_place ✅
  - created_at ✅

### birth_charts
- **Exists:** YES
- **Columns:** id ✅, user_id ✅, chart_data ✅, created_at ✅

### daily_readings
- **Exists:** YES
- **Columns:** id ✅, user_id ✅, reading_date ✅, reading_text ✅, sun_sign ✅, created_at ✅

### ai_conversations
- **Exists:** YES
- **Columns:**
  - id ✅
  - user_id ✅
  - messages ❌ **MISSING**
  - session_id ✅
  - created_at ✅

### rituals
- **Exists:** YES
- **Columns:**
  - id ✅
  - user_id ✅
  - ritual_type ✅
  - completed_at ❌ **MISSING**
  - data ❌ **MISSING**

### streaks
- **Exists:** YES
- **Columns:** id ✅, user_id ✅, current_streak ✅, longest_streak ✅, last_check_in ✅, created_at ✅

### subscriptions
- **Exists:** YES
- **Columns:** id ✅, user_id ✅, plan ✅, status ✅, created_at ✅

### user_embeddings
- **Exists:** YES
- **Columns:** id ✅, user_id ✅, content ✅, embedding ✅, metadata ✅, created_at ✅

---

## 2) CRUD Tests for demo-user-001 (RLS/Access)

**Result:** All CRUD tests failed **before** RLS due to schema issues or `user_id` type errors.

### user_profiles
- INSERT: **400** — missing column `name`
- SELECT: **400** — invalid input syntax for type uuid: `demo-user-001`
- UPDATE: **400** — missing column `name`

### daily_readings
- INSERT/SELECT/UPDATE: **400** — invalid input syntax for type uuid: `demo-user-001`

### streaks
- INSERT/SELECT/UPDATE: **400** — invalid input syntax for type uuid: `demo-user-001`

### ai_conversations
- INSERT/UPDATE: **400** — missing column `messages`
- SELECT: **400** — invalid input syntax for type uuid: `demo-user-001`

### rituals
- INSERT: **400** — missing column `completed_at`
- UPDATE: **400** — missing column `data`
- SELECT: **400** — invalid input syntax for type uuid: `demo-user-001`

**RLS status:** Not reachable with `demo-user-001` because `user_id` appears to be `uuid` type in DB. Need a valid UUID or change schema to text to proceed.

---

## 3) Edge Functions

| Function | Status | Response Time | Notes |
|---|---:|---:|---|
| generate-reading | 200 | 9.59s | Returned reading payload OK |
| chat | 200 | 3.94s | Returned reply OK |
| generate-embedding | 200 | 1.32s | Returned embedding vector OK |

**Edge functions are working.**

---

## 4) RPC: match_user_embeddings

- **Status:** 404 (PGRST202)
- **Message:** function not found with parameters `(match_count, match_threshold, p_user_id, query_embedding)`
- **Hint from Supabase:** expected parameter is `match_user_id` instead of `p_user_id`.

**RAG pipeline:**
- Embedding generation works.
- `user_embeddings` table exists.
- RPC not callable due to parameter mismatch (function signature mismatch).

---

## 5) Fixes Needed

### A) Add Missing Columns
```sql
-- user_profiles: add name
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS name text;

-- ai_conversations: add messages
ALTER TABLE public.ai_conversations
ADD COLUMN IF NOT EXISTS messages jsonb DEFAULT '[]'::jsonb;

-- rituals: add completed_at, data
ALTER TABLE public.rituals
ADD COLUMN IF NOT EXISTS completed_at timestamptz,
ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;
```

### B) Resolve demo-user-001 UUID Issues
Current errors indicate `user_id` is UUID. Options:

**Option 1 (recommended):** create an auth user and use its UUID in tests.
```sql
-- (Run in Supabase Auth / SQL as admin)
-- Create or obtain a real UUID for demo user and use that in API calls
```

**Option 2:** change `user_id` columns to text (if product design allows non-UUID user IDs).
```sql
-- Example (repeat per table if needed)
ALTER TABLE public.user_profiles
ALTER COLUMN user_id TYPE text USING user_id::text;
```

### C) Fix match_user_embeddings RPC signature
If the function uses `match_user_id` param, update the client or rename the param.

**Option 1: Update client call**
```json
{"query_embedding":[0.1,0.2,0.3],"match_count":5,"match_threshold":0.5,"match_user_id":"<uuid>"}
```

**Option 2: Update function signature**
```sql
-- If you want to keep p_user_id, create a wrapper or rename argument
CREATE OR REPLACE FUNCTION public.match_user_embeddings(
  query_embedding vector,
  match_count int,
  match_threshold float,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.match_user_embeddings(
    query_embedding,
    match_count,
    match_threshold,
    p_user_id
  );
END;
$$;
```

---

## Summary
- **Schema issues:** Missing `user_profiles.name`, `ai_conversations.messages`, `rituals.completed_at`, `rituals.data`.
- **CRUD tests blocked:** `demo-user-001` is not a UUID; all CRUD calls fail before RLS. Use real UUID or change schema.
- **Edge functions:** All 3 working.
- **RAG pipeline:** Embeddings OK, RPC broken due to param mismatch.

