/**
 * Sound Manager
 * Preloads and plays game sound effects + background music
 */

class SoundManager {
  constructor() {
    this.sounds = {};
    this.backgroundMusic = null;
    this.isInitialized = false;
    this.isMusicEnabled = true;
  }

  /**
   * Initialize and preload all sounds
   * Call this once when the game starts
   */
  init() {
    if (typeof window === 'undefined') return; // Skip on server-side
    if (this.isInitialized) return;

    // Preload sound effects
    this.sounds.check = this.createAudio('/sounds/check.mp3');
    this.sounds.checkmate = this.createAudio('/sounds/checkmate.mp3');
    this.sounds.move = this.createAudio('/sounds/move.mp3');
    this.sounds.castle = this.createAudio('/sounds/castle.mp3');
    this.sounds.stalemate = this.createAudio('/sounds/stalemate.mp3');
    this.sounds.start = this.createAudio('/sounds/start.mp3');
    this.sounds.capture = this.createAudio('/sounds/capture.mp3');
    
    
    // Setup background music
    this.backgroundMusic = this.createAudio('/sounds/background-music.mp3');
    this.backgroundMusic.loop = true; // Loop continuously
    this.backgroundMusic.volume = 0.3; // Quieter for background (30%)

    this.isInitialized = true;
    console.log('🔊 Sound Manager initialized');
  }

  /**
   * Start background music (call when game starts or user interacts)
   */
  startBackgroundMusic() {
    if (!this.backgroundMusic || !this.isMusicEnabled) return;
    
    this.backgroundMusic.play().catch(err => {
      console.log('Background music autoplay blocked (user interaction needed)');
    });
  }

  /**
   * Pause background music temporarily (during memes)
   */
  pauseBackgroundMusic() {
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
    }
  }

  /**
   * Resume background music after meme
   */
  resumeBackgroundMusic() {
    if (this.backgroundMusic && this.isMusicEnabled) {
      this.backgroundMusic.play().catch(err => {
        console.error('Failed to resume background music:', err);
      });
    }
  }

  /**
   * Toggle background music on/off
   */
  toggleBackgroundMusic() {
    this.isMusicEnabled = !this.isMusicEnabled;
    
    if (this.isMusicEnabled) {
      this.resumeBackgroundMusic();
    } else {
      this.pauseBackgroundMusic();
    }
    
    return this.isMusicEnabled;
  }

  /**
   * Check if music is currently enabled
   */
  isMusicPlaying() {
    return this.isMusicEnabled && this.backgroundMusic && !this.backgroundMusic.paused;
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