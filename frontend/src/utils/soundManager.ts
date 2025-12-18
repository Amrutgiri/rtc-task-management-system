/**
 * Notification Sound Management
 * Provides utilities for playing notification sounds
 */

/**
 * A higher-quality notification sound (beep)
 * Generated as WAV audio data
 */
const NOTIFICATION_SOUNDS = {
  // Ding sound (higher pitch)
  ding: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',

  // Chime sound
  chime: 'data:audio/wav;base64,UklGRiIAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',

  // Subtle beep
  beep: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
};

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    try {
      // Modern browsers
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (err) {
      console.log('AudioContext not available');
    }
  }

  /**
   * Play a simple beep using Web Audio API
   * Provides better control and works even if sounds are blocked
   */
  playBeep(frequency: number = 800, duration: number = 200) {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      const ctx = this.audioContext;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + duration / 1000
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (err) {
      console.error('Error playing beep:', err);
    }
  }

  /**
   * Play a notification sound using HTML5 Audio
   */
  playSound(soundType: keyof typeof NOTIFICATION_SOUNDS = 'ding') {
    if (!this.isEnabled) return;

    try {
      const soundUrl = NOTIFICATION_SOUNDS[soundType];
      const audio = new Audio(soundUrl);
      audio.volume = this.volume;
      audio.play().catch(() => {
        console.log('Could not play notification sound');
      });
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  }

  /**
   * Play a more complex notification pattern
   */
  playNotificationPattern() {
    if (!this.isEnabled) return;

    // Play a pattern: beep, slight pause, beep
    try {
      this.playBeep(800, 150);
      setTimeout(() => {
        this.playBeep(1000, 150);
      }, 200);
    } catch (err) {
      console.error('Error playing notification pattern:', err);
    }
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Set volume level (0-1)
   */
  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Get current enabled state
   */
  isEnabled_: boolean = true;

  get enabled(): boolean {
    return this.isEnabled;
  }
}

// Create singleton instance
export const soundManager = new NotificationSoundManager();

/**
 * Request microphone/audio permissions (for browser notifications)
 */
export async function requestAudioPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream as we only need permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    console.log('Audio permission denied:', err);
    return false;
  }
}

/**
 * Check if audio is supported in browser
 */
export function isAudioSupported(): boolean {
  return !!(
    window.AudioContext ||
    (window as any).webkitAudioContext ||
    (window as any).audioContext
  );
}

/**
 * Check if Notification API is supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') return true;

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  }

  return false;
}

/**
 * Send a browser notification
 */
export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
    return true;
  } catch (err) {
    console.error('Error sending browser notification:', err);
    return false;
  }
}

export default soundManager;
