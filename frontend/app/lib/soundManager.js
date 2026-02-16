/**
 * Sound Manager
 * Preloads and plays game sound effects
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.isInitialized = false;
  }

  /**
   * Initialize and preload all sounds
   * Call this once when the game starts
   */
  init() {
    if (typeof window === 'undefined') return; // Skip on server-side
    if (this.isInitialized) return;

    // Preload sound files
    this.sounds.check = this.createAudio('/sounds/check.mp3');
    this.sounds.checkmate = this.createAudio('/sounds/checkmate.mp3');
    
    // Optionally preload more sounds:
    // this.sounds.move = this.createAudio('/sounds/move.mp3');
    // this.sounds.capture = this.createAudio('/sounds/capture.mp3');

    this.isInitialized = true;
    console.log('🔊 Sound Manager initialized');
  }

  /**
   * Create an audio element and preload it
   */
  createAudio(src) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.volume = 0.6; // 60% volume, adjust as needed
    
    audio.addEventListener('error', (e) => {
      console.warn(`Failed to load sound: ${src}`, e);
    });

    return audio;
  }

  /**
   * Play a sound effect
   * @param {string} soundName - 'check', 'checkmate', etc.
   */
  play(soundName) {
    if (!this.isInitialized) {
      console.warn('Sound Manager not initialized');
      return;
    }

    const sound = this.sounds[soundName];
    if (!sound) {
      console.warn(`Sound not found: ${soundName}`);
      return;
    }

    // Reset to beginning if already playing
    sound.currentTime = 0;
    
    sound.play().catch(err => {
      console.error(`Failed to play sound: ${soundName}`, err);
    });
  }

  /**
   * Stop a specific sound
   */
  stop(soundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    Object.values(this.sounds).forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  /**
   * Set volume for all sounds (0.0 to 1.0)
   */
  setVolume(volume) {
    Object.values(this.sounds).forEach(sound => {
      sound.volume = Math.max(0, Math.min(1, volume));
    });
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Auto-initialize on first import (browser only)
if (typeof window !== 'undefined') {
  soundManager.init();
}