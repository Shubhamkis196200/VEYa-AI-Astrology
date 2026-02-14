// OpenAI configuration for Edge Functions
// Note: OpenAI calls are made through Supabase Edge Functions, not directly from the client.
// This file provides types and helpers for the AI layer.

const OPENAI_MODEL = 'gpt-4o';
const EMBEDDING_MODEL = 'text-embedding-3-small';

export const AI_CONFIG = {
  model: OPENAI_MODEL,
  embeddingModel: EMBEDDING_MODEL,
  embeddingDimensions: 1536,
  maxTokens: 1024,
  temperature: 0.7,
} as const;

export interface AIGenerateRequest {
  user_id: string;
  prompt: string;
  context?: string;
  max_tokens?: number;
}

export interface AIEmbedRequest {
  content: string;
  user_id: string;
  category: 'reading' | 'event' | 'preference' | 'reflection' | 'conversation';
  metadata?: Record<string, unknown>;
}

export interface AIPersonalityResponse {
  personality_text: string;
  big_three: {
    sun: { sign: string; description: string };
    moon: { sign: string; description: string };
    rising: { sign: string; description: string | null };
  };
}

export interface AIChatResponse {
  response: string;
  tokens_used: number;
  conversation_id: string;
}
