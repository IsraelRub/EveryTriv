import { useCallback, useEffect, useRef } from 'react';

import { clientLogger as logger } from '@/services';
import {
	selectAudioInitialized,
	selectIsMuted,
	selectMusicEnabled,
	selectMusicVolume,
	selectSoundEffectsVolume,
	selectSoundEnabled,
	selectVolume,
} from '@/redux/selectors';
import { setInitialized, setMusicVolume, setMuted, setSoundEffectsVolume, setVolume } from '@/redux/slices';
import { useAppDispatch, useAppSelector } from '../useRedux';

export function useAudioState() {
	const dispatch = useAppDispatch();
	const volume = useAppSelector(selectVolume);
	const soundEffectsVolume = useAppSelector(selectSoundEffectsVolume);
	const musicVolume = useAppSelector(selectMusicVolume);
	const isMuted = useAppSelector(selectIsMuted);
	const soundEnabled = useAppSelector(selectSoundEnabled);
	const musicEnabled = useAppSelector(selectMusicEnabled);
	const isInitialized = useAppSelector(selectAudioInitialized);
	const isInitializedRef = useRef(false);

	// Sync isInitializedRef with Redux state
	useEffect(() => {
		isInitializedRef.current = isInitialized;
	}, [isInitialized]);

	// Mark as initialized when component mounts with valid state
	useEffect(() => {
		if (!isInitialized && !isInitializedRef.current) {
			dispatch(setInitialized(true));
			isInitializedRef.current = true;
		}
	}, [isInitialized, dispatch]);

	const handleVolumeChange = useCallback(
		(values: number[]) => {
			const newVolume = values[0];
			if (newVolume == null) {
				logger.mediaWarn('Volume change received undefined value');
				return;
			}
			dispatch(setVolume(newVolume));

			if (newVolume > 0 && isMuted) {
				dispatch(setMuted(false));
			}
		},
		[isMuted, dispatch]
	);

	const handleSoundEffectsVolumeChange = useCallback(
		(values: number[]) => {
			const v = values[0];
			if (v != null) dispatch(setSoundEffectsVolume(v));
		},
		[dispatch]
	);

	const handleMusicVolumeChange = useCallback(
		(values: number[]) => {
			const v = values[0];
			if (v != null) dispatch(setMusicVolume(v));
		},
		[dispatch]
	);

	const handleMuteToggle = useCallback(() => {
		dispatch(setMuted(!isMuted));
	}, [isMuted, dispatch]);

	return {
		volume,
		soundEffectsVolume,
		musicVolume,
		isMuted,
		soundEnabled,
		musicEnabled,
		isInitialized: isInitializedRef.current || isInitialized,
		isInitializedRef,
		handleVolumeChange,
		handleSoundEffectsVolumeChange,
		handleMusicVolumeChange,
		handleMuteToggle,
	};
}
