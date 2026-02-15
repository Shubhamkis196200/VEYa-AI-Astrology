// ============================================================================
// VEYa Voice Service — Human-like Voice with OpenAI TTS
// ============================================================================
// Uses OpenAI Whisper for transcription
// Uses OpenAI TTS with "shimmer" voice (most human/expressive)
// Falls back to device TTS if OpenAI fails
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
  const dateStr = now.toLocaleDateString('en-US', options);
  const year = now.getFullYear();
  return `Today is ${dateStr}. The current year is ${year}.`;
}

// ---------------------------------------------------------------------------
// Astrology System Prompt (with current date!)
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
  
  return `You are VEYa, a warm and intuitive personal astrologer having a voice conversation.

CURRENT DATE: ${dateContext}

USER: ${name}
Sun Sign: ${sun} | Moon Sign: ${moon} | Rising Sign: ${rising}

YOUR VOICE & PERSONALITY:
- Speak like a caring, wise friend - warm and genuine
- Use natural speech patterns with emotion and empathy
- React to what they say - show you're listening
- Be encouraging, supportive, and understanding
- Add gentle humor when appropriate
- Sound like a real person, not a script

RULES:
- You ARE speaking via voice - respond conversationally
- Keep responses SHORT (2-3 sentences) - this is a conversation
- Always use CURRENT DATE when asked about dates/times
- Focus on astrology, spirituality, personal growth
- No lists or bullet points - speak naturally
- End with a caring question or encouraging thought`;
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
    throw error;
  }
}

export async function stopRecording(recording: Audio.Recording): Promise<string> {
  try {
    await recording.stopAndUnloadAsync();
    isRecording = false;
    
    const uri = recording.getURI();
    if (!uri) throw new Error('Failed to get recording URI');
    
    return uri;
  } catch (error) {
    isRecording = false;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Transcription (Whisper)
// ---------------------------------------------------------------------------

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

  isTranscribing = true;

  try {
    const formData = new FormData();
    const filename = audioUri.split('/').pop() || `recording.m4a`;
    
    formData.append('file', {
      uri: audioUri,
      name: filename,
      type: 'audio/m4a',
    } as unknown as Blob);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const response = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!response.ok) throw new Error(`Transcription failed: ${response.status}`);

    const data = await response.json();
    return data.text?.trim() || '';
  } finally {
    isTranscribing = false;
  }
}

// ---------------------------------------------------------------------------
// Chat Completion (GPT-4o for better responses)
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
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured');

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
        model: 'gpt-4o-mini', // Fast and current
        messages,
        max_tokens: 150,
        temperature: 0.9, // More creative/natural
      }),
    });

    if (!response.ok) throw new Error(`Chat failed: ${response.status}`);

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    return `I'm having a moment of cosmic interference, ${userProfile.name || 'love'}. Can you try again?`;
  }
}

// ---------------------------------------------------------------------------
// Text-to-Speech (OpenAI "shimmer" voice - most human-like)
// ---------------------------------------------------------------------------

export async function speakText(text: string): Promise<void> {
  if (!text.trim()) return;

  isSpeaking = true;
  console.log('[Voice] Speaking:', text.substring(0, 50) + '...');

  try {
    // Try OpenAI TTS first (human-like voice)
    const success = await speakWithOpenAI(text);
    
    if (!success) {
      // Fallback to device TTS
      console.log('[Voice] Falling back to device TTS');
      await speakWithDevice(text);
    }
  } catch (error) {
    console.error('[Voice] TTS error:', error);
    // Final fallback
    await speakWithDevice(text);
  } finally {
    isSpeaking = false;
  }
}

// OpenAI TTS with shimmer voice
async function speakWithOpenAI(text: string): Promise<boolean> {
  if (!OPENAI_API_KEY) return false;

  try {
    // Stop any current playback
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

    // Call OpenAI TTS API
    const response = await fetch(`${OPENAI_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1-hd', // HD quality for better voice
        voice: 'shimmer', // Most expressive, human-like female voice
        input: text,
        response_format: 'mp3',
      }),
    });

    if (!response.ok) {
      console.error('[Voice] OpenAI TTS failed:', response.status);
      return false;
    }

    // Convert to base64
    const arrayBuffer = await response.arrayBuffer();
    const base64 = uint8ArrayToBase64(new Uint8Array(arrayBuffer));
    
    // Save to file
    const fileUri = `${FileSystem.cacheDirectory}veya_voice_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Play the audio
    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true, volume: 1.0 }
    );
    currentSound = sound;

    // Wait for playback
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 30000);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    // Cleanup
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

// Device TTS fallback
async function speakWithDevice(text: string): Promise<void> {
  await Speech.stop();
  
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
  });

  await new Promise<void>((resolve) => {
    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.1, // Slightly higher for warmth
      rate: 0.9, // Slightly slower for clarity
      onDone: resolve,
      onError: () => resolve(),
      onStopped: resolve,
    });
  });
}

// Proper base64 encoding
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
