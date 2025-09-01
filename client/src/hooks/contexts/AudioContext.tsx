import { clamp } from 'everytriv-shared/utils';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';

import { AudioCategory, AudioKey } from '../../constants/audio.constants';
import { audioService } from '../../services';
import { AudioAnalytics, AudioState, PerformanceWithMemory, WindowWithWebkitAudio } from '../../types';
import { AudioPerformanceUpdate } from '../../types/audio.types';
import { useLocalStorage } from '../layers/utils/useLocalStorage';
import { useThrottle } from '../layers/utils/useThrottle';
import { useOperationTimer } from './PerformanceContext';

// Audio actions
type AudioAction =
	| { type: 'SET_MUTED'; payload: boolean }
	| { type: 'SET_MASTER_VOLUME'; payload: number }
	| { type: 'SET_CATEGORY_VOLUME'; payload: { category: AudioCategory; volume: number } }
	| { type: 'ADD_SOUND'; payload: AudioKey }
	| { type: 'REMOVE_SOUND'; payload: AudioKey }
	| { type: 'SET_AUDIO_CONTEXT'; payload: AudioContext | null }
	| { type: 'UPDATE_PERFORMANCE'; payload: AudioPerformanceUpdate }
	| { type: 'RESET_STATE' };

// Initial state
const initialState: AudioState = {
	isEnabled: true,
	isMuted: false,
	volume: 0.7,
	masterVolume: 0.7,
	currentTrack: null,
	categoryVolumes: {
		[AudioCategory.MUSIC]: 0.6,
		[AudioCategory.UI]: 0.7,
		[AudioCategory.GAMEPLAY]: 0.8,
		[AudioCategory.ACHIEVEMENT]: 0.9,
	},
	currentSounds: new Set(),
	audioContext: null,
	userInteracted: false,
	isAudioContextSupported: false,
	performance: {
		loadedSounds: 0,
		memoryUsage: 0,
		activeChannels: 0,
	},
};

// Audio reducer
function audioReducer(state: AudioState, action: AudioAction): AudioState {
	switch (action.type) {
		case 'SET_MUTED':
			return {
				...state,
				isMuted: action.payload,
			};

		case 'SET_MASTER_VOLUME':
			return {
				...state,
				masterVolume: clamp(action.payload, 0, 1),
			};

		case 'SET_CATEGORY_VOLUME':
			return {
				...state,
				categoryVolumes: {
					...state.categoryVolumes,
					[action.payload.category]: clamp(action.payload.volume, 0, 1),
				},
			};

		case 'ADD_SOUND':
			return {
				...state,
				currentSounds: new Set([...state.currentSounds, action.payload]),
			};

		case 'REMOVE_SOUND': {
			const newSounds = new Set(state.currentSounds);
			newSounds.delete(action.payload);
			return {
				...state,
				currentSounds: newSounds,
			};
		}

		case 'SET_AUDIO_CONTEXT':
			return {
				...state,
				audioContext: action.payload,
				isAudioContextSupported: !!action.payload,
			};

		case 'UPDATE_PERFORMANCE':
			return {
				...state,
				performance: {
					...state.performance,
					...action.payload,
				},
			};

		case 'RESET_STATE':
			return {
				...initialState,
				audioContext: state.audioContext,
				isAudioContextSupported: state.isAudioContextSupported,
			};

		default:
			return state;
	}
}

// Create context
const AudioContext = createContext<{
	state: AudioState;
	mute: () => void;
	unmute: () => void;
	toggleMute: () => boolean;
	setMasterVolume: (volume: number) => void;
	setCategoryVolume: (category: AudioCategory, volume: number) => void;
	playSound: (key: AudioKey, category?: AudioCategory) => Promise<void>;
	stopSound: (key: AudioKey) => void;
	stopAllSounds: () => void;
	getAnalytics: () => AudioAnalytics;
	resetState: () => void;
} | undefined>(undefined);

