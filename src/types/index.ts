// ============================================================================
// DATABASE TYPES (matches Supabase schema)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<UserProfile, 'id'>>;
        Relationships: [];
      };
      birth_charts: {
        Row: BirthChart;
        Insert: Omit<BirthChart, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<BirthChart, 'id'>>;
        Relationships: [];
      };
      daily_readings: {
        Row: DailyReading;
        Insert: Omit<DailyReading, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<DailyReading, 'id'>>;
        Relationships: [];
      };
      ai_conversations: {
        Row: AIConversation;
        Insert: Omit<AIConversation, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<AIConversation, 'id'>>;
        Relationships: [];
      };
      user_embeddings: {
        Row: UserEmbedding;
        Insert: Omit<UserEmbedding, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<UserEmbedding, 'id'>>;
        Relationships: [];
      };
      rituals: {
        Row: Ritual;
        Insert: Omit<Ritual, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Ritual, 'id'>>;
        Relationships: [];
      };
      streaks: {
        Row: Streak;
        Insert: Omit<Streak, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Streak, 'id'>>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Omit<Subscription, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_user_embeddings: {
        Args: {
          query_embedding: number[];
          match_user_id: string;
          match_count?: number;
          match_threshold?: number;
        };
        Returns: {
          id: string;
          content: string;
          content_type: string;
          similarity: number;
          metadata: Record<string, unknown> | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  birth_time: string | null;
  birth_time_precision: 'exact' | 'approximate' | 'unknown';
  birth_time_range: 'morning' | 'afternoon' | 'evening' | 'night' | null;
  birth_place: string | null;
  birth_latitude: number | null;
  birth_longitude: number | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  focus_areas: string[];
  personality_traits: string[];
  interests: string[];
  onboarding_completed: boolean;
  onboarding_step: number;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
  // Virtual / computed fields used by app (not in DB)
  name?: string | null; // alias for display_name
  chinese_zodiac?: string | null;
  vedic_nakshatra?: string | null;
  life_path_number?: number | null;
}

// ============================================================================
// BIRTH CHART TYPES
// ============================================================================

export interface PlanetPlacement {
  sign: string;
  degree: number;
  house: number | null;
}

export interface ChartAspect {
  planet1: string;
  planet2: string;
  type: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  orb: number;
}

export interface HousePlacement {
  number: number;
  sign: string;
  degree: number;
}

export interface BirthChart {
  id: string;
  user_id: string;
  house_system: 'placidus' | 'whole_sign' | 'koch' | 'equal';
  sun_sign: string | null;
  sun_degree: number | null;
  moon_sign: string | null;
  moon_degree: number | null;
  rising_sign: string | null;
  rising_degree: number | null;
  mercury_sign: string | null;
  mercury_degree: number | null;
  venus_sign: string | null;
  venus_degree: number | null;
  mars_sign: string | null;
  mars_degree: number | null;
  jupiter_sign: string | null;
  jupiter_degree: number | null;
  saturn_sign: string | null;
  saturn_degree: number | null;
  uranus_sign: string | null;
  uranus_degree: number | null;
  neptune_sign: string | null;
  neptune_degree: number | null;
  pluto_sign: string | null;
  pluto_degree: number | null;
  north_node_sign: string | null;
  north_node_degree: number | null;
  chiron_sign: string | null;
  chiron_degree: number | null;
  house_cusps: Record<string, unknown> | null;
  aspects: Record<string, unknown> | null;
  chart_svg: string | null;
  chart_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  // Virtual fields for backward compat with services
  planets?: {
    sun: PlanetPlacement;
    moon: PlanetPlacement;
    mercury: PlanetPlacement;
    venus: PlanetPlacement;
    mars: PlanetPlacement;
    jupiter: PlanetPlacement;
    saturn: PlanetPlacement;
    uranus: PlanetPlacement;
    neptune: PlanetPlacement;
    pluto: PlanetPlacement;
  } | null;
  houses?: HousePlacement[] | null;
}

// ============================================================================
// DAILY READING TYPES
// ============================================================================

export interface DailyReading {
  id: string;
  user_id: string;
  reading_date: string;
  sun_sign: string | null;
  energy_level: number | null;
  energy_summary: string | null;
  reading_text: string | null;
  do_guidance: string | null;
  dont_guidance: string | null;
  transit_highlights: Record<string, unknown>[] | null;
  focus_areas: Record<string, unknown> | null;
  share_card_url: string | null;
  mood: string | null;
  lucky_number: number | null;
  lucky_color: string | null;
  affirmation: string | null;
  created_at: string;
}

export interface TransitData {
  planet: string;
  aspect: string;
  description: string;
}

// ============================================================================
// AI CONVERSATION TYPES
// ============================================================================

export interface AIConversation {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  model: string | null;
  created_at: string;
}

// ============================================================================
// EMBEDDING TYPES
// ============================================================================

export interface UserEmbedding {
  id: string;
  user_id: string;
  content: string;
  content_type: 'conversation' | 'reading' | 'journal' | 'preference' | 'insight';
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================================
// RITUAL TYPES
// ============================================================================

export interface Ritual {
  id: string;
  user_id: string;
  ritual_type: 'morning' | 'evening' | 'custom';
  title: string;
  description: string | null;
  steps: Record<string, unknown> | null;
  duration_minutes: number;
  is_active: boolean;
  completed_today: boolean;
  last_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// STREAK TYPES
// ============================================================================

export interface Streak {
  id: string;
  user_id: string;
  streak_type: string;
  current_streak: number;
  longest_streak: number;
  last_check_in: string | null;
  total_check_ins: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'premium' | 'lifetime';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  provider: 'stripe' | 'apple' | 'google' | 'manual' | null;
  provider_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ONBOARDING TYPES
// ============================================================================

export interface OnboardingData {
  name: string;
  birthDate: Date | string | null;
  birthTime: Date | string | null;
  birthTimeKnown: boolean;
  birthTimePrecision: 'exact' | 'approximate' | 'unknown';
  birthTimeRange?: 'morning' | 'afternoon' | 'evening' | 'night';
  sunSign?: string;
  birthPlace: string;
  birthLat: number | null;
  birthLng: number | null;
  timezone: string | null;
  methodology: string[];  // ['western', 'vedic', 'chinese', 'numerology', 'lunar']
  purpose: string[];      // ['love', 'career', 'growth', 'wellness', 'financial', 'spiritual', 'family', 'daily']
  focusAreas: string[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
  statusCode: number;
}

export interface CalculateChartRequest {
  user_id: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_precision: 'exact' | 'approximate' | 'unknown';
  birth_lat: number;
  birth_lng: number;
  timezone: string;
  house_system?: 'placidus' | 'whole_sign' | 'koch';
}

export interface CalculateChartResponse {
  chart_id: string;
  sun_sign: string;
  moon_sign: string;
  rising_sign: string | null;
  planets: BirthChart['planets'];
  houses: HousePlacement[] | null;
  aspects: ChartAspect[];
}

export interface GeneratePersonalityRequest {
  user_id: string;
  name: string;
}

export interface GeneratePersonalityResponse {
  personality_text: string;
  big_three: {
    sun: { sign: string; description: string };
    moon: { sign: string; description: string };
    rising: { sign: string; description: string | null };
  };
}

export interface GenerateDailyReadingRequest {
  user_id: string;
  date: string;
}

export interface GenerateDailyReadingResponse {
  reading_id: string;
  reading_text: string;
  energy_level: number;
  lucky_number: number;
  lucky_color: string;
  focus_area: string;
  do_guidance: string;
  dont_guidance: string;
  transits: TransitData[];
}

export interface AIChatRequest {
  user_id: string;
  session_id: string;
  message: string;
}

export interface AIChatResponse {
  response: string;
  tokens_used: number;
  conversation_id: string;
}

// ============================================================================
// ZODIAC & ASTROLOGY TYPES
// ============================================================================

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';

export type Planet =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

export type AspectType = 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';

export type FocusArea =
  | 'Love & Relationships'
  | 'Career & Purpose'
  | 'Personal Growth'
  | 'Spirituality'
  | 'Health & Wellness'
  | 'Creativity';
