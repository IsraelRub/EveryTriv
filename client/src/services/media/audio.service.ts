import {
	AUDIO_CATEGORIES,
	AUDIO_CONFIG,
	AUDIO_PATHS,
	AudioCategory,
	AudioKey,
	DEFAULT_CATEGORY_VOLUMES,
} from '../../constants';
import { AudioServiceInterface } from '../../types';
import { loggerService } from '../utils';

/**
 * Enhanced Audio Service for EveryTriv
 * Manages all audio playback, volume control, and muting
 *
 * @module ClientAudioService
 * @description Client-side audio management and playback service
 * @used_by client/components/audio, client/components/game, client/hooks
 */
export class AudioService implements AudioServiceInterface {
	private audioElements: Map<AudioKey, HTMLAudioElement> = new Map();
	private isMuted = false;
	private volumes: Map<AudioKey, number> = new Map();
	private categoryVolumes: Map<AudioCategory, number>;
	private userInteracted = false;

	constructor() {
		// Initialize category volumes
		this.categoryVolumes = new Map(Object.entries(DEFAULT_CATEGORY_VOLUMES) as [AudioCategory, number][]);

		// Preload all audio files
		this.preloadAllAudio();

		// Listen for first user interaction to enable audio
		this.setupUserInteractionListener();
	}

	/**
	 * Setup listener for first user interaction to enable audio
	 */
	private setupUserInteractionListener(): void {
		const enableAudio = () => {
			this.userInteracted = true;
			// Try to start background music if not muted
			if (!this.isMuted) {
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

			// Use original path without cache busting for better compatibility
			const finalPath = path;

			// Check if file exists before preloading
			this.checkAndPreloadAudio(audioKey, finalPath, {
				volume: config.volume || defaultVolume,
				loop: config.loop || false,
			});
		});
	}

	/**
	 * Check if audio file exists and preload if it does
	 */
	private async checkAndPreloadAudio(
		key: AudioKey,
		src: string,
		config: { volume?: number; loop?: boolean }
	): Promise<void> {
		try {
			// Check if file exists using fetch
			const response = await fetch(src, { method: 'HEAD' });
			if (response.ok) {
				this.preloadAudioInternal(key, src, config);
			} else {
				// Only log if it's not a fallback sound (to reduce noise)
				if (!src.includes('fallback')) {
					loggerService.audioFallback(key, {
						key,
						src,
						status: response.status,
					});
				}
			}
		} catch (error) {
			// Only log if it's not a fallback sound (to reduce noise)
			if (!src.includes('fallback')) {
				loggerService.mediaDebug(`Failed to check audio file: ${key} (${src})`, { key, src, error });
			}
		}
	}

	/**
	 * Preload a single audio file
	 */
	private preloadAudioInternal(key: AudioKey, src: string, config: { volume?: number; loop?: boolean }): void {
		// Create audio element
		const audio = new Audio();
		audio.volume = this.isMuted ? 0 : config.volume || 0.7;
		audio.loop = config.loop || false;

		// Set preload strategy to avoid cache issues
		audio.preload = 'metadata';

		// Add error handling for loading
		audio.addEventListener('error', e => {
			loggerService.mediaError(`Failed to load audio file: ${key} (${src})`, { error: e, key, src });
			// Don't retry automatically to avoid infinite loops
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
			loggerService.mediaWarn(`Audio not found: ${key}`, { key, availableKeys: Array.from(this.audioElements.keys()) });
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
					loggerService.mediaWarn(`Audio autoplay blocked for ${key}. User interaction required.`, { key, error: err });
				} else {
					loggerService.audioError(key, err.message, { key, error: err });
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
				loggerService.mediaWarn(`Audio autoplay blocked for ${key}. User interaction required.`, { key, error: err });
			} else {
				loggerService.audioError(key, err.message, { key, error: err });
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
	 * Reload a specific audio file (useful for cache issues)
	 */
	public reloadAudio(key: AudioKey): void {
		const src = AUDIO_PATHS[key];
		if (!src) {
			loggerService.mediaWarn(`No audio path found for key: ${key}`);
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
		this.preloadAudioInternal(key, cacheBustingSrc, {
			volume: config.volume || defaultVolume,
			loop: config.loop || false,
		});
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
		audio.volume = this.isMuted ? 0 : config.volume || defaultVolume;
		audio.loop = config.loop || false;

		// Try different preload strategies
		audio.preload = 'none'; // Don't preload, load on demand
		audio.crossOrigin = 'anonymous'; // Try with CORS

		// Store first, then set src
		this.audioElements.set(key, audio);
		this.volumes.set(key, config.volume || defaultVolume);

		// Load the audio file
		audio.addEventListener('error', e => {
			loggerService.mediaWarn(`Alternative loading also failed for ${key}:`, { error: e });
		});

		// audio.addEventListener('loadstart', () => {
		//   loggerService.debug(`Started alternative loading for ${key}`);
		// });

		// audio.addEventListener('canplay', () => {
		//   loggerService.debug(`Alternative loading successful for ${key}`);
		// });

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
				if (!audio || this.isMuted) return;

				const soundVolume = this.volumes.get(key as AudioKey) || 0.7;
				audio.volume = soundVolume * volume;
			}
		});
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
