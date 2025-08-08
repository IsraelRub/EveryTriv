import { 
  AudioKey, 
  AudioCategory, 
  AUDIO_PATHS, 
  AUDIO_CATEGORIES, 
  DEFAULT_VOLUMES, 
  AUDIO_CONFIG 
} from '../audio/constants';
import { AudioConfig, AudioServiceInterface } from '../audio/types';

/**
 * Enhanced Audio Service for EveryTriv
 * Manages all audio playback, volume control, and muting
 */
export class AudioService implements AudioServiceInterface {
  private audioElements: Map<AudioKey, HTMLAudioElement> = new Map();
  private _isMuted = false;
  private volumes: Map<AudioKey, number> = new Map();
  private categoryVolumes: Map<AudioCategory, number>;
  private userInteracted = false;

  constructor() {
    // Initialize category volumes
    this.categoryVolumes = new Map(Object.entries(DEFAULT_VOLUMES) as [AudioCategory, number][]);
    
    // Preload all audio files
    this.preloadAllAudio();
    
    // Listen for first user interaction to enable audio
    this.setupUserInteractionListener();
  }

  get isMuted(): boolean {
    return this._isMuted;
  }

  /**
   * Setup listener for first user interaction to enable audio
   */
  private setupUserInteractionListener(): void {
    const enableAudio = () => {
      this.userInteracted = true;
      // Try to start background music if not muted
      if (!this._isMuted) {
        this.play(AudioKey.BACKGROUND_MUSIC);
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
  }

  /**
   * Preload all audio files defined in AUDIO_PATHS
   */
  private preloadAllAudio(): void {
    Object.entries(AUDIO_PATHS).forEach(([key, path]) => {
      const audioKey = key as AudioKey;
      const category = AUDIO_CATEGORIES[audioKey];
      const defaultVolume = this.categoryVolumes.get(category) || 0.7;
      const config = AUDIO_CONFIG[audioKey] || {};
      
      // Try without cache busting first for better compatibility
      let finalPath = path;
      
      // Only add cache busting if we're in dev and it's not an MP3 file
      // MP3 files seem to have issues with cache busting in some browsers
      if (import.meta.env.DEV && !path.endsWith('.mp3')) {
        finalPath = `${path}?v=${Date.now()}`;
      }
      
      this.preloadAudio(
        audioKey, 
        finalPath, 
        { 
          volume: config.volume || defaultVolume,
          loop: config.loop || false
        }
      );
    });
  }

  /**
   * Preload a single audio file
   */
  private preloadAudio(key: AudioKey, src: string, config: AudioConfig): void {
    // Create audio element
    const audio = new Audio();
    audio.volume = this._isMuted ? 0 : (config.volume || 0.7);
    audio.loop = config.loop || false;
    
    // Set preload strategy to avoid cache issues
    audio.preload = 'metadata';
    
    // Add error handling for loading
    audio.addEventListener('error', (e) => {
      console.warn(`Failed to load audio file: ${key} (${src})`, e);
      // Try to reload without cache busting if it fails
      if (src.includes('?v=')) {
        const originalSrc = src.split('?')[0];
        console.log(`Retrying ${key} without cache busting: ${originalSrc}`);
        setTimeout(() => {
          audio.src = originalSrc;
          audio.load();
        }, 1000);
      }
    });
    
    audio.addEventListener('canplaythrough', () => {
      console.debug(`Audio loaded successfully: ${key}`);
    });
    
    // Store audio element and volume first
    this.audioElements.set(key, audio);
    this.volumes.set(key, config.volume || 0.7);
    
    // Set src and load after everything is set up
    audio.src = src;
    audio.load();
  }

  /**
   * Play a sound
   */
  public play(key: AudioKey): void {
    const audio = this.audioElements.get(key);
    if (!audio) {
      console.warn(`Audio not found: ${key}`);
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
          console.warn(`Audio autoplay blocked for ${key}. User interaction required.`);
        } else {
          console.error(`Error playing audio ${key}:`, err);
        }
      });
      return;
    }
    
