// src/services/realtimeWebSocket.ts
// OpenAI Realtime API via WebSocket — sub-second voice responses
// Architecture: ephemeral token → WebSocket → stream audio PCM chunks → play immediately
// This is Plan A: true real-time, <1s first response

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
let audioQueue: string[] = [];
let isPlayingQueue = false;

// Stop any playing audio immediately
export async function stopRealtimePlayback(): Promise<void> {
  audioQueue = [];
  isPlayingQueue = false;
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch (_) {}
    currentSound = null;
  }
}

// Play audio chunks as they arrive (streaming playback)
async function playChunk(base64Audio: string): Promise<void> {
  const fileUri = `${FileSystem.cacheDirectory}veya_chunk_${Date.now()}.mp3`;
  try {
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
      { shouldPlay: true, volume: 1.0 }
    );
    currentSound = sound;
    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 10000);
      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded && s.didJustFinish) { clearTimeout(t); resolve(); }
      });
    });
    await sound.unloadAsync();
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
    currentSound = null;
  } catch (_) { currentSound = null; }
}

async function drainQueue(): Promise<void> {
  if (isPlayingQueue) return;
  isPlayingQueue = true;
  while (audioQueue.length > 0) {
    const chunk = audioQueue.shift()!;
    await playChunk(chunk);
  }
  isPlayingQueue = false;
}

/**
 * Create an ephemeral token and open a WebSocket Realtime session.
 * Returns controls to send audio, commit, interrupt, and disconnect.
 */
export async function createRealtimeSession(
  systemPrompt: string,
  callbacks: RealtimeCallbacks
): Promise<RealtimeSession> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key missing');

  // Step 1: Get ephemeral token (valid 60s) — keeps API key off the WebSocket
  const tokenRes = await fetch(`${OPENAI_BASE}/realtime/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'ballad',
      modalities: ['audio', 'text'],
      instructions: systemPrompt,
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      turn_detection: null, // Manual control — we decide when the user is done
      max_response_output_tokens: 200,
    }),
  });

  if (!tokenRes.ok) throw new Error(`Token error: ${tokenRes.status}`);
  const tokenData = await tokenRes.json();
  const ephemeralKey = tokenData?.client_secret?.value;
  if (!ephemeralKey) throw new Error('No ephemeral key');

  // Step 2: Open WebSocket — auth passed via subprotocol (browser/RN approach)
  const ws = new WebSocket(
    'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
    [
      'realtime',
      `openai-insecure-api-key.${ephemeralKey}`,
      'openai-beta.realtime-v1',
    ]
  );

  let isConnected = false;
  let responseText = '';
  let transcript = '';

  ws.onopen = () => {
    isConnected = true;
    // Update session with our system prompt
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        instructions: systemPrompt,
        voice: 'ballad',
        modalities: ['audio', 'text'],
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: null,
        max_response_output_tokens: 200,
      },
    }));
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

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
          // Audio chunk arriving — queue it for immediate playback
          if (msg.delta) {
            callbacks.onAudioChunk(msg.delta);
            audioQueue.push(msg.delta);
            drainQueue(); // Start playing immediately as chunks arrive
          }
          break;

        case 'response.done':
          callbacks.onDone();
          break;

        case 'error':
          callbacks.onError(msg.error?.message || 'Realtime error');
          break;
      }
    } catch (_) {}
  };

  ws.onerror = () => {
    callbacks.onError('Connection error');
  };

  ws.onclose = () => {
    isConnected = false;
  };

  const session: RealtimeSession = {
    sendAudio: (base64Audio: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Convert base64 to the format the API expects
        ws.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: base64Audio,
        }));
      }
    },
    commitAudio: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
        ws.send(JSON.stringify({ type: 'response.create' }));
        responseText = '';
        transcript = '';
      }
    },
    interrupt: () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'response.cancel' }));
      }
      stopRealtimePlayback();
    },
    disconnect: () => {
      stopRealtimePlayback();
      ws.close();
    },
    get isConnected() { return isConnected; },
  };

  return session;
}
