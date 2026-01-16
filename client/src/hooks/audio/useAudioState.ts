import { useCallback, useEffect, useRef } from 'react';

import { clientLogger as logger } from '@/services';
import {
	selectAudioInitialized,
	selectIsMuted,
	selectMusicEnabled,
	selectSoundEnabled,
	selectVolume,
} from '@/redux/selectors';
import { setInitialized, setMuted, setVolume } from '@/redux/slices';
import { useAppDispatch, useAppSelector } from '../useRedux';

export function useAudioState() {
	const dispatch = useAppDispatch();
	const volume = useAppSelector(selectVolume);
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

	const handleMuteToggle = useCallback(() => {
		dispatch(setMuted(!isMuted));
	}, [isMuted, dispatch]);

	return {
		volume,
		isMuted,
		soundEnabled,
		musicEnabled,
		isInitialized: isInitializedRef.current || isInitialized,
		isInitializedRef,
		handleVolumeChange,
		handleMuteToggle,
	};
}
