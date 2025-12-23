import type { UserPreferences } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { AUDIO_DATA, AudioCategory, AudioKey } from '@/constants';

import { clientLogger as logger } from '@/services';

import { AudioServiceInterface } from '@/types';

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
	private masterVolume = 1;
	private userInteracted = false;
	private userPreferences: UserPreferences | null = null;

	constructor() {
		this.preloadEssentialAudio();

		this.setupUserInteractionListener();
	}

	/**
	 * Setup listener for first user interaction to enable audio
	 */
	private setupUserInteractionListener(): void {
		const enableAudio = () => {
			this.userInteracted = true;

			// Start background music if not muted and music is enabled
			// If userPreferences is null, default to musicEnabled: true
			const musicEnabled = this.userPreferences?.musicEnabled ?? true;
			if (!this.isMuted && musicEnabled) {
				this.play(AudioKey.BACKGROUND_MUSIC);
			}

			document.removeEventListener('click', enableAudio);
			document.removeEventListener('keydown', enableAudio);
			document.removeEventListener('touchstart', enableAudio);
		};

		document.addEventListener('click', enableAudio, { once: true });
		document.addEventListener('keydown', enableAudio, { once: true });
		document.addEventListener('touchstart', enableAudio, { once: true });
	}

	/**
	 * Preload only essential audio files for immediate use
	 */
	private preloadEssentialAudio(): void {
		const essentialKeys: AudioKey[] = [
			AudioKey.CLICK,
			AudioKey.POP,
			AudioKey.ERROR,
			AudioKey.WARNING,
			AudioKey.SUCCESS,
			AudioKey.NOTIFICATION,
			AudioKey.BACKGROUND_MUSIC,
			AudioKey.GAME_MUSIC,
		];

		essentialKeys.forEach(key => {
			const audioData = AUDIO_DATA[key];
			if (audioData) {
				this.preloadAudioInternal(key, audioData.path, {
					loop: audioData.loop,
				});
			}
		});
	}

	/**
	 * Calculate the final volume for an audio key
	 */
	private calculateVolume(key: AudioKey): number {
		const audioData = AUDIO_DATA[key];
		return audioData.volume * this.masterVolume;
	}

	/**
	 * Preload a single audio file
	 */
	private preloadAudioInternal(key: AudioKey, src: string, config: { loop?: boolean }): void {
		const audio = new Audio();
		const finalVolume = this.calculateVolume(key);
		audio.volume = this.isMuted ? 0 : finalVolume;
		audio.loop = config.loop ?? false;

		// Use 'auto' instead of 'metadata' to avoid cache issues
		audio.preload = 'auto';

		audio.addEventListener('error', err => {
			const errorMessage = getErrorMessage(err);
			if (err.target instanceof HTMLAudioElement) {
				const error = err.target;
				const errorCode = error?.error?.code;

				// Handle cache-related errors gracefully
				// Error code 20 = MEDIA_ERR_SRC_NOT_SUPPORTED
				// Error code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED (alternative)
				if (
					errorCode === 20 ||
					errorCode === 4 ||
					errorMessage.includes('CACHE_OPERATION_NOT_SUPPORTED') ||
					errorMessage.includes('ERR_CACHE_READ_FAILURE') ||
					errorMessage.includes('NotSupportedError')
				) {
					logger.mediaWarn(`Audio cache/format error for ${key}, will retry on demand: ${src}`, {
						key,
						src,
						error: errorMessage,
						audioErrorCode: errorCode,
					});
					// Don't fail completely - allow on-demand loading
					// Clear the src and let it reload on demand
					audio.src = '';
					return;
				}

				logger.mediaError(`Failed to load audio file: ${key} (${src})`, {
					error: errorMessage,
					key,
					src,
					audioErrorCode: errorCode,
				});
			} else {
				logger.mediaError(`Failed to load audio file: ${key} (${src})`, {
					error: errorMessage,
					key,
					src,
				});
			}
		});

		this.audioElements.set(key, audio);
		// Store the base volume (from AUDIO_DATA, without masterVolume) for later use
		const audioData = AUDIO_DATA[key];
		this.volumes.set(key, audioData.volume);

		// Set src and load after everything is set up
		audio.src = src;

		// Try to load, but don't fail if cache operation is not supported
		try {
			audio.load();
		} catch (err) {
			const errorMessage = getErrorMessage(err);
			if (
				errorMessage.includes('CACHE_OPERATION_NOT_SUPPORTED') ||
				errorMessage.includes('ERR_CACHE_READ_FAILURE') ||
				errorMessage.includes('NotSupportedError')
			) {
				logger.mediaWarn(`Audio preload skipped for ${key} due to cache limitation, will load on demand`, {
					key,
					src,
				});
				// Clear src to allow retry on demand
				audio.src = '';
			} else {
				logger.mediaError(`Failed to preload audio: ${key}`, {
					error: errorMessage,
					key,
					src,
				});
			}
		}
	}

	/**
	 * Load audio file on demand if not already loaded
	 */
	private ensureAudioLoaded(key: AudioKey): HTMLAudioElement | null {
		let audio = this.audioElements.get(key);

		if (!audio) {
			const audioData = AUDIO_DATA[key];
			if (audioData) {
				this.preloadAudioInternal(key, audioData.path, {
					loop: audioData.loop,
				});
				audio = this.audioElements.get(key);
			}
		}

		// If audio exists but has no src (due to cache error), reload it
		if (audio && !audio.src) {
			const audioData = AUDIO_DATA[key];
			if (audioData) {
				audio.src = audioData.path;
				try {
					audio.load();
				} catch (err) {
					logger.mediaWarn(`Failed to reload audio on demand: ${key}`, {
						key,
						error: getErrorMessage(err),
					});
				}
			}
		}

		return audio || null;
	}

	/**
	 * Set user preferences for audio control
	 */
	public setUserPreferences(preferences: UserPreferences | null): void {
		this.userPreferences = preferences;
	}

	/**
	 * Mark that user has interacted (for manual music start)
	 */
	public markUserInteracted(): void {
		if (!this.userInteracted) {
			this.userInteracted = true;
		}
	}

	/**
	 * Play a sound
	 */
	public play(key: AudioKey): void {
		const audio = this.ensureAudioLoaded(key);
		if (!audio) {
			logger.mediaWarn(`Audio not found: ${key}`, {
				key,
				availableKeys: Array.from(this.audioElements.keys()),
			});
			return;
		}

		// Check if audio is in error state and try to reload
		if (audio.error && audio.error.code !== 0) {
			// Try to reload the audio element
			const audioData = AUDIO_DATA[key];
			if (audioData) {
				// Clear src first
				audio.src = '';
				audio.load();
				audio.src = audioData.path;

				try {
					audio.load();
				} catch (err) {
					logger.mediaWarn(`Failed to reload audio: ${key}`, {
						key,
						error: getErrorMessage(err),
					});
					return;
				}
			}
		}

		// Check user preferences for music
		// If userPreferences is null, default to musicEnabled: true
		if (AUDIO_DATA[key].category === AudioCategory.MUSIC) {
			const musicEnabled = this.userPreferences?.musicEnabled ?? true;
			if (!musicEnabled) {
				return;
			}
		}

		// Check user preferences for sound effects (everything except music)
		// If userPreferences is null, default to soundEnabled: true
		if (AUDIO_DATA[key].category !== AudioCategory.MUSIC) {
			const soundEnabled = this.userPreferences?.soundEnabled ?? true;
			if (!soundEnabled) {
				return;
			}
		}

		// Don't try to play background music until user has interacted
		if (key === AudioKey.BACKGROUND_MUSIC && !this.userInteracted) {
			return;
		}

		// If it's music, restart from the beginning
		if (AUDIO_DATA[key].category === AudioCategory.MUSIC) {
			// If music is already playing, don't restart it
			if (!audio.paused && audio.currentTime > 0) {
				return;
			}

			audio.currentTime = 0;
			// Ensure music volume is set correctly
			const finalVolume = this.calculateVolume(key);
			audio.volume = this.isMuted ? 0 : finalVolume;

			// Ensure loop is set correctly for music
			const audioData = AUDIO_DATA[key];
			audio.loop = audioData.loop;

			// Add event listeners for playback tracking (only once per audio element)
			if (!audio.hasAttribute('data-listeners-added')) {
				audio.setAttribute('data-listeners-added', 'true');
			}

			audio.play().catch(err => {
				// Handle autoplay restrictions gracefully
				if (err.name === 'NotAllowedError') {
					logger.mediaWarn(`Audio autoplay blocked for ${key}. User interaction required.`, {
						key,
						error: err,
					});
				} else if (err.name === 'AbortError') {
					// Play was interrupted (e.g., by pause/stop) - this is expected and can be ignored
				} else {
					logger.audioError(key, err.message, { key, error: err });
				}
			});
			return;
		}

		// For sound effects, clone to allow overlapping playback
		const clonedNode = audio.cloneNode();
		if (!(clonedNode instanceof HTMLAudioElement)) {
			logger.mediaError(`Failed to clone audio element for ${key}`, { key });
			return;
		}
		const clone = clonedNode;
		const finalVolume = this.calculateVolume(key);
		clone.volume = this.isMuted ? 0 : finalVolume;

		clone.play().catch(err => {
			// Handle autoplay restrictions gracefully
			if (err.name === 'NotAllowedError') {
				logger.mediaWarn(`Audio autoplay blocked for ${key}. User interaction required.`, {
					key,
					error: err,
				});
			} else if (err.name === 'AbortError') {
				// Play was interrupted (e.g., by pause/stop) - this is expected and can be ignored
			} else {
				logger.audioError(key, err.message, { key, error: err });
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
		if (!audio) {
			return;
		}

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
			const finalVolume = this.calculateVolume(key);
			audio.volume = finalVolume;
		});

		// Start background music if user already interacted and music is enabled
		// If userPreferences is null, default to musicEnabled: true
		const musicEnabled = this.userPreferences?.musicEnabled ?? true;
		if (this.userInteracted && musicEnabled) {
			this.play(AudioKey.BACKGROUND_MUSIC);
		}
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
	 * Set master volume for all sounds
	 */
	public setMasterVolume(volume: number): void {
		this.masterVolume = volume;
		this.audioElements.forEach((audio, key) => {
			const finalVolume = this.calculateVolume(key);
			audio.volume = this.isMuted ? 0 : finalVolume;
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
			this.play(AudioKey.SCORE_STREAK);
		} else if (scoreIncrease >= 2) {
			this.play(AudioKey.SCORE_EARNED);
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
		return this.isMuted ? 0 : this.masterVolume;
	}

	setVolume(volume: number): void {
		// Alias for setMasterVolume to maintain interface compatibility
		this.setMasterVolume(volume);
	}
}

// Create singleton instance
export const audioService = new AudioService();
