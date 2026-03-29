// ============================================================================
// realtimeVoice.ts — Single-call voice: audio in → audio+text out
// ============================================================================
// Uses gpt-4o-audio-preview: transcribes + responds + generates audio in one shot
// ~2-3s total latency vs 6-10s with the Whisper→GPT→TTS pipeline
// ============================================================================

import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const OPENAI_BASE = 'https://api.openai.com/v1';

// Module-level sound ref so stopRealtimeAudio() can interrupt playback
let currentRealtimeSound: Audio.Sound | null = null;

// Get API key at call time to always use latest env value
function getApiKey(): string {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
}

export interface RealtimeVoiceResult {
  transcript: string;     // What the user said (from audio.transcript)
  responseText: string;   // VEYa's text response (message.content)
  audioBase64: string;    // VEYa's audio response (base64 mp3)
}

/**
 * Single API call: send audio URI, get audio+text response back.
 * Uses gpt-4o-audio-preview for ~2s total latency vs 6-10s sequential pipeline.
 */
export async function callRealtimeVoice(
  audioUri: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
): Promise<RealtimeVoiceResult> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not configured');

  // Read audio file as base64
  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Build message array: system + recent history as text + new user audio message
  const messages: Array<{ role: string; content: unknown }> = [
    { role: 'system', content: systemPrompt },
    // Include last 4 turns as text context
    ...conversationHistory.slice(-4).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    // New user message as audio
    {
      role: 'user',
      content: [
        {
          type: 'input_audio',
          input_audio: {
            data: audioBase64,
            format: 'm4a',
          },
        },
      ],
    },
  ];

  // Single API call — transcribes + responds + generates audio
  const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-audio-preview',
      modalities: ['text', 'audio'],
      audio: {
        voice: 'onyx',  // Most expressive, human-like voice
        format: 'mp3',
      },
      messages,
      max_tokens: 150,    // Short responses for voice = faster
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`API error ${response.status}: ${JSON.stringify(err).slice(0, 100)}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const message = choice?.message;

  if (!message) throw new Error('No response from API');

  // Extract text response (may be in content or audio.transcript)
  const responseText = (typeof message.content === 'string' ? message.content : '') || '';

  // Extract audio response
  const audioData = message.audio;
  if (!audioData?.data) {
    throw new Error('No audio in response — model may not support audio output');
  }

  // The transcript of what the user said
  const transcript = audioData.transcript || '';

  return {
    transcript,
    responseText,
    audioBase64: audioData.data,
  };
}

/**
 * Play audio from base64 mp3 string. Resolves when playback finishes.
 */
export async function playAudioBase64(base64Audio: string): Promise<void> {
  // Stop any currently playing realtime audio
  await stopRealtimeAudio();

  const fileUri = `${FileSystem.cacheDirectory}veya_rt_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });

  const { sound } = await Audio.Sound.createAsync(
    { uri: fileUri },
    { shouldPlay: true, volume: 1.0 },
  );
  currentRealtimeSound = sound;

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 30000);
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
  } catch (_) {
    // cleanup failures are non-fatal
  }
  currentRealtimeSound = null;
}

/**
 * Stop realtime audio playback (called by VeYaVoiceMode close/orb-tap).
 */
export async function stopRealtimeAudio(): Promise<void> {
  if (currentRealtimeSound) {
    try {
      await currentRealtimeSound.stopAsync();
      await currentRealtimeSound.unloadAsync();
    } catch (_) {}
    currentRealtimeSound = null;
  }
}
