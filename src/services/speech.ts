export const DEFAULT_ELEVENLABS_KEY = 'sk_4b016843f0b1ebd14f286187aa25023d6248edc8c4efeea9';
export const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
export const DEFAULT_PLAYBACK_RATE = 0.88;

export const ASMAE_VOICE_OPTIONS = [
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah — معلمة هادئة وحنونة (الافتراضي)',
    description: 'نبرة لطيفة ومتأنية مناسبة جداً لأطفال طيف التوحد',
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel — نبرة دافئة وواضحة',
    description: 'صوت واضح وهادئ مخارج حروفه دقيقة',
  },
];

export const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

/**
 * Adds gentle breathing pauses (...) between key Arabic words/clauses
 * before sending to ElevenLabs so auditory processing is calm and deliberate for ASD learners.
 */
export function formatTextWithCalmPauses(rawText: string): string {
  const cleaned = rawText.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  // Replace commas with a deliberate pause
  const withCommaPauses = cleaned.replace(/،/g, ' ... ');
  const words = withCommaPauses.split(/\s+/).filter(Boolean);

  // If short phrase (2-4 words), insert a gentle pause "..." between key words
  if (words.length <= 4) {
    return words.join(' ... ');
  }

  // For longer sentences, insert a gentle breathing pause every 2 words if not already paused
  const result: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    result.push(word);
    const isLast = i === words.length - 1;
    const nextIsPause = words[i + 1] === '...';
    const currentIsPause = word === '...' || word.endsWith('.') || word.endsWith('؟') || word.endsWith('!');
    if (!isLast && !currentIsPause && !nextIsPause && i % 2 === 1) {
      result.push('...');
    }
  }
  return result.join(' ').replace(/\s+\.\.\.\s+\.\.\./g, ' ... ');
}

export function getSavedPlaybackRate(): number {
  if (typeof window === 'undefined') return DEFAULT_PLAYBACK_RATE;
  const saved = parseFloat(localStorage.getItem('ASMAE_PLAYBACK_RATE') || '');
  if (!Number.isNaN(saved) && saved >= 0.7 && saved <= 1.0) {
    return Number(saved.toFixed(2));
  }
  return DEFAULT_PLAYBACK_RATE;
}

export function setSavedPlaybackRate(rate: number): number {
  const clamped = Math.min(1.0, Math.max(0.7, Number(rate.toFixed(2))));
  if (typeof window !== 'undefined') {
    localStorage.setItem('ASMAE_PLAYBACK_RATE', String(clamped));
  }
  if (currentAudio) {
    try {
      currentAudio.playbackRate = clamped;
    } catch {
      // ignore
    }
  }
  return clamped;
}

export function stopAllAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

