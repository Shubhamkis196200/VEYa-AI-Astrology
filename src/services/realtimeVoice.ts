// src/services/realtimeVoice.ts  — SIMPLIFIED SINGLE PATH
// Uses gpt-4o-audio-preview: send m4a audio → get text + audio response
// Voice: onyx (deep male, realistic)
// No WebSocket complexity. No fallbacks needed. Just works.

import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const OPENAI_BASE = 'https://api.openai.com/v1';

// Force bundle fingerprint change with this version string
export const VOICE_VERSION = 'v3-onyx-2026-03-29';

function getApiKey(): string {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
}

export interface VoiceResult {
  transcript: string;
  responseText: string;
  audioBase64: string;
}

let currentSound: Audio.Sound | null = null;

export async function stopVoicePlayback(): Promise<void> {
  if (currentSound) {
    try { await currentSound.stopAsync(); await currentSound.unloadAsync(); } catch (_) {}
    currentSound = null;
  }
}

export async function playVoiceAudio(base64mp3: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}veya_voice_${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(uri, base64mp3, { encoding: FileSystem.EncodingType.Base64 });
  await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, shouldDuckAndroid: true });
  const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: 1.0 });
  currentSound = sound;
  await new Promise<void>((resolve) => {
    const t = setTimeout(resolve, 30000);
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.isLoaded && s.didJustFinish) { clearTimeout(t); resolve(); }
    });
  });
  try { await sound.unloadAsync(); } catch (_) {}
  try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch (_) {}
  currentSound = null;
}

export async function sendVoiceMessage(
  audioUri: string,
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<VoiceResult> {
  const key = getApiKey();
  if (!key) throw new Error('No API key');

  const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const messages: Array<{ role: string; content: unknown }> = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-4).map(m => ({ role: m.role, content: m.content })),
    {
      role: 'user',
      content: [{ type: 'input_audio', input_audio: { data: audioBase64, format: 'mp4' } }],
    },
  ];

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-audio-preview',
      modalities: ['text', 'audio'],
      audio: { voice: 'onyx', format: 'mp3' },
      messages,
      max_tokens: 120,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Voice API ${res.status}: ${err.slice(0, 80)}`);
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  const responseText = typeof msg?.content === 'string' ? msg.content : '';
  const transcript = msg?.audio?.transcript || '';
  const audioData = msg?.audio?.data || '';

  if (!audioData) throw new Error('No audio returned');
  return { transcript, responseText, audioBase64: audioData };
}
// FORCE_RELOAD: onyx-voice-v3-1774752804
