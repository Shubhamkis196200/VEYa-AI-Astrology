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
// Internal helper: resolve auth UID → profiles.id
// ---------------------------------------------------------------------------

async function getProfileId(authUid: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('user_id', authUid)
    .single();

  if (error || !data) {
    // Could already be a profile UUID — return as-is
    return authUid;
  }
  return data.id;
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

    const contentType = (['conversation', 'reading', 'journal', 'preference', 'insight'].includes(category)
      ? category
      : 'conversation') as 'conversation' | 'reading' | 'journal' | 'preference' | 'insight';

    // Resolve to profile.id (FK in user_embeddings)
    const profileId = await getProfileId(userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('user_embeddings').insert({
      user_id: profileId,
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
    // searchMemories uses the RPC function which takes user_id (profile UUID)
    const profileId = await getProfileId(userId);
    return await searchMemories(queryEmbedding, profileId || userId, limit);
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
    // Resolve to profile.id (FK in ai_conversations)
    const profileId = await getProfileId(userId);

    // 1. Save conversation to ai_conversations using JSONB messages format
    //    The real schema: ai_conversations(id, user_id, session_id, messages jsonb)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingConv } = await (supabase as any)
      .from('ai_conversations')
      .select('id, messages')
      .eq('session_id', sessionId)
      .maybeSingle();

    const newMessages = [
      { role: 'user', content: userMessage, ts: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, ts: new Date().toISOString() },
    ];

    if (existingConv) {
      const updatedMessages = [...(existingConv.messages || []), ...newMessages];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('ai_conversations')
        .update({ messages: updatedMessages })
        .eq('id', existingConv.id);

      if (updateError) {
        console.error('[RAG] storeConversation update error:', updateError.message);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from('ai_conversations')
        .insert({
          user_id: profileId,
          session_id: sessionId,
          messages: newMessages,
        });

      if (insertError) {
        console.error('[RAG] storeConversation insert error:', insertError.message);
      }
    }

    // 2. Generate embedding of the exchange for future RAG retrieval
    const combinedText = `User asked: ${userMessage}\nVEYa responded: ${aiResponse.slice(0, 500)}`;

    await storeMemory(profileId || userId, combinedText, {
      category: 'conversation',
      source: 'chat',
      session_id: sessionId,
    });
  } catch (err) {
    console.error('[RAG] storeConversation failed:', err);
    // Non-blocking — conversation storage failure shouldn't affect UX
  }
}
