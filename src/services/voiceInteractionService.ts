/**
 * Voice Interaction Service
 * 
 * Features:
 * - Speech-to-Text (STT) using Web Speech API
 * - Text-to-Speech (TTS) using Web Speech API
 * - Voice commands
 * - Audio recording and playback
 * - Multi-language support
 */

export interface VoiceOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

export interface VoiceCommand {
  command: string;
  action: () => void;
}

export type VoiceStatus = 'idle' | 'listening' | 'speaking' | 'processing' | 'error';

export class VoiceInteractionService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private status: VoiceStatus = 'idle';
  private statusCallbacks: Set<(status: VoiceStatus) => void> = new Set();
  private transcriptCallbacks: Set<(transcript: string, isFinal: boolean) => void> = new Set();
  private errorCallbacks: Set<(error: string) => void> = new Set();
  private commands: VoiceCommand[] = [];
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initVoices();
    this.initSpeechRecognition();
  }

  /**
   * Initialize available voices
   */
  private initVoices() {
    const loadVoices = () => {
      this.voices = this.synthesis.getVoices();
    };
    
    loadVoices();
    
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Initialize Speech Recognition
   */
  private initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'zh-CN';

      this.recognition.onstart = () => this.setStatus('listening');
      this.recognition.onend = () => {
        if (this.status === 'listening') {
          this.setStatus('idle');
        }
      };
      
      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            this.checkCommands(transcript);
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          this.transcriptCallbacks.forEach(cb => cb(finalTranscript, true));
        }
        if (interimTranscript) {
          this.transcriptCallbacks.forEach(cb => cb(interimTranscript, false));
        }
      };

      this.recognition.onerror = (event) => {
        this.setStatus('error');
        this.errorCallbacks.forEach(cb => cb(event.error));
      };
    }
  }

  /**
   * Check voice commands
   */
  private checkCommands(transcript: string) {
    const lowerTranscript = transcript.toLowerCase().trim();
    for (const cmd of this.commands) {
      if (lowerTranscript.includes(cmd.command.toLowerCase())) {
        cmd.action();
        break;
      }
    }
  }

  /**
   * Start voice recognition
   */
  startListening(options?: { language?: string }): boolean {
    if (!this.recognition) {
      this.errorCallbacks.forEach(cb => cb('Speech recognition not supported'));
      return false;
    }

    try {
      if (options?.language) {
        this.recognition.lang = options.language;
      }
      this.recognition.start();
      return true;
    } catch (error) {
      this.errorCallbacks.forEach(cb => cb('Failed to start listening'));
      return false;
    }
  }

  /**
   * Stop voice recognition
   */
  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
      this.setStatus('idle');
    }
  }

  /**
   * Speak text
   */
  speak(text: string, options?: VoiceOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply options
      if (options?.language) utterance.lang = options.language;
      if (options?.rate) utterance.rate = options.rate;
      if (options?.pitch) utterance.pitch = options.pitch;
      if (options?.volume) utterance.volume = options.volume;
      if (options?.voice) utterance.voice = options.voice;

      // Default to Chinese voice if available
      if (!options?.voice) {
        const chineseVoice = this.voices.find(v => v.lang.includes('zh'));
        if (chineseVoice) utterance.voice = chineseVoice;
      }

      utterance.onstart = () => this.setStatus('speaking');
      utterance.onend = () => {
        this.setStatus('idle');
        resolve();
      };
      utterance.onerror = (event) => {
        this.setStatus('error');
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.setStatus('idle');
    }
  }

  /**
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get Chinese voices
   */
  getChineseVoices(): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.includes('zh'));
  }

  /**
   * Check if voice is supported
   */
  isSupported(): { stt: boolean; tts: boolean } {
    return {
      stt: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      tts: 'speechSynthesis' in window,
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: VoiceStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  /**
   * Subscribe to transcript updates
   */
  onTranscript(callback: (transcript: string, isFinal: boolean) => void): () => void {
    this.transcriptCallbacks.add(callback);
    return () => this.transcriptCallbacks.delete(callback);
  }

  /**
   * Subscribe to errors
   */
  onError(callback: (error: string) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Add voice command
   */
  addCommand(command: string, action: () => void) {
    this.commands.push({ command, action });
  }

  /**
   * Remove voice command
   */
  removeCommand(command: string) {
    this.commands = this.commands.filter(c => c.command !== command);
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.mediaRecorder = new MediaRecorder(stream);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      return true;
    } catch (error) {
      this.errorCallbacks.forEach(cb => cb('Failed to start recording'));
      return false;
    }
  }

  /**
   * Stop audio recording
   */
  stopRecording(): Blob | null {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      
      // Stop all tracks
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      if (this.recordedChunks.length > 0) {
        return new Blob(this.recordedChunks, { type: 'audio/webm' });
      }
    }
    return null;
  }

  /**
   * Play audio blob
   */
  playAudio(blob: Blob): HTMLAudioElement {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    
    audio.onended = () => {
      URL.revokeObjectURL(url);
    };
    
    audio.play();
    return audio;
  }

  /**
   * Set status and notify listeners
   */
  private setStatus(status: VoiceStatus) {
    this.status = status;
    this.statusCallbacks.forEach(cb => cb(status));
  }

  /**
   * Get current status
   */
  getStatus(): VoiceStatus {
    return this.status;
  }

  /**
   * Predefined voice commands
   */
  setupDefaultCommands(callbacks: {
    onSend?: () => void;
    onClear?: () => void;
    onStop?: () => void;
  }) {
    if (callbacks.onSend) {
      this.addCommand('发送', callbacks.onSend);
      this.addCommand('发送消息', callbacks.onSend);
    }
    if (callbacks.onClear) {
      this.addCommand('清空', callbacks.onClear);
      this.addCommand('清除', callbacks.onClear);
    }
    if (callbacks.onStop) {
      this.addCommand('停止', callbacks.onStop);
      this.addCommand('停', callbacks.onStop);
    }
  }
}

// Singleton instance
export const voiceInteractionService = new VoiceInteractionService();
export default voiceInteractionService;
