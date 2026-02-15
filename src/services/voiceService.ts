// ============================================================================
// VEYa Voice Service — Ultra-Low Latency with gpt-4o-mini-tts
// ============================================================================
// Uses OpenAI Whisper for transcription
// Uses gpt-4o-mini-tts with "coral" voice (best quality + emotional control)
// Optimized for minimal delay
// ============================================================================

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';

// Add type declaration for better compatibility
declare module 'expo-file-system' {
  export const cacheDirectory: string | null;
  export enum EncodingType {
    UTF8 = 'utf8',
    Base64 = 'base64',
  }
}

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
// Get Current Date/Time for Context
// ---------------------------------------------------------------------------

function getCurrentDateContext(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return `Today is ${now.toLocaleDateString('en-US', options)}. Year: ${now.getFullYear()}.`;
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
  const dateContext = getCurrentDateContext();
  
  return `You are VEYa, a warm intuitive astrologer in a voice chat.

DATE: ${dateContext}
USER: ${name} | Sun: ${sun} | Moon: ${moon} | Rising: ${rising}

RULES:
- You ARE speaking via voice - be natural and conversational
- Keep responses VERY SHORT (1-2 sentences only!)
- Be warm, empathetic, like a caring friend
- Use current date when asked about time
- Focus on astrology and personal growth
- No lists - speak naturally`;
}

// ---------------------------------------------------------------------------
// Recording Functions
// ---------------------------------------------------------------------------

export async function startRecording(): Promise<Audio.Recording> {
  if (!OPENAI_API_KEY) throw new Error('API key missing');

  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Mic permission needed');

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();
  isRecording = true;
  return recording;
}

export async function stopRecording(recording: Audio.Recording): Promise<string> {
  await recording.stopAndUnloadAsync();
  isRecording = false;
  const uri = recording.getURI();
  if (!uri) throw new Error('No recording URI');
  return uri;
}

// ---------------------------------------------------------------------------
// Transcription (Whisper) - Optimized
// ---------------------------------------------------------------------------

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('API key missing');
  isTranscribing = true;

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      name: 'audio.m4a',
      type: 'audio/m4a',
    } as unknown as Blob);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) throw new Error(`Whisper error: ${response.status}`);
    const data = await response.json();
    return data.text?.trim() || '';
  } finally {
    isTranscribing = false;
  }
}

// ---------------------------------------------------------------------------
// Chat + TTS Combined (Faster - parallel processing)
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
  if (!OPENAI_API_KEY) throw new Error('API key missing');

  try {
    const systemPrompt = buildAstrologySystemPrompt(userProfile);
    
    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-4),
          { role: 'user', content: userMessage },
        ],
        max_tokens: 80, // Very short for fast TTS
        temperature: 0.85,
      }),
    });

    if (!response.ok) throw new Error(`Chat error: ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    return `Having a cosmic glitch, ${userProfile.name || 'love'}. Try again?`;
  }
}

// ---------------------------------------------------------------------------
// Text-to-Speech (gpt-4o-mini-tts with coral voice - BEST QUALITY!)
// ---------------------------------------------------------------------------

export async function speakText(text: string): Promise<void> {
  if (!text.trim()) return;
  isSpeaking = true;

  try {
    const success = await speakWithOpenAI(text);
    if (!success) await speakWithDevice(text);
  } catch (error) {
    await speakWithDevice(text);
  } finally {
    isSpeaking = false;
  }
}

async function speakWithOpenAI(text: string): Promise<boolean> {
  if (!OPENAI_API_KEY) return false;

  try {
    if (currentSound) {
      try { await currentSound.unloadAsync(); } catch (e) {}
      currentSound = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Use the NEW gpt-4o-mini-tts model with emotional instructions!
    const response = await fetch(`${OPENAI_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts', // NEW! Best TTS model
        voice: 'coral', // Natural, warm voice
        input: text,
        instructions: 'Speak warmly and naturally, like a caring friend. Be empathetic and genuine. Add subtle emotional inflection.', // NEW! Emotional control
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      console.error('[Voice] TTS error:', response.status);
      return false;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = uint8ArrayToBase64(new Uint8Array(arrayBuffer));
    
    const fileUri = `${FileSystem.cacheDirectory}veya_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true, volume: 1.0 }
    );
    currentSound = sound;

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 20000);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    try {
      await sound.unloadAsync();
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch (e) {}
    
    currentSound = null;
    return true;
  } catch (error) {
    console.error('[Voice] OpenAI TTS error:', error);
    return false;
  }
}

async function speakWithDevice(text: string): Promise<void> {
  await Speech.stop();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  });

  await new Promise<void>((resolve) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.1,
      rate: 0.95,
      onDone: resolve,
      onError: () => resolve(),
      onStopped: resolve,
    });
  });
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const len = bytes.length;
  
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;
    
    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < len ? chars[b3 & 63] : '=';
  }
  
  return result;
}

export async function stopSpeaking(): Promise<void> {
  try {
    await Speech.stop();
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (e) {}
  isSpeaking = false;
}
