// ============================================================================
// VEYa RAG (Retrieval-Augmented Generation) Service
// ============================================================================

import { supabase } from '../lib/supabase';
import { generateEmbedding, searchMemories } from './ai';
import type { MemoryResult } from './ai';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MemoryMetadata {
  category?: string;
  source?: 'chat' | 'journal' | 'reading' | 'event';
  session_id?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 1. storeMemory
// ---------------------------------------------------------------------------

export async function storeMemory(
  userId: string,
  text: string,
  metadata: MemoryMetadata = {},
): Promise<void> {
  if (!text.trim()) return;

  try {
    // Generate embedding for the text
    const embedding = await generateEmbedding(text);

    const category = metadata.category || 'conversation';

    // Store in user_embeddings table
    const contentType = (['conversation', 'reading', 'journal', 'preference', 'insight'].includes(category)
      ? category
      : 'conversation') as 'conversation' | 'reading' | 'journal' | 'preference' | 'insight';

    const { error } = await supabase.from('user_embeddings').insert({
      user_id: userId,
      content: text,
      embedding: embedding as unknown as null, // pgvector accepts number[] but TS types it differently
      content_type: contentType,
      metadata: metadata as Record<string, unknown>,
    });

    if (error) {
      console.error('[RAG] storeMemory error:', error.message);
      throw new Error(`Failed to store memory: ${error.message}`);
    }
  } catch (err) {
    console.error('[RAG] storeMemory failed:', err);
    // Don't re-throw — embedding failures shouldn't block the main flow
  }
}

// ---------------------------------------------------------------------------
// 2. retrieveRelevantMemories
// ---------------------------------------------------------------------------

export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  limit: number = 5,
): Promise<MemoryResult[]> {
  if (!query.trim()) return [];

  try {
    const queryEmbedding = await generateEmbedding(query);
    return await searchMemories(queryEmbedding, userId, limit);
  } catch (err) {
    console.error('[RAG] retrieveRelevantMemories failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// 3. storeConversation
// ---------------------------------------------------------------------------

export async function storeConversation(
  userId: string,
  sessionId: string,
  userMessage: string,
  aiResponse: string,
): Promise<void> {
  try {
    // 1. Save both messages to ai_conversations table
    const conversationEntries = [
      {
        user_id: userId,
        session_id: sessionId,
        role: 'user' as const,
        content: userMessage,
        model: null,
        tokens_used: null,
      },
      {
        user_id: userId,
        session_id: sessionId,
        role: 'assistant' as const,
        content: aiResponse,
        model: 'gpt-4o-mini',
        tokens_used: null,
      },
    ];

    const { error: convError } = await supabase
      .from('ai_conversations')
      .insert(conversationEntries);

    if (convError) {
      console.error('[RAG] storeConversation insert error:', convError.message);
    }

    // 2. Generate embedding of the exchange for future RAG retrieval
    const combinedText = `User asked: ${userMessage}\nVEYa responded: ${aiResponse.slice(0, 500)}`;

    await storeMemory(userId, combinedText, {
      category: 'conversation',
      source: 'chat',
      session_id: sessionId,
    });
  } catch (err) {
    console.error('[RAG] storeConversation failed:', err);
    // Non-blocking — conversation storage failure shouldn't affect UX
  }
}
