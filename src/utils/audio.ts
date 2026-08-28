/**
 * Audio Recording and Speech Synthesis Utilities for Nexus Gemini
 */

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async start(): Promise<void> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Choose preferred mimeType
    let mimeType = "audio/webm";
    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
      mimeType = "audio/mp4";
    }

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };
    this.mediaRecorder.start(200);
  }

  stop(): Promise<{ base64: string; mimeType: string; blob: Blob }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error("MediaRecorder not started"));
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });

          // Convert blob to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result as string;
            // Strip data:audio/webm;base64, prefix
            const base64 = base64data.split(",")[1];
            
            // Stop mic tracks
            if (this.stream) {
              this.stream.getTracks().forEach((track) => track.stop());
              this.stream = null;
            }

            resolve({
              base64,
              mimeType,
              blob: audioBlob,
            });
          };
          reader.onerror = (err) => reject(err);
        } catch (e) {
          reject(e);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}

// Text to Speech playback controller
class TTSManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private onStateChange: ((speaking: boolean, messageId?: string) => void) | null = null;
  private activeMessageId: string | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices loaded
      };
    }
  }

  setCallback(cb: (speaking: boolean, messageId?: string) => void) {
    this.onStateChange = cb;
  }

  speak(text: string, messageId: string, rate = 1.0): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    this.stop();

    // Clean markdown symbols for natural reading
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
      .replace(/[#*_~]/g, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;

    // Pick best English voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))
    ) || voices.find((v) => v.lang.startsWith("en"));

    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    this.activeMessageId = messageId;
    this.isSpeaking = true;
    this.currentUtterance = utterance;

    if (this.onStateChange) this.onStateChange(true, messageId);

    utterance.onend = () => {
      this.isSpeaking = false;
      this.activeMessageId = null;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.activeMessageId = null;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.activeMessageId = null;
    this.currentUtterance = null;
    if (this.onStateChange) this.onStateChange(false);
  }

  getActiveMessageId(): string | null {
    return this.activeMessageId;
  }
}

export const tts = new TTSManager();
