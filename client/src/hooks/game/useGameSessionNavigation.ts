import { useCallback } from 'react';

import { AudioKey, ROUTES } from '@/constants';
import { audioService } from '@/services';
import { selectIsMuted, selectMusicEnabled } from '@/redux/selectors';
import { useNavigationClose } from '../ui/useNavigationClose';
import { useAppSelector } from '../useRedux';

export function useGameSessionNavigation() {
	const isMuted = useAppSelector(selectIsMuted);
	const musicEnabled = useAppSelector(selectMusicEnabled);

	const handleResumeBackgroundMusic = useCallback(() => {
		audioService.stop(AudioKey.GAME_MUSIC);
		// Resume background music if music is enabled and not muted
		if (!isMuted && musicEnabled) {
			audioService.markUserInteracted();
			requestAnimationFrame(() => {
				audioService.play(AudioKey.BACKGROUND_MUSIC);
			});
		}
	}, [isMuted, musicEnabled]);

	const startGameMusic = useCallback(() => {
		audioService.stop(AudioKey.BACKGROUND_MUSIC);
		audioService.play(AudioKey.GAME_START);
		audioService.play(AudioKey.GAME_MUSIC);
	}, []);

	const endGameMusic = useCallback(() => {
		audioService.stop(AudioKey.GAME_MUSIC);
		audioService.play(AudioKey.GAME_END);
	}, []);

	const { handleClose, isModal } = useNavigationClose({
		defaultRoute: ROUTES.HOME,
		onBeforeClose: handleResumeBackgroundMusic,
	});

	return {
		handleClose,
		isModal,
		resumeBackgroundMusic: handleResumeBackgroundMusic,
		startGameMusic,
		endGameMusic,
	};
}
