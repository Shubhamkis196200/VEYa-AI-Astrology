// src/services/realtimeWebSocket.ts
// OpenAI Realtime API — collect full audio then play once (smooth, no choppiness)

import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

const OPENAI_BASE = 'https://api.openai.com/v1';

function getApiKey(): string {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
}

export interface RealtimeSession {
  sendAudio: (base64Audio: string) => void;
  commitAudio: () => void;
  interrupt: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

export interface RealtimeCallbacks {
  onTranscript: (text: string) => void;
  onResponseText: (text: string) => void;
  onAudioChunk: (base64: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
}

let currentSound: Audio.Sound | null = null;

export async function stopRealtimePlayback(): Promise<void> {
  if (currentSound) {
    try { await currentSound.stopAsync(); await currentSound.unloadAsync(); } catch (_) {}
    currentSound = null;
  }
}

async function playBase64Audio(base64: string, format: 'mp3' | 'pcm' = 'mp3'): Promise<void> {
  const ext = format === 'pcm' ? 'pcm' : 'mp3';
  const fileUri = `${FileSystem.cacheDirectory}veya_out_${Date.now()}.${ext}`;
  try {
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true, shouldDuckAndroid: true });
    const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true, volume: 1.0 });
    currentSound = sound;
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 30000);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) { clearTimeout(t); resolve(); }
      });
    });
    try { await sound.unloadAsync(); } catch (_) {}
    try { await FileSystem.deleteAsync(fileUri, { idempotent: true }); } catch (_) {}
    currentSound = null;
  } catch (_) { currentSound = null; }
}

export async function createRealtimeSession(
  systemPrompt: string,
  callbacks: RealtimeCallbacks
): Promise<RealtimeSession> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key missing');

  // Get ephemeral token
  const tokenRes = await fetch(`${OPENAI_BASE}/realtime/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'onyx',
      modalities: ['audio', 'text'],
      instructions: systemPrompt,
      input_audio_format: 'g711_ulaw', // More compatible than pcm16
      output_audio_format: 'mp3',       // Get MP3 back = playable directly
      turn_detection: null,
      max_response_output_tokens: 150,
    }),
  });

  if (!tokenRes.ok) {
    const e = await tokenRes.text();
    throw new Error(`Token error ${tokenRes.status}: ${e.slice(0, 100)}`);
  }
  const tokenData = await tokenRes.json();
  const ephemeralKey = tokenData?.client_secret?.value;
  if (!ephemeralKey) throw new Error('No ephemeral key in response');

  const ws = new WebSocket(
    'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
    ['realtime', `openai-insecure-api-key.${ephemeralKey}`, 'openai-beta.realtime-v1']
  );

  let isConnected = false;
  let responseText = '';
  let transcript = '';
  let audioChunks: string[] = [];

  ws.onopen = () => {
    isConnected = true;
    // Update session with our instructions
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: systemPrompt,
        voice: 'onyx',
        modalities: ['audio', 'text'],
        input_audio_format: 'g711_ulaw',
        output_audio_format: 'mp3',
        turn_detection: null,
        max_response_output_tokens: 150,
        input_audio_transcription: { model: 'whisper-1' },
      },
    }));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(typeof event.data === 'string' ? event.data : '{}');

      switch (msg.type) {
        case 'conversation.item.input_audio_transcription.completed':
          transcript = msg.transcript || '';
          callbacks.onTranscript(transcript);
          break;

        case 'response.text.delta':
          responseText += msg.delta || '';
          callbacks.onResponseText(responseText);
          break;

        case 'response.audio.delta':
          if (msg.delta) {
            audioChunks.push(msg.delta);
            callbacks.onAudioChunk(msg.delta);
          }
          break;

        case 'response.audio.done':
          // All audio chunks received — concatenate and play as one
          if (audioChunks.length > 0) {
            const fullAudio = audioChunks.join('');
            audioChunks = [];
            playBase64Audio(fullAudio, 'mp3').then(() => {
              callbacks.onDone();
            });
          } else {
            callbacks.onDone();
          }
          break;

        case 'response.done':
          if (audioChunks.length === 0) {
            callbacks.onDone();
          }
          break;

        case 'error':
          callbacks.onError(msg.error?.message || 'Realtime error');
          break;
      }
    } catch (_) {}
  };

  ws.onerror = (e) => {
    callbacks.onError('Connection lost. Reconnecting...');
  };

  ws.onclose = () => { isConnected = false; };

  return {
    sendAudio: (base64Audio: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64Audio }));
      }
    },
    commitAudio: () => {
      if (ws.readyState === WebSocket.OPEN) {
        audioChunks = [];
        responseText = '';
        transcript = '';
        ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
        ws.send(JSON.stringify({ type: 'response.create' }));
      }
    },
    interrupt: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'response.cancel' }));
      }
      audioChunks = [];
      stopRealtimePlayback();
    },
    disconnect: () => {
      audioChunks = [];
      stopRealtimePlayback();
      ws.close();
    },
    get isConnected() { return isConnected; },
  };
}
