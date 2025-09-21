import { clientLogger } from '@shared';
import type { ServerUserPreferences } from '@shared/types/domain/user/user.types';

import {
  AUDIO_CATEGORIES,
  AUDIO_CONFIG,
  AUDIO_PATHS,
  AudioCategory,
  AudioKey,
  DEFAULT_CATEGORY_VOLUMES,
} from '../../constants';
import { AudioServiceInterface } from '../../types';

/**
 * Enhanced Audio Service for EveryTriv
 * Manages all audio playback, volume control, and muting
 *
 * @module ClientAudioService
 * @description Client-side audio management and playback service
 * @used_by client/src/components/audio, client/src/components/game, client/src/hooks
 */
export class AudioService implements AudioServiceInterface {
  private audioElements: Map<AudioKey, HTMLAudioElement> = new Map();
  private isMuted = false;
  private volumes: Map<AudioKey, number> = new Map();
  private categoryVolumes: Map<AudioCategory, number>;
  private userInteracted = false;
  private userPreferences: ServerUserPreferences | null = null;

  constructor() {
    this.categoryVolumes = new Map(
      Object.entries(DEFAULT_CATEGORY_VOLUMES) as [AudioCategory, number][]
    );

    this.preloadEssentialAudio();

    this.setupUserInteractionListener();
  }

