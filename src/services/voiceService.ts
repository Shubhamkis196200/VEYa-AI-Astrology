// ============================================================================
// VEYa Voice Service — Rebuilt for Astrology AI Assistant
// ============================================================================
// A simple, focused voice agent that acts as a personal astrologer.
// Uses OpenAI Whisper for transcription and TTS for speech.
// ============================================================================

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_BASE = 'https://api.openai.com/v1';

// Voice state
let currentSound: Audio.Sound | null = null;
let isRecording = false;
let isTranscribing = false;
let isSpeaking = false;

export function getVoiceState() {
  return { isRecording, isTranscribing, isSpeaking };
}

// ---------------------------------------------------------------------------
// Astrology System Prompt
// ---------------------------------------------------------------------------

export function buildAstrologySystemPrompt(userProfile: {
  name?: string;
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  birthDate?: string;
}): string {
  const name = userProfile.name || 'dear one';
  const sun = userProfile.sunSign || 'unknown';
  const moon = userProfile.moonSign || 'unknown';
  const rising = userProfile.risingSign || 'unknown';
  
  return `You are VEYa, a warm and wise personal astrologer. You speak like a trusted friend who happens to be deeply knowledgeable about astrology.

USER PROFILE:
- Name: ${name}
- Sun Sign: ${sun} (core identity, ego, life purpose)
- Moon Sign: ${moon} (emotions, inner self, needs)
- Rising Sign: ${rising} (first impression, outer personality, approach to life)

YOUR PERSONALITY:
- Warm, compassionate, and encouraging
- Speak naturally like a friend, not a textbook
- Use the user's name occasionally
- Keep responses concise (2-4 sentences for simple questions)
- Be specific to their signs when relevant

GUIDELINES:
- Only discuss astrology, spirituality, personal growth, and related topics
- If asked about non-astrology topics, gently redirect: "I'm here for your cosmic guidance. What's on your heart astrologically?"
- Reference their Big Three (Sun, Moon, Rising) when relevant
- Give actionable, practical advice grounded in astrological wisdom
- Be encouraging but honest

RESPONSE STYLE:
- Short and conversational for voice
- No bullet points or lists (this is spoken)
- Maximum 3-4 sentences unless they ask for detail
- End with encouragement or a gentle question when appropriate`;
}

// ---------------------------------------------------------------------------
// Recording Functions
// ---------------------------------------------------------------------------

export async function startRecording(): Promise<Audio.Recording> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Microphone permission required');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();
    isRecording = true;
    
    console.log('[Voice] Recording started');
    return recording;
  } catch (error) {
    isRecording = false;
    console.error('[Voice] Failed to start recording:', error);
    throw error;
  }
}

export async function stopRecording(recording: Audio.Recording): Promise<string> {
  try {
    await recording.stopAndUnloadAsync();
    isRecording = false;
    
    const uri = recording.getURI();
    if (!uri) {
      throw new Error('Failed to get recording URI');
    }
    
    console.log('[Voice] Recording stopped:', uri);
    return uri;
  } catch (error) {
    isRecording = false;
    console.error('[Voice] Failed to stop recording:', error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Transcription (Whisper)
// ---------------------------------------------------------------------------

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  isTranscribing = true;
  console.log('[Voice] Transcribing audio...');

  try {
    const formData = new FormData();
    const filename = audioUri.split('/').pop() || `recording-${Date.now()}.m4a`;
    const ext = filename.split('.').pop() || 'm4a';
    const mimeType = ext === 'wav' ? 'audio/wav' : ext === 'mp3' ? 'audio/mpeg' : 'audio/m4a';

    formData.append('file', {
      uri: audioUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Voice] Whisper API error:', response.status, errorText);
      throw new Error(`Transcription failed: ${response.status}`);
    }

    const data = await response.json();
    const transcript = data.text?.trim() || '';
    
    console.log('[Voice] Transcription result:', transcript);
    return transcript;
  } catch (error) {
    console.error('[Voice] Transcription error:', error);
    throw error;
  } finally {
    isTranscribing = false;
  }
}

// ---------------------------------------------------------------------------
// Chat Completion (GPT-4o-mini for speed)
// ---------------------------------------------------------------------------

export async function getAstrologyResponse(
  userMessage: string,
  userProfile: {
    name?: string;
    sunSign?: string;
    moonSign?: string;
    risingSign?: string;
    birthDate?: string;
  },
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('[Voice] Getting astrology response for:', userMessage);

  try {
    const systemPrompt = buildAstrologySystemPrompt(userProfile);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and good for conversation
        messages,
        max_tokens: 200, // Keep responses short for voice
        temperature: 0.8, // Warm and creative
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Voice] Chat API error:', response.status, errorText);
      throw new Error(`Chat failed: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '';
    
    console.log('[Voice] AI response:', reply);
    return reply;
  } catch (error) {
    console.error('[Voice] Chat error:', error);
    // Return a friendly fallback
    return `I'm having trouble connecting right now, ${userProfile.name || 'dear one'}. Please try again in a moment.`;
  }
}

// ---------------------------------------------------------------------------
// Text-to-Speech (TTS)
// ---------------------------------------------------------------------------

export async function speakText(text: string): Promise<void> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  if (!text.trim()) return;

  isSpeaking = true;
  console.log('[Voice] Speaking:', text.substring(0, 50) + '...');

  try {
    // Stop any current playback
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const response = await fetch(`${OPENAI_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1', // Use standard for faster response
        voice: 'nova', // Warm, friendly female voice
        input: text,
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('[Voice] TTS API error:', response.status, errorText);
      throw new Error(`TTS failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    
    const fileUri = `${FileSystem.documentDirectory}veya_speech_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true }
    );
    currentSound = sound;

    // Wait for playback to complete
    await new Promise<void>((resolve) => {
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          resolve();
        }
      });
    });

    await sound.unloadAsync();
    currentSound = null;
    console.log('[Voice] Speech completed');
  } catch (error) {
    console.error('[Voice] TTS error:', error);
    throw error;
  } finally {
    isSpeaking = false;
  }
}

export async function stopSpeaking(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (e) {
      console.warn('[Voice] Error stopping speech:', e);
    }
    currentSound = null;
  }
  isSpeaking = false;
}

// ---------------------------------------------------------------------------
// Test API Key
// ---------------------------------------------------------------------------

export async function testOpenAIConnection(): Promise<{ success: boolean; message: string }> {
  if (!OPENAI_API_KEY) {
    return { success: false, message: 'No API key configured' };
  }

  try {
    const response = await fetch(`${OPENAI_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
    });

    if (response.ok) {
      return { success: true, message: 'OpenAI API connected successfully' };
    } else {
      const error = await response.text();
      return { success: false, message: `API error: ${response.status} - ${error}` };
    }
  } catch (error) {
    return { success: false, message: `Connection failed: ${error}` };
  }
}
