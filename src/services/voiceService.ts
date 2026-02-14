// ============================================================================
// VEYa Voice Service — Recording + Transcription + TTS
// ============================================================================

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_BASE = 'https://api.openai.com/v1';

let currentSound: Audio.Sound | null = null;
let isRecording = false;
let isTranscribing = false;
let isSpeaking = false;

export function getVoiceState() {
  return { isRecording, isTranscribing, isSpeaking };
}

export async function startRecording(): Promise<Audio.Recording> {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission not granted');
  }

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
  if (!uri) {
    throw new Error('Failed to capture audio recording');
  }
  return uri;
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key');
  }

  isTranscribing = true;
  try {
    const formData = new FormData();
    const name = audioUri.split('/').pop() || `recording-${Date.now()}.m4a`;
    const ext = name.split('.').pop() || 'm4a';
    const mime = ext === 'wav'
      ? 'audio/wav'
      : ext === 'mp3'
        ? 'audio/mpeg'
        : 'audio/m4a';

    formData.append('file', {
      uri: audioUri,
      name,
      type: mime,
    } as unknown as Blob);
    formData.append('model', 'whisper-1');

    const response = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Whisper API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json() as { text?: string };
    return data.text?.trim() || '';
  } finally {
    isTranscribing = false;
  }
}

export async function speakText(text: string, language?: string): Promise<void> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OpenAI API key');
  }

  if (!text.trim()) return;

  isSpeaking = true;

  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    // OpenAI TTS auto-detects language from text content
    // "nova" voice works well across all supported languages
    const response = await fetch(`${OPENAI_BASE}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        voice: 'nova',
        input: text,
        format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`OpenAI TTS error ${response.status}: ${errorBody}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');
    const fileUri = `${FileSystem.cacheDirectory}veya_tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: true });
    currentSound = sound;

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
  } finally {
    isSpeaking = false;
  }
}

export async function stopSpeaking(): Promise<void> {
  if (currentSound) {
    await currentSound.stopAsync();
    await currentSound.unloadAsync();
    currentSound = null;
  }
  isSpeaking = false;
}