  /**
   * Setup listener for first user interaction to enable audio
   */
  private setupUserInteractionListener(): void {
    const enableAudio = () => {
      this.userInteracted = true;
      if (!this.isMuted) {
        this.play(AudioKey.BACKGROUND_MUSIC);
      }
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
  }

  /**
   * Preload only essential audio files for immediate use
   */
  private preloadEssentialAudio(): void {
    const essentialKeys: AudioKey[] = [
      AudioKey.CLICK,
      AudioKey.POP,
      AudioKey.HOVER,
      AudioKey.BACKGROUND_MUSIC,
      AudioKey.GAME_MUSIC,
    ];

    essentialKeys.forEach(key => {
      const path = AUDIO_PATHS[key];
      if (path) {
        const category = AUDIO_CATEGORIES[key];
        const defaultVolume = this.categoryVolumes.get(category) || 0.7;
        const config = AUDIO_CONFIG[key] || {};

        this.preloadAudioInternal(key, path, {
          volume: config.volume || defaultVolume,
          loop: config.loop || false,
        });
      }
    });
  }

  /**
   * Preload a single audio file
   */
  private preloadAudioInternal(
    key: AudioKey,
    src: string,
    config: { volume?: number; loop?: boolean }
  ): void {
    const audio = new Audio();
    audio.volume = this.isMuted ? 0 : config.volume || 0.7;
    audio.loop = config.loop || false;

    audio.preload = 'metadata';

    audio.addEventListener('error', e => {
      clientLogger.mediaError(`Failed to load audio file: ${key} (${src})`, { error: e, key, src });
    });

    this.audioElements.set(key, audio);
    this.volumes.set(key, config.volume || 0.7);

    // Set src and load after everything is set up
    audio.src = src;
    audio.load();
  }

  /**
   * Load audio file on demand if not already loaded
   */
  private ensureAudioLoaded(key: AudioKey): HTMLAudioElement | null {
    let audio = this.audioElements.get(key);

    if (!audio) {
      const path = AUDIO_PATHS[key];
      if (path) {
        const category = AUDIO_CATEGORIES[key];
        const defaultVolume = this.categoryVolumes.get(category) || 0.7;
        const config = AUDIO_CONFIG[key] || {};

        this.preloadAudioInternal(key, path, {
          volume: config.volume || defaultVolume,
          loop: config.loop || false,
        });
        audio = this.audioElements.get(key);
      }
    }

    return audio || null;
  }

  /**
   * Set user preferences for audio control
   */
  public setUserPreferences(preferences: ServerUserPreferences | null): void {
    this.userPreferences = preferences;
    clientLogger.userDebug('Audio preferences updated', {
      soundEnabled: preferences?.soundEnabled,
      musicEnabled: preferences?.musicEnabled,
    });
  }

  /**
   * Play a sound
   */
  public play(key: AudioKey): void {
    const audio = this.ensureAudioLoaded(key);
    if (!audio) {
      clientLogger.mediaWarn(`Audio not found: ${key}`, {
        key,
        availableKeys: Array.from(this.audioElements.keys()),
      });
      return;
    }

    // Check user preferences for sound effects
    if (
      AUDIO_CATEGORIES[key] === AudioCategory.EFFECTS &&
      this.userPreferences &&
      !this.userPreferences.soundEnabled
    ) {
      return;
    }

    // Check user preferences for music
    if (
      AUDIO_CATEGORIES[key] === AudioCategory.MUSIC &&
      this.userPreferences &&
      !this.userPreferences.musicEnabled
    ) {
      return;
    }

    // Don't try to play background music until user has interacted
    if (key === AudioKey.BACKGROUND_MUSIC && !this.userInteracted) {
      return;
    }

    // If it's music, restart from the beginning
    if (AUDIO_CATEGORIES[key] === AudioCategory.MUSIC) {
      audio.currentTime = 0;
      audio.play().catch(err => {
        // Handle autoplay restrictions gracefully
        if (err.name === 'NotAllowedError') {
          clientLogger.mediaWarn(`Audio autoplay blocked for ${key}. User interaction required.`, {
            key,
            error: err,
          });
        } else {
          clientLogger.audioError(key, err.message, { key, error: err });
        }
      });
      return;
    }

    // For sound effects, clone to allow overlapping playback
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = this.isMuted ? 0 : this.volumes.get(key) || 0.7;
    clone.play().catch(err => {
      // Handle autoplay restrictions gracefully
      if (err.name === 'NotAllowedError') {
        clientLogger.mediaWarn(`Audio autoplay blocked for ${key}. User interaction required.`, {
          key,
          error: err,
        });
      } else {
        clientLogger.audioError(key, err.message, { key, error: err });
      }
    });

    // Clean up cloned node after it's done playing
    clone.addEventListener('ended', () => {
      clone.remove();
    });
  }

  /**
   * Stop playing a sound
   */
  public stop(key: AudioKey): void {
    const audio = this.audioElements.get(key);
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  }

  /**
   * Stop all sounds
   */
  public stopAll(): void {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Stop all sounds in a category
   */
  public stopCategory(category: AudioCategory): void {
    Object.entries(AUDIO_CATEGORIES).forEach(([key, cat]) => {
      if (cat === category) {
        this.stop(key as AudioKey);
      }
    });
  }

  /**
   * Mute all audio
   */
  public mute(): void {
    this.isMuted = true;
    this.audioElements.forEach(audio => {
      audio.volume = 0;
    });
  }

  /**
   * Unmute all audio
   */
  public unmute(): void {
    this.isMuted = false;
    this.audioElements.forEach((audio, key) => {
      const category = AUDIO_CATEGORIES[key];
      const categoryVolume = this.categoryVolumes.get(category) || 1;
      const soundVolume = this.volumes.get(key) || 0.7;
      audio.volume = categoryVolume * soundVolume;
    });
  }

  /**
   * Toggle mute state
   */
  public toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  /**
   * Set volume for a specific sound
   */
  public setSoundVolume(key: AudioKey, volume: number): void {
    const audio = this.audioElements.get(key);
    if (!audio || this.isMuted) return;

    this.volumes.set(key, volume);

    const category = AUDIO_CATEGORIES[key];
    const categoryVolume = this.categoryVolumes.get(category) || 1;
    audio.volume = volume * categoryVolume;
  }

  /**
   * Set master volume for all sounds
   */
  public setMasterVolume(volume: number): void {
    this.audioElements.forEach((audio, key) => {
      const soundVolume = this.volumes.get(key) || 0.7;
      const category = AUDIO_CATEGORIES[key];
      const categoryVolume = this.categoryVolumes.get(category) || 1;
      audio.volume = this.isMuted ? 0 : soundVolume * categoryVolume * volume;
    });
  }

  /**
   * Set volume for an entire category of sounds
   */
  public setCategoryVolume(category: AudioCategory, volume: number): void {
    this.categoryVolumes.set(category, volume);

    // Update all audio elements in this category
    Object.entries(AUDIO_CATEGORIES).forEach(([key, cat]) => {
      if (cat === category) {
        const audio = this.audioElements.get(key as AudioKey);
        if (!audio || this.isMuted) return;

        const soundVolume = this.volumes.get(key as AudioKey) || 0.7;
        audio.volume = soundVolume * volume;
      }
    });
  }

  /**
   * Play achievement sound based on score and total
   * @param score Current score
   * @param total Total possible score
   * @param previousScore Previous score to determine increase
   */
  public playAchievementSound(score: number, total: number, previousScore: number): void {
    if (score <= previousScore) return;

    const scoreIncrease = score - previousScore;
    const percentage = (score / total) * 100;

    // Play different sounds based on achievement level
    if (percentage >= 100) {
      this.play(AudioKey.NEW_ACHIEVEMENT);
    } else if (percentage >= 80) {
      this.play(AudioKey.LEVEL_UP);
    } else if (scoreIncrease >= 5) {
      this.play(AudioKey.POINT_STREAK);
    } else if (scoreIncrease >= 2) {
      this.play(AudioKey.POINT_EARNED);
    } else if (scoreIncrease >= 1) {
      this.play(AudioKey.ACHIEVEMENT);
    } else {
      this.play(AudioKey.CLICK);
    }
  }

  // Implement AudioServiceInterface methods
  get isEnabled(): boolean {
    return !this.isMuted;
  }

  get volume(): number {
    return this.isMuted ? 0 : 0.5;
  }

  toggleAudio(): void {
    this.isMuted = !this.isMuted;
    this.audioElements.forEach((audio, key) => {
      audio.volume = this.isMuted ? 0 : this.volumes.get(key) || 0.5;
    });
  }

  setVolume(volume: number): void {
    // Set global volume for all audio
    this.audioElements.forEach((audio, key) => {
      const soundVolume = this.volumes.get(key) || 0.5;
      audio.volume = this.isMuted ? 0 : soundVolume * volume;
    });
  }

  playSound(soundName: string): void {
    this.play(soundName as AudioKey);
  }

  /**
   * Preload audio as required by AudioServiceInterface
   */
  async preloadAudio(audioKey: string, path: string): Promise<void> {
    const key = audioKey as AudioKey;
    this.preloadAudioInternal(key, path, { volume: 0.5, loop: false });
  }

  stopSound(soundName: string): void {
    this.stop(soundName as AudioKey);
  }

  stopAllSounds(): void {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
}

// Create singleton instance
export const audioService = new AudioService();