// Audio provider component
export function AudioProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(audioReducer, initialState);

	// Performance monitoring
	const { start, complete, error: errorOperation } = useOperationTimer('audio-operation');

	// Persistent storage
	const [audioPreferences, setAudioPreferences] = useLocalStorage('audio-preferences', {
		muted: false,
		masterVolume: 0.7,
		categoryVolumes: initialState.categoryVolumes,
	});

	// Analytics tracking
	const analyticsRef = useRef<AudioAnalytics>({
		totalPlays: 0,
		playTime: 0,
		mostPlayed: [],
		volumeHistory: [],
		interactionEvents: [],
		averageVolume: 0.7,
		muteTime: 0,
		performanceScore: 100,
	});

	// Audio context initialization
	useEffect(() => {
		const initAudioContext = async () => {
			try {
				if (typeof window !== 'undefined' && 'AudioContext' in window) {
					const audioContext = new (window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext)();

					// Resume audio context on user interaction
					const resumeContext = () => {
						if (audioContext.state === 'suspended') {
							audioContext.resume();
						}
						document.removeEventListener('click', resumeContext);
						document.removeEventListener('keydown', resumeContext);
					};

					document.addEventListener('click', resumeContext);
					document.addEventListener('keydown', resumeContext);

					dispatch({ type: 'SET_AUDIO_CONTEXT', payload: audioContext });
				}
			} catch (error) {
				import('../../services/utils').then(({ logger }) => {
					logger.systemError('AudioContext not supported', { 
						error: error instanceof Error ? error.message : String(error) 
					});
				});
			}
		};

		initAudioContext();

		// Cleanup function to close audio context when component unmounts
		return () => {
			if (state.audioContext && state.audioContext.state !== 'closed') {
				// Close the audio context to prevent memory leaks
				state.audioContext.close().catch((error) => {
									import('../../services/utils').then(({ logger }) => {
					logger.systemError('Error closing AudioContext', { 
					error: error instanceof Error ? error.message : String(error) 
				});
				});
				});
			}
		};
	}, []);

	// Load preferences on mount
	useEffect(() => {
		dispatch({ type: 'SET_MUTED', payload: audioPreferences.muted });
		dispatch({ type: 'SET_MASTER_VOLUME', payload: audioPreferences.masterVolume });

		Object.entries(audioPreferences.categoryVolumes).forEach(([category, volume]) => {
			dispatch({
				type: 'SET_CATEGORY_VOLUME',
				payload: { category: category as AudioCategory, volume: volume as number },
			});
		});
	}, [audioPreferences]);

	// Throttled volume updates
	const throttledSetVolume = useThrottle((volume: number) => {
		audioService.setMasterVolume(volume);
		setAudioPreferences((prev) => ({ ...prev, masterVolume: volume }));
	}, 100);

	// const throttledSetCategoryVolume = useThrottle((category: AudioCategory, volume: number) => {
	// 	audioService.setCategoryVolume(category, volume);
	// 	setAudioPreferences(prev => ({
	// 		...prev,
	// 		categoryVolumes: { ...prev.categoryVolumes, [category]: volume },
	// 	}));
	// }, 100);

	// Play sound with performance monitoring
	const playSound = useCallback(
		async (key: AudioKey) => {
			start();
			try {
				await audioService.play(key);
				dispatch({ type: 'ADD_SOUND', payload: key });
				analyticsRef.current.totalPlays++;
				complete();
			} catch (error) {
				errorOperation(`Failed to play sound ${key}: ${error}`);
				throw error;
			}
		},
		[start, complete, errorOperation]
	);

	// Stop sound
	const stopSound = useCallback((key: AudioKey) => {
		audioService.stop(key);
		dispatch({ type: 'REMOVE_SOUND', payload: key });
	}, []);

	// Stop all sounds
	const stopAllSounds = useCallback(() => {
		audioService.stopAll();
		dispatch({ type: 'RESET_STATE' });
	}, []);

	// Toggle mute
	const toggleMute = useCallback(() => {
		const newMutedStateResult = audioService.toggleMute();

		dispatch({ type: 'SET_MUTED', payload: newMutedStateResult });
		setAudioPreferences((prev) => ({ ...prev, muted: newMutedStateResult }));

		return newMutedStateResult;
	}, [state.isMuted]);

	// Set volume
	const setMasterVolume = useCallback(
		(volume: number) => {
			dispatch({ type: 'SET_MASTER_VOLUME', payload: volume });
			throttledSetVolume(volume);
		},
		[throttledSetVolume]
	);

	// Set category volume
	const setCategoryVolume = useCallback(
		(category: AudioCategory, volume: number) => {
			dispatch({ type: 'SET_CATEGORY_VOLUME', payload: { category, volume } });
			setAudioPreferences(prev => ({
				...prev,
				categoryVolumes: { ...prev.categoryVolumes, [category]: volume },
			}));
		},
		[]
	);

	// Preload sounds
	// const preloadSounds = useCallback(
	// 	async (sounds: AudioKey[]) => {
	// 		start();
	// 		try {
	// 			// Audio service doesn't have preloadSounds method
	// 			import('../../services/utils').then(({ logger }) => {
	// 				logger.debug('Preloading sounds', { sounds });
	// 			});
	// 			dispatch({
	// 				type: 'UPDATE_PERFORMANCE',
	// 				payload: { loadedSounds: state.performance.loadedSounds + sounds.length },
	// 			});
	// 			complete();
	// 		} catch (error) {
	// 			errorOperation(`Failed to preload sounds: ${error}`);
	// 			throw error;
	// 		}
	// 	},
	// 	[start, complete, errorOperation, state.performance.loadedSounds]
	// );

	// Unload sounds
	// const unloadSounds = useCallback(
	// 	(sounds: AudioKey[]) => {
	// 		// Audio service doesn't have unloadSounds method
	// 		import('../../services/utils').then(({ logger }) => {
	// 			logger.debug('Unloading sounds', { sounds });
	// 		});
	// 		dispatch({
	// 			type: 'UPDATE_PERFORMANCE',
	// 			payload: { loadedSounds: Math.max(0, state.performance.loadedSounds - sounds.length) },
	// 		});
	// 	},
	// 	[state.performance.loadedSounds]
	// );

	// Get audio analytics
	// const getAudioAnalytics = useCallback((): AudioAnalytics => {
	// 	return {
	// 		...analyticsRef.current,
	// 		averageVolume: state.masterVolume,
	// 		performanceScore: Math.max(0, 100 - state.performance.memoryUsage / 1024 / 1024), // MB to score
	// 	};
	// }, [state.masterVolume, state.performance.memoryUsage]);

	// Performance monitoring effect
	useEffect(() => {
		const updatePerformance = () => {
			const memoryUsage = (performance as PerformanceWithMemory).memory?.usedJSHeapSize || 0;
			const activeChannels = state.currentSounds.size;

			dispatch({
				type: 'UPDATE_PERFORMANCE',
				payload: { memoryUsage, activeChannels },
			});
		};

		const interval = setInterval(updatePerformance, 2000);
		return () => clearInterval(interval);
	}, []); // Remove dependency to prevent infinite loop

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopAllSounds();
			// AudioContext cleanup is handled in the initialization effect
		};
	}, [stopAllSounds]);

	const contextValue = useMemo(
		() => ({
			state,
			mute: () => dispatch({ type: 'SET_MUTED', payload: true }),
			unmute: () => dispatch({ type: 'SET_MUTED', payload: false }),
			toggleMute,
			setMasterVolume,
			setCategoryVolume,
			playSound,
			stopSound,
			stopAllSounds,
			getAnalytics: () => analyticsRef.current,
			resetState: () => dispatch({ type: 'RESET_STATE' }),
		}),
		[state, toggleMute, setMasterVolume, setCategoryVolume, playSound, stopSound, stopAllSounds]
	);

	return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
}

// Hook to use audio context
export function useAudio() {
	const context = useContext(AudioContext);
	if (context === undefined) {
		throw new Error('useAudio must be used within an AudioProvider');
	}
	return {
		...context,
		state: {
			isEnabled: context.state.isEnabled,
			volume: context.state.masterVolume,
			isMuted: context.state.isMuted,
		},
		toggleMute: context.toggleMute,
		isMuted: context.state.isMuted,
		setMasterVolume: context.setMasterVolume,
		setCategoryVolume: context.setCategoryVolume,
	};
}