function applyAudioPlaybackSettings(audio: HTMLAudioElement, rate: number) {
  audio.playbackRate = rate;
  // Preserve natural pitch when slowing down audio for ASD sensory comfort
  if ('preservesPitch' in audio) {
    (audio as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
  }
}

export async function speakArabicText(
  text: string,
  soundEnabled: boolean = true,
  onStartSpeaking?: () => void,
  onEndSpeaking?: () => void
): Promise<void> {
  if (!soundEnabled || !text || !text.trim()) {
    if (onEndSpeaking) onEndSpeaking();
    return;
  }
  stopAllAudio();

  const cleanText = text.trim();
  const pacedTextForTTS = formatTextWithCalmPauses(cleanText);
  const playbackRate = getSavedPlaybackRate();

  const apiKey = (
    (typeof window !== 'undefined' && localStorage.getItem('ELEVENLABS_API_KEY')) ||
    DEFAULT_ELEVENLABS_KEY
  ).trim();
  const voiceId =
    (typeof window !== 'undefined' && localStorage.getItem('ELEVENLABS_VOICE_ID')) ||
    DEFAULT_VOICE_ID;

  // 1. إذا كان الصوت محفوظاً مسبقاً في الكاش، شغله فوراً بدون استهلاك رصيد الـ API
  const cacheKey = `${voiceId}_${pacedTextForTTS}`;
  if (audioCache.has(cacheKey)) {
    try {
      currentAudio = new Audio(audioCache.get(cacheKey)!);
      applyAudioPlaybackSettings(currentAudio, playbackRate);
      if (onStartSpeaking) onStartSpeaking();
      currentAudio.onended = () => {
        if (onEndSpeaking) onEndSpeaking();
      };
      currentAudio.onerror = () => {
        if (onEndSpeaking) onEndSpeaking();
      };
      await currentAudio.play();
      return;
    } catch {
      // If cached audio fails, proceed to fetch
    }
  }

  // 2. الاتصال بـ ElevenLabs API لجلب ملف MP3 بسرعة متأنية ووقفات تنفس لطيفة
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: pacedTextForTTS,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.90,
          similarity_boost: 0.80,
          style: 0.0,
          speed: 0.78,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs HTTP Error: ${response.status}`);
    }

    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    audioCache.set(cacheKey, audioUrl);

    currentAudio = new Audio(audioUrl);
    applyAudioPlaybackSettings(currentAudio, playbackRate);
    if (onStartSpeaking) onStartSpeaking();
    currentAudio.onended = () => {
      if (onEndSpeaking) onEndSpeaking();
    };
    currentAudio.onerror = () => {
      if (onEndSpeaking) onEndSpeaking();
    };
    await currentAudio.play();
    return;
  } catch (error) {
    console.warn('ElevenLabs TTS fallback triggered:', error);
  }

  // 3. البديل التلقائي في حال انقطاع الإنترنت
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (onStartSpeaking) onStartSpeaking();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ar-SA';
      utterance.rate = Math.min(0.85, playbackRate);
      utterance.onend = () => {
        if (onEndSpeaking) onEndSpeaking();
      };
      utterance.onerror = () => {
        if (onEndSpeaking) onEndSpeaking();
      };
      window.speechSynthesis.speak(utterance);
      return;
    } catch {
      if (onEndSpeaking) onEndSpeaking();
    }
  } else {
    if (onEndSpeaking) onEndSpeaking();
  }
}

class AsmaeSpeechService {
  private muted = false;
  private isSpeaking = false;
  private isLoading = false;
  private stateListeners: Array<(state: { isSpeaking: boolean; isLoading: boolean }) => void> = [];
  private speakingListeners: Array<(isSpeaking: boolean) => void> = [];

  public get audioCache(): Map<string, string> {
    return audioCache;
  }

  public getPlaybackRate(): number {
    return getSavedPlaybackRate();
  }

  public setPlaybackRate(rate: number): number {
    return setSavedPlaybackRate(rate);
  }

  public isPromptCached(text: string): boolean {
    const voiceId =
      (typeof window !== 'undefined' && localStorage.getItem('ELEVENLABS_VOICE_ID')) ||
      DEFAULT_VOICE_ID;
    const pacedText = formatTextWithCalmPauses(text.trim());
    return audioCache.has(`${voiceId}_${pacedText}`);
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    if (mute) {
      this.emergencyStop();
    }
  }

  public onSpeakingChange(cb: (isSpeaking: boolean) => void): () => void {
    this.speakingListeners.push(cb);
    cb(this.isSpeaking);
    return () => {
      this.speakingListeners = this.speakingListeners.filter((l) => l !== cb);
    };
  }

  public onAudioStateChange(
    cb: (state: { isSpeaking: boolean; isLoading: boolean }) => void
  ): () => void {
    this.stateListeners.push(cb);
    cb({ isSpeaking: this.isSpeaking, isLoading: this.isLoading });
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== cb);
    };
  }

  private updateState(speaking: boolean, loading: boolean) {
    this.isSpeaking = speaking;
    this.isLoading = loading;
    for (const cb of this.speakingListeners) {
      cb(speaking);
    }
    for (const cb of this.stateListeners) {
      cb({ isSpeaking: speaking, isLoading: loading });
    }
  }

  public async speak(text: string, onComplete?: () => void): Promise<void> {
    if (this.muted || !text || !text.trim()) {
      this.updateState(false, false);
      if (onComplete) onComplete();
      return;
    }

    const isCached = this.isPromptCached(text);
    this.updateState(false, !isCached);

    await speakArabicText(
      text,
      !this.muted,
      () => {
        this.updateState(true, false);
      },
      () => {
        this.updateState(false, false);
        if (onComplete) onComplete();
      }
    );
  }

  public emergencyStop(): void {
    stopAllAudio();
    this.updateState(false, false);
  }
}

export const speechService = new AsmaeSpeechService();
