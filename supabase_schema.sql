-- VEYa Database Schema
-- New Supabase project: ennlryjggdoljgbqhttb
-- Created: 2026-03-28

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pg_trgm";

-- ============================================================
-- 1. USER PROFILES
-- ============================================================
create table if not exists public.user_profiles (
  id                    uuid default uuid_generate_v4() primary key,
  user_id               uuid references auth.users(id) on delete cascade unique not null,
  display_name          text,
  email                 text,
  avatar_url            text,
  birth_date            date,
  birth_time            time,
  birth_time_precision  text default 'unknown' check (birth_time_precision in ('exact','approximate','unknown')),
  birth_time_range      text check (birth_time_range in ('morning','afternoon','evening','night')),
  birth_place           text,
  birth_latitude        double precision,
  birth_longitude       double precision,
  sun_sign              text,
  moon_sign             text,
  rising_sign           text,
  focus_areas           text[] default '{}',
  interests             text[] default '{}',
  personality_traits    text[] default '{}',
  onboarding_completed  boolean default false,
  onboarding_step       integer default 0,
  subscription_tier     text default 'free' check (subscription_tier in ('free','premium','pro')),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- ============================================================
-- 2. BIRTH CHARTS
-- ============================================================
create table if not exists public.birth_charts (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references auth.users(id) on delete cascade unique not null,
  house_system  text default 'placidus',
  sun_sign      text,
  moon_sign     text,
  rising_sign   text,
  chart_data    jsonb default '{}',
  planets       jsonb default '{}',
  houses        jsonb default '{}',
  aspects       jsonb default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- 3. DAILY READINGS
-- ============================================================
create table if not exists public.daily_readings (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references auth.users(id) on delete cascade not null,
  reading_date        date not null,
  sun_sign            text,
  reading_text        text,
  energy_level        integer check (energy_level between 1 and 10),
  energy_summary      text,
  do_guidance         text,
  dont_guidance       text,
  transit_highlights  jsonb default '[]',
  lucky_number        integer,
  lucky_color         text,
  mood                text,
  affirmation         text,
  focus_areas         text[],
  share_card_url      text,
  created_at          timestamptz default now(),
  unique(user_id, reading_date)
);

-- ============================================================
-- 4. AI CONVERSATIONS
-- ============================================================
create table if not exists public.ai_conversations (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  session_id  text not null,
  messages    jsonb default '[]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- 5. STREAKS
-- ============================================================
create table if not exists public.streaks (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references auth.users(id) on delete cascade unique not null,
  current_streak  integer default 0,
  longest_streak  integer default 0,
  last_check_in   date,
  total_days      integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- 6. RITUALS
-- ============================================================
create table if not exists public.rituals (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  ritual_type  text not null check (ritual_type in ('morning','evening','custom')),
  ritual_date  date default current_date,
  completed    boolean default false,
  completed_at timestamptz,
  duration_sec integer,
  notes        text,
  data         jsonb default '{}',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- 7. USER EMBEDDINGS (RAG Memory)
-- ============================================================
create table if not exists public.user_embeddings (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  content      text not null,
  content_type text not null check (content_type in ('reading','preference','conversation','journal','insight')),
  embedding    vector(1536),
  metadata     jsonb default '{}',
  created_at   timestamptz default now()
);

-- ============================================================
-- 8. JOURNAL ENTRIES
-- ============================================================
create table if not exists public.journal_entries (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references auth.users(id) on delete cascade not null,
  content       text not null,
  mood          text,
  moon_phase    text,
  sun_sign      text,
  ai_insights   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- 9. SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  id                 uuid default uuid_generate_v4() primary key,
  user_id            uuid references auth.users(id) on delete cascade unique not null,
  plan               text default 'free' check (plan in ('free','premium','pro')),
  status             text default 'active' check (status in ('active','cancelled','expired','trialing')),
  current_period_end timestamptz,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ============================================================
-- 10. DAILY HOROSCOPE CACHE (shared, not per-user)
-- ============================================================
create table if not exists public.daily_horoscope_cache (
  id           uuid default uuid_generate_v4() primary key,
  sign         text not null,
  date         date not null,
  content      text,
  energy       integer,
  theme        text,
  created_at   timestamptz default now(),
  unique(sign, date)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.user_profiles enable row level security;
alter table public.birth_charts enable row level security;
alter table public.daily_readings enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.streaks enable row level security;
alter table public.rituals enable row level security;
alter table public.user_embeddings enable row level security;
alter table public.journal_entries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.daily_horoscope_cache enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users own their profiles" on public.user_profiles
  for all using (auth.uid() = user_id);

create policy "Users own their charts" on public.birth_charts
  for all using (auth.uid() = user_id);

create policy "Users own their readings" on public.daily_readings
  for all using (auth.uid() = user_id);

create policy "Users own their conversations" on public.ai_conversations
  for all using (auth.uid() = user_id);

create policy "Users own their streaks" on public.streaks
  for all using (auth.uid() = user_id);

create policy "Users own their rituals" on public.rituals
  for all using (auth.uid() = user_id);

create policy "Users own their embeddings" on public.user_embeddings
  for all using (auth.uid() = user_id);

create policy "Users own their journal" on public.journal_entries
  for all using (auth.uid() = user_id);

create policy "Users own their subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id);

-- Daily horoscope cache is public read
create policy "Anyone can read horoscope cache" on public.daily_horoscope_cache
  for select using (true);

create policy "Service role can write horoscope cache" on public.daily_horoscope_cache
  for insert with check (true);

-- ============================================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- ============================================================
create or replace function match_user_embeddings(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count integer default 5,
  match_threshold float default 0.7
)
returns table (
  id uuid,
  content text,
  content_type text,
  similarity float,
  metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    ue.id,
    ue.content,
    ue.content_type,
    1 - (ue.embedding <=> query_embedding) as similarity,
    ue.metadata
  from public.user_embeddings ue
  where ue.user_id = match_user_id
    and 1 - (ue.embedding <=> query_embedding) > match_threshold
  order by ue.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_user_profiles_updated_at before update on public.user_profiles
  for each row execute function update_updated_at();
create trigger update_birth_charts_updated_at before update on public.birth_charts
  for each row execute function update_updated_at();
create trigger update_streaks_updated_at before update on public.streaks
  for each row execute function update_updated_at();
create trigger update_rituals_updated_at before update on public.rituals
  for each row execute function update_updated_at();
create trigger update_subscriptions_updated_at before update on public.subscriptions
  for each row execute function update_updated_at();

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_daily_readings_user_date on public.daily_readings(user_id, reading_date desc);
create index if not exists idx_ai_conversations_user on public.ai_conversations(user_id, created_at desc);
create index if not exists idx_rituals_user_date on public.rituals(user_id, ritual_date desc);
create index if not exists idx_journal_user on public.journal_entries(user_id, created_at desc);
create index if not exists idx_embeddings_user on public.user_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);