    // For sound effects, clone to allow overlapping playback
    const clone = audio.cloneNode() as HTMLAudioElement;
    clone.volume = this._isMuted ? 0 : (this.volumes.get(key) || 0.7);
    clone.play().catch(err => {
      // Handle autoplay restrictions gracefully
      if (err.name === 'NotAllowedError') {
        console.warn(`Audio autoplay blocked for ${key}. User interaction required.`);
      } else {
        console.error(`Error playing audio ${key}:`, err);
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
    this._isMuted = true;
    this.audioElements.forEach(audio => {
      audio.volume = 0;
    });
  }

  /**
   * Unmute all audio
   */
  public unmute(): void {
    this._isMuted = false;
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
    if (this._isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this._isMuted;
  }

  /**
   * Set volume for a specific sound
   */
  public setVolume(key: AudioKey, volume: number): void {
    const audio = this.audioElements.get(key);
    if (!audio || this._isMuted) return;

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
      audio.volume = this._isMuted ? 0 : soundVolume * categoryVolume * volume;
    });
  }

  /**
   * Reload a specific audio file (useful for cache issues)
   */
  public reloadAudio(key: AudioKey): void {
    const src = AUDIO_PATHS[key];
    if (!src) {
      console.warn(`No audio path found for key: ${key}`);
      return;
    }

    const category = AUDIO_CATEGORIES[key];
    const defaultVolume = this.categoryVolumes.get(category) || 0.7;
    const config = AUDIO_CONFIG[key] || {};
    
    // Remove old audio element
    const oldAudio = this.audioElements.get(key);
    if (oldAudio) {
      oldAudio.pause();
      oldAudio.src = '';
      this.audioElements.delete(key);
    }
    
    // Try different loading strategies based on file type
    let cacheBustingSrc = src;
    
    if (import.meta.env.DEV) {
      // For MP3 files, try without cache busting first
      if (src.endsWith('.mp3')) {
        cacheBustingSrc = src;
      } else {
        // For other files, use cache busting
        cacheBustingSrc = `${src}?v=${Date.now()}`;
      }
    }
    
    // Reload with new instance
    this.preloadAudio(
      key, 
      cacheBustingSrc, 
      { 
        volume: config.volume || defaultVolume,
        loop: config.loop || false
      }
    );
  }

  /**
   * Try alternative loading strategy for problematic audio files
   */
  public tryAlternativeLoading(key: AudioKey): void {
    const src = AUDIO_PATHS[key];
    if (!src) return;

    const category = AUDIO_CATEGORIES[key];
    const defaultVolume = this.categoryVolumes.get(category) || 0.7;
    const config = AUDIO_CONFIG[key] || {};
    
    // Remove existing audio element
    const oldAudio = this.audioElements.get(key);
    if (oldAudio) {
      oldAudio.pause();
      oldAudio.src = '';
      this.audioElements.delete(key);
    }

    // Create new audio element with different strategy
    const audio = new Audio();
    audio.volume = this._isMuted ? 0 : (config.volume || defaultVolume);
    audio.loop = config.loop || false;
    
    // Try different preload strategies
    audio.preload = 'none'; // Don't preload, load on demand
    audio.crossOrigin = 'anonymous'; // Try with CORS
    
    // Store first, then set src
    this.audioElements.set(key, audio);
    this.volumes.set(key, config.volume || defaultVolume);
    
    // Load the audio file
    audio.addEventListener('error', (e) => {
      console.warn(`Alternative loading also failed for ${key}:`, e);
    });
    
    audio.addEventListener('loadstart', () => {
      console.debug(`Started alternative loading for ${key}`);
    });
    
    audio.addEventListener('canplay', () => {
      console.debug(`Alternative loading successful for ${key}`);
    });
    
    audio.src = src;
  }

  /**
   * Reload all audio files (useful for cache issues)
   */
  public reloadAllAudio(): void {
    Object.keys(AUDIO_PATHS).forEach(key => {
      this.reloadAudio(key as AudioKey);
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
        if (!audio || this._isMuted) return;
        
        const soundVolume = this.volumes.get(key as AudioKey) || 0.7;
        audio.volume = soundVolume * volume;
      }
    });
  }
}

// Create singleton instance
export const audioService = new AudioService();
