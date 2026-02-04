import { useEffect } from 'react';

import { mergeUserPreferences } from '@shared/utils';

import { audioService } from '@/services';
import type { UseAudioSyncProps } from '@/types';

export function useAudioSync({
	volume,
	isMuted,
	soundEnabled,
	musicEnabled,
	isInitialized,
	isInitializedRef,
	preferences,
	isAuthenticated,
}: UseAudioSyncProps) {
	// Initialization: Sync with audioService after Redux Persist rehydrates
	useEffect(() => {
		if (!isInitialized && !isInitializedRef.current) {
			// Redux Persist will load from localStorage automatically
			// We just need to sync with audioService
			if (isMuted) {
				audioService.mute();
			} else {
				audioService.unmute();
			}
			audioService.setMasterVolume(volume);
			isInitializedRef.current = true;
		}
	}, [isInitialized, isMuted, volume, isInitializedRef]);

	// Sync audio service with user preferences
	// Note: We don't play background music here to avoid duplication with useAudioPreferences
	// Background music is handled by:
	// 1. setupUserInteractionListener - for first user interaction
	// 2. useAudioPreferences - when user changes preferences
	// 3. useRouteBasedMusic - automatically based on route and game state
	useEffect(() => {
		const currentPreferences = isAuthenticated && preferences ? preferences : { soundEnabled, musicEnabled };
		const mergedPreferences = mergeUserPreferences(null, currentPreferences);
		audioService.setUserPreferences(mergedPreferences);
	}, [preferences, isAuthenticated, soundEnabled, musicEnabled]);

	// Sync volume with audioService (only after initialization)
	useEffect(() => {
		if (isInitializedRef.current) {
			audioService.setMasterVolume(volume);
		}
	}, [volume, isInitializedRef]);

	// Sync mute state with audioService (only after initialization)
	useEffect(() => {
		if (isInitializedRef.current) {
			if (isMuted) {
				audioService.mute();
			} else {
				audioService.unmute();
			}
		}
	}, [isMuted, isInitializedRef]);
}
