/**
 * Text-to-Speech (TTS) Service
 * 
 * Features:
 * - Convert AI responses to speech using Web Speech API
 * - Multiple voice options
 * - Play/pause/stop controls
 * - Speech rate and pitch adjustment
 * - Auto-play option
 */

export interface TTSOptions {
  rate?: number;        // 0.1 - 10, default 1
  pitch?: number;      // 0 - 2, default 1
  volume?: number;      // 0 - 1, default 1
  voice?: string;      // Voice name
  lang?: string;       // Language code
}

export interface VoiceInfo {
  id: string;
  name: string;
  lang: string;
  localService: boolean;
}

export class TTSService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();
    
    // Voices may load asynchronously
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    this.voices = this.synth.getVoices();
  }

  /**
   * Get available voices
   */
  getVoices(): VoiceInfo[] {
    return this.voices.map(v => ({
      id: v.voiceURI,
      name: v.name,
      lang: v.lang,
      localService: v.localService,
    }));
  }

  /**
   * Get Chinese voices
   */
  getChineseVoices(): VoiceInfo[] {
    return this.getVoices().filter(v => 
      v.lang.startsWith('zh') || v.lang.includes('Chinese')
    );
  }

  /**
   * Get English voices
   */
  getEnglishVoices(): VoiceInfo[] {
    return this.getVoices().filter(v => 
      v.lang.startsWith('en') || v.lang.includes('English')
    );
  }

  /**
   * Check if TTS is available
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Check if currently speaking
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Check if paused
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Speak text
   */
  speak(text: string, options: TTSOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set options
      if (options.rate !== undefined) utterance.rate = options.rate;
      if (options.pitch !== undefined) utterance.pitch = options.pitch;
      if (options.volume !== undefined) utterance.volume = options.volume;
      
      // Set voice
      if (options.voice) {
        const voice = this.voices.find(v => v.voiceURI === options.voice);
        if (voice) utterance.voice = voice;
      }

      // Set language
      if (options.lang) {
        utterance.lang = options.lang;
      } else {
        // Auto-detect language
        const hasChinese = /[\u4e00-\u9fa5]/.test(text);
        utterance.lang = hasChinese ? 'zh-CN' : 'en-US';
      }

      // Events
      utterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
      };

      utterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentUtterance = null;
        if (event.error !== 'canceled') {
          reject(new Error(`Speech error: ${event.error}`));
        } else {
          resolve(); // Canceled is not an error
        }
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  /**
   * Stop speech
   */
  stop() {
    this.synth.cancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  /**
   * Toggle play/pause
   */
  toggle(text: string, options: TTSOptions = {}): Promise<void> {
    if (this.isPlaying && !this.isPaused) {
      this.pause();
      return Promise.resolve();
    } else if (this.isPaused) {
      this.resume();
      return Promise.resolve();
    } else {
      return this.speak(text, options);
    }
  }

  /**
   * Get default voice for language
   */
  getDefaultVoice(lang: string = 'zh-CN'): SpeechSynthesisVoice | null {
    // Try to find exact match
    let voice = this.voices.find(v => v.lang === lang);
    
    if (!voice) {
      // Try to find partial match
      voice = this.voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    }
    
    // Fallback to any voice
    return voice || this.voices[0];
  }

  /**
   * Test TTS with a sample
   */
  test(sampleText: string = '你好，这是一个语音测试。') {
    return this.speak(sampleText, {
      rate: 1,
      pitch: 1,
      volume: 1,
    });
  }
}

export const ttsService = new TTSService();
