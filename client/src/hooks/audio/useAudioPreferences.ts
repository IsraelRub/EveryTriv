import { useCallback } from 'react';

import { DEFAULT_USER_PREFERENCES } from '@shared/constants';
import { mergeUserPreferences } from '@shared/utils';

import { AudioKey } from '@/constants';
import { useIsAuthenticated, useUpdateUserPreferences, useUserProfile } from '@/hooks';
import { audioService } from '@/services';
import type { UseAudioPreferencesProps } from '@/types';
import { setMusicEnabled, setSoundEnabled } from '@/redux/slices';
import { useAppDispatch } from '../useRedux';

export function useAudioPreferences({ soundEnabled, musicEnabled, isMuted }: UseAudioPreferencesProps) {
	const dispatch = useAppDispatch();
	const isAuthenticated = useIsAuthenticated();
	const { data: userProfile } = useUserProfile();
	const updatePreferences = useUpdateUserPreferences();

	const preferences = userProfile?.profile?.preferences;

	const createRollbackFn = useCallback(
		(soundValue?: boolean, musicValue?: boolean) => {
			return () => {
				if (soundValue !== undefined) {
					dispatch(setSoundEnabled(soundValue));
				}
				if (musicValue !== undefined) {
					dispatch(setMusicEnabled(musicValue));
				}
				if (preferences) {
					const revertedPreferences = mergeUserPreferences(null, preferences);
					audioService.setUserPreferences(revertedPreferences);
				}
			};
		},
		[preferences, dispatch]
	);

	const updatePreferencesOptimistically = useCallback(
		async (newPreferences: { soundEnabled?: boolean; musicEnabled?: boolean }, rollbackFn: () => void) => {
			const newSoundEnabled = newPreferences.soundEnabled ?? soundEnabled;
			const newMusicEnabled = newPreferences.musicEnabled ?? musicEnabled;

			dispatch(setSoundEnabled(newSoundEnabled));
			dispatch(setMusicEnabled(newMusicEnabled));

			const mergedPreferences = mergeUserPreferences(null, {
				...preferences,
				soundEnabled: newSoundEnabled,
				musicEnabled: newMusicEnabled,
			});
			audioService.setUserPreferences(mergedPreferences);

			if (!newMusicEnabled) {
				audioService.stop(AudioKey.BACKGROUND_MUSIC);
				audioService.stop(AudioKey.GAME_MUSIC);
			} else {
				if (!isMuted) {
					audioService.markUserInteracted();
					requestAnimationFrame(() => {
						audioService.play(AudioKey.BACKGROUND_MUSIC);
					});
				}
			}

			if (isAuthenticated) {
				try {
					await updatePreferences.mutateAsync(newPreferences);
				} catch {
					rollbackFn();
				}
			}
			// For unauthenticated users, Redux Persist handles persistence automatically
			// No need for manual storageService.set - Redux Persist saves to localStorage
		},
		[soundEnabled, musicEnabled, preferences, isMuted, isAuthenticated, updatePreferences, dispatch]
	);

	const handleToggleAll = useCallback(async () => {
		const allEnabled = soundEnabled && musicEnabled;
		const newSoundEnabled = !allEnabled;
		const newMusicEnabled = !allEnabled;

		const rollbackFn = createRollbackFn(
			preferences?.soundEnabled ?? DEFAULT_USER_PREFERENCES.soundEnabled,
			preferences?.musicEnabled ?? DEFAULT_USER_PREFERENCES.musicEnabled
		);

		await updatePreferencesOptimistically({ soundEnabled: newSoundEnabled, musicEnabled: newMusicEnabled }, rollbackFn);
	}, [soundEnabled, musicEnabled, preferences, updatePreferencesOptimistically, createRollbackFn]);

	const handleSoundEnabledChange = useCallback(
		async (checked: boolean) => {
			const rollbackFn = createRollbackFn(preferences?.soundEnabled ?? DEFAULT_USER_PREFERENCES.soundEnabled);

			await updatePreferencesOptimistically({ soundEnabled: checked }, rollbackFn);
		},
		[preferences, updatePreferencesOptimistically, createRollbackFn]
	);

	const handleMusicEnabledChange = useCallback(
		async (checked: boolean) => {
			const rollbackFn = createRollbackFn(
				undefined,
				preferences?.musicEnabled ?? DEFAULT_USER_PREFERENCES.musicEnabled
			);

			await updatePreferencesOptimistically({ musicEnabled: checked }, rollbackFn);
		},
		[preferences, updatePreferencesOptimistically, createRollbackFn]
	);

	return {
		handleToggleAll,
		handleSoundEnabledChange,
		handleMusicEnabledChange,
	};
}
