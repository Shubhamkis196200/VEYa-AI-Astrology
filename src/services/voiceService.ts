// ============================================================================
// VEYa Voice Service — Personal Astrology Voice Assistant
// ============================================================================
// Uses OpenAI Whisper for transcription
// Uses device's native TTS (expo-speech) for reliable voice output
// ============================================================================

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_BASE = 'https://api.openai.com/v1';

// Voice state
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
  
  return `You are VEYa, a warm and wise personal astrologer having a voice conversation. Your responses will be spoken aloud.

USER: ${name}
Sun: ${sun} | Moon: ${moon} | Rising: ${rising}

RULES:
- You ARE speaking to them via voice - never say you can't speak
- Keep responses SHORT (2-3 sentences max)
- Be warm, friendly, and encouraging
- Use their name occasionally
- Focus on astrology, spirituality, personal growth
- No bullet points or lists - this is spoken conversation
- Sound natural like a friend, not a textbook`;
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
      ...conversationHistory.slice(-6),
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 150, // Even shorter for faster voice
        temperature: 0.8,
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
    return `I'm having trouble connecting right now, ${userProfile.name || 'dear one'}. Please try again.`;
  }
}

// ---------------------------------------------------------------------------
// Text-to-Speech (Device Native - Guaranteed to Work!)
// ---------------------------------------------------------------------------

export async function speakText(text: string): Promise<void> {
  if (!text.trim()) return;

  isSpeaking = true;
  console.log('[Voice] Speaking with device TTS:', text.substring(0, 50) + '...');

  try {
    // Stop any current speech
    await Speech.stop();

    // Set audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    // Speak using device's native TTS
    await new Promise<void>((resolve, reject) => {
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.95, // Slightly slower for clarity
        onDone: () => {
          console.log('[Voice] Speech completed');
          resolve();
        },
        onError: (error) => {
          console.error('[Voice] Speech error:', error);
          reject(error);
        },
        onStopped: () => {
          console.log('[Voice] Speech stopped');
          resolve();
        },
      });
    });
  } catch (error) {
    console.error('[Voice] TTS error:', error);
  } finally {
    isSpeaking = false;
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
  } catch (e) {
    console.warn('[Voice] Error stopping speech:', e);
  }
  isSpeaking = false;
}

// ---------------------------------------------------------------------------
// Check if TTS is available
// ---------------------------------------------------------------------------

export async function checkTTSAvailable(): Promise<boolean> {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices.length > 0;
  } catch {
    return false;
  }
}
