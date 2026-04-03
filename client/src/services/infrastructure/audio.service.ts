import type { UserPreferences } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { AUDIO_DATA, AudioCategory, AudioKey } from '@/constants';
import type { AudioPreloadConfig } from '@/types';
import { clientLogger as logger } from '@/services';

class AudioService {
	private audioElements: Map<AudioKey, HTMLAudioElement> = new Map();
	private isMuted = false;
	private masterVolume = 1;
	private soundEffectsVolume = 1;
	private musicVolume = 1;
	private userInteracted = false;
	private userPreferences: UserPreferences | null = null;
	private failedPreloads: Set<AudioKey> = new Set();

	constructor() {
		this.preloadEssentialAudio();

		this.setupUserInteractionListener();
	}

	private setupUserInteractionListener(): void {
		const enableAudio = () => {
			this.userInteracted = true;

			// Start background music if not muted and music is enabled
			// If userPreferences is null, default to musicEnabled: true
			// Only play background music if game music is not currently playing
			const musicEnabled = this.userPreferences?.musicEnabled ?? true;
			const isGameMusicPlaying = this.isPlaying(AudioKey.GAME_MUSIC);
			if (!this.isMuted && musicEnabled && !isGameMusicPlaying) {
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

	private preloadEssentialAudio(): void {
		const essentialKeys: AudioKey[] = [
			AudioKey.ERROR,
			AudioKey.WARNING,
			AudioKey.SUCCESS,
			AudioKey.NOTIFICATION,
			AudioKey.BACKGROUND_MUSIC,
			AudioKey.GAME_MUSIC,
			AudioKey.STAR_APPEAR,
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

	private calculateVolume(key: AudioKey): number {
		const audioData = AUDIO_DATA[key];
		const categoryMultiplier = audioData.category === AudioCategory.MUSIC ? this.musicVolume : this.soundEffectsVolume;
		return audioData.volume * this.masterVolume * categoryMultiplier;
	}

	private preloadAudioInternal(key: AudioKey, src: string, config: AudioPreloadConfig): void {
		// Skip preload if this key already failed due to cache issues
		if (this.failedPreloads.has(key)) {
			return;
		}

		const audio = new Audio();
		const finalVolume = this.calculateVolume(key);
		audio.volume = this.isMuted ? 0 : finalVolume;
		audio.loop = config.loop;

		// Use 'none' to avoid cache issues - load on demand instead
		audio.preload = 'none';

		let errorHandled = false;
		audio.addEventListener('error', err => {
			if (errorHandled) {
				return;
			}
			errorHandled = true;

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
					// Mark as failed preload to prevent retry loops
					this.failedPreloads.add(key);
					// Clear the src to prevent further attempts
					audio.src = '';
					// Remove from map to allow fresh load on demand
					this.audioElements.delete(key);
					return;
				}

				logger.mediaError(`Failed to load audio file: ${key} (${src})`, {
					errorInfo: { message: errorMessage },
					key,
					src,
					audioErrorCode: errorCode,
				});
			} else {
				logger.mediaError(`Failed to load audio file: ${key} (${src})`, {
					errorInfo: { message: errorMessage },
					key,
					src,
				});
			}
		});

		this.audioElements.set(key, audio);

		// Set src but don't call load() - let it load on demand
		audio.src = src;
	}

	private ensureAudioLoaded(key: AudioKey): HTMLAudioElement | null {
		let audio = this.audioElements.get(key);

		if (!audio) {
			const audioData = AUDIO_DATA[key];
			if (audioData) {
				this.failedPreloads.delete(key);
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
				// Create a fresh audio element to avoid cache issues
				const freshAudio = new Audio();
				freshAudio.preload = 'none';
				freshAudio.volume = this.isMuted ? 0 : this.calculateVolume(key);
				freshAudio.loop = audioData.loop;
				freshAudio.src = audioData.path;

				// Replace the old audio element
				this.audioElements.set(key, freshAudio);
				audio = freshAudio;
			}
		}

		return audio ?? null;
	}

	public setUserPreferences(preferences: UserPreferences | null): void {
		this.userPreferences = preferences;
	}

	public markUserInteracted(): void {
		if (!this.userInteracted) {
			this.userInteracted = true;
		}
	}

	public play(key: AudioKey): void {
		let audio = this.ensureAudioLoaded(key);
		if (!audio) {
			logger.mediaWarn(`Audio not found: ${key}`, {
				key,
				availableKeys: Array.from(this.audioElements.keys()),
			});
			return;
		}

		// Check if audio is in error state and try to reload
		if (audio.error && audio.error.code !== 0) {
			// Check if it's a cache-related error
			const errorCode = audio.error.code;
			const isCacheError =
				errorCode === 20 ||
				errorCode === 4 ||
				audio.error.message?.includes('CACHE_OPERATION_NOT_SUPPORTED') ||
				audio.error.message?.includes('ERR_CACHE_READ_FAILURE') ||
				audio.error.message?.includes('NotSupportedError');

			if (isCacheError) {
				// For cache errors, create a fresh audio element
				const audioData = AUDIO_DATA[key];
				if (audioData) {
					const freshAudio = new Audio();
					freshAudio.preload = 'none';
					freshAudio.volume = this.isMuted ? 0 : this.calculateVolume(key);
					freshAudio.loop = audioData.loop;
					freshAudio.src = audioData.path;

					// Replace the old audio element
					this.audioElements.set(key, freshAudio);
					audio = freshAudio;
				} else {
					return;
				}
			} else {
				// For other errors, try to reload
				const audioData = AUDIO_DATA[key];
				if (audioData) {
					audio.src = '';
					audio.src = audioData.path;
				} else {
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

			this.handleAudioPlay(audio, key);
			return;
		}

		// For sound effects, clone to allow overlapping playback
		const clonedNode = audio.cloneNode();
		if (!(clonedNode instanceof HTMLAudioElement)) {
			logger.mediaError(`Failed to clone audio element for ${key}`, { key });
			return;
		}
		const finalVolume = this.calculateVolume(key);
		clonedNode.volume = this.isMuted ? 0 : finalVolume;

		this.handleAudioPlay(clonedNode, key);

		// Clean up cloned node after it's done playing
		clonedNode.addEventListener('ended', () => {
			clonedNode.remove();
		});
	}

	private handleAudioPlay(audio: HTMLAudioElement, key: AudioKey): void {
		const playAudio = async () => {
			try {
				await audio.play();
			} catch (err) {
				// Handle autoplay restrictions gracefully
				if (err instanceof Error && err.name === 'NotAllowedError') {
					logger.mediaWarn(`Audio autoplay blocked for ${key}. User interaction required.`, {
						key,
						errorInfo: { message: getErrorMessage(err) },
					});
				} else if (err instanceof Error && err.name === 'AbortError') {
					// Play was interrupted (e.g., by pause/stop) - this is expected and can be ignored
				} else if (
					err instanceof Error &&
					(err.name === 'NotSupportedError' || err.message?.includes('NotSupportedError'))
				) {
					// NotSupportedError usually means the audio format is not supported or file is missing
					// This is handled silently as it's often a browser/cache issue
					logger.mediaWarn(`Audio format not supported for ${key}. Skipping playback.`, {
						key,
						errorInfo: { message: getErrorMessage(err) },
					});
				} else {
					const errorMessage = err instanceof Error ? err.message : getErrorMessage(err);
					logger.audioError(key, errorMessage, { key, errorInfo: { message: getErrorMessage(err) } });
				}
			}
		};
		playAudio();
	}

	public stop(key: AudioKey): void {
		const audio = this.audioElements.get(key);
		if (!audio) {
			return;
		}

		audio.pause();
		audio.currentTime = 0;
	}

	public isPlaying(key: AudioKey): boolean {
		const audio = this.audioElements.get(key);
		if (!audio) {
			return false;
		}
		return !audio.paused && audio.currentTime > 0;
	}

	public mute(): void {
		this.isMuted = true;
		this.audioElements.forEach(audio => {
			audio.volume = 0;
		});
	}

	public unmute(): void {
		this.isMuted = false;
		this.audioElements.forEach((audio, key) => {
			const finalVolume = this.calculateVolume(key);
			audio.volume = finalVolume;
		});
	}

	public setMasterVolume(volume: number): void {
		this.masterVolume = volume;
		this.applyVolumesToAll();
	}

	public setSoundEffectsVolume(volume: number): void {
		this.soundEffectsVolume = volume;
		this.applyVolumesToAll();
	}

	public setMusicVolume(volume: number): void {
		this.musicVolume = volume;
		this.applyVolumesToAll();
	}

	private applyVolumesToAll(): void {
		this.audioElements.forEach((audio, key) => {
			const finalVolume = this.calculateVolume(key);
			audio.volume = this.isMuted ? 0 : finalVolume;
		});
	}
}

export const audioService = new AudioService();
