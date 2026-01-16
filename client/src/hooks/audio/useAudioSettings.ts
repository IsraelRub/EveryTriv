import { useEffect } from 'react';

import { useIsAuthenticated, useUserProfile } from '@/hooks';
import { setMusicEnabled, setSoundEnabled } from '@/redux/slices';
import { useAppDispatch } from '../useRedux';
import { useAudioPreferences } from './useAudioPreferences';
import { useAudioState } from './useAudioState';
import { useAudioSync } from './useAudioSync';

export function useAudioSettings() {
	const dispatch = useAppDispatch();
	const isAuthenticated = useIsAuthenticated();
	const { data: userProfile } = useUserProfile();
	const preferences = userProfile?.profile?.preferences;

	// Get state and basic handlers from useAudioState
	const audioState = useAudioState();

	// Sync Redux state with profile preferences for authenticated users
	useEffect(() => {
		if (preferences && isAuthenticated) {
			if (preferences.soundEnabled !== undefined && audioState.soundEnabled !== preferences.soundEnabled) {
				dispatch(setSoundEnabled(preferences.soundEnabled));
			}
			if (preferences.musicEnabled !== undefined && audioState.musicEnabled !== preferences.musicEnabled) {
				dispatch(setMusicEnabled(preferences.musicEnabled));
			}
		}
	}, [preferences, isAuthenticated, audioState.soundEnabled, audioState.musicEnabled, dispatch]);

	// Sync with AudioService
	useAudioSync({
		volume: audioState.volume,
		isMuted: audioState.isMuted,
		soundEnabled: audioState.soundEnabled,
		musicEnabled: audioState.musicEnabled,
		isInitialized: audioState.isInitialized,
		isInitializedRef: audioState.isInitializedRef,
		preferences,
		isAuthenticated,
	});

	// Get preference handlers
	const preferenceHandlers = useAudioPreferences({
		soundEnabled: audioState.soundEnabled,
		musicEnabled: audioState.musicEnabled,
		isMuted: audioState.isMuted,
	});

	// Use handlers directly from useAudioState - useAudioSync will handle AudioService synchronization
	const handleVolumeChange = audioState.handleVolumeChange;
	const handleMuteToggle = () => {
		// Toggle Redux state first, then AudioService will sync via useAudioSync
		audioState.handleMuteToggle();
	};

	return {
		state: {
			volume: audioState.volume,
			isMuted: audioState.isMuted,
			soundEnabled: audioState.soundEnabled,
			musicEnabled: audioState.musicEnabled,
			isInitialized: audioState.isInitialized,
		},
		handlers: {
			handleVolumeChange,
			handleMuteToggle,
			handleToggleAll: preferenceHandlers.handleToggleAll,
			handleSoundEnabledChange: preferenceHandlers.handleSoundEnabledChange,
			handleMusicEnabledChange: preferenceHandlers.handleMusicEnabledChange,
		},
	};
}
