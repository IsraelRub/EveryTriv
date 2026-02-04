import { useEffect, useRef } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { AudioKey, ROUTES } from '@/constants';
import { audioService } from '@/services';
import {
	selectGameId,
	selectGameQuestions,
	selectIsGameFinalized,
	selectIsMuted,
	selectMusicEnabled,
} from '@/redux/selectors';
import { useAppSelector } from '../useRedux';

export function useRouteBasedMusic() {
	const location = useLocation();
	const prevPathnameRef = useRef<string | null>(null);
	const isGameMusicActiveRef = useRef(false);

	// Get game state to check if game is actually active
	const gameId = useAppSelector(selectGameId);
	const questions = useAppSelector(selectGameQuestions);
	const isGameFinalized = useAppSelector(selectIsGameFinalized);
	const isMuted = useAppSelector(selectIsMuted);
	const musicEnabled = useAppSelector(selectMusicEnabled);

	useEffect(() => {
		const currentPath = location.pathname;
		const prevPath = prevPathnameRef.current;
		const isInitialMount = prevPath === null;

		// Check if we're on a game route
		const isGameRoute =
			matchPath({ path: ROUTES.GAME_PLAY, end: true }, currentPath) ||
			matchPath({ path: ROUTES.MULTIPLAYER_PLAY, end: false }, currentPath);

		// Determine if we should play game music
		// Play game music if we're on a game route and have questions loaded
		// Don't play game music if game is finalized or if we're still loading (no questions yet)
		// This ensures music starts only when game is actually active, not during "Connecting to server..."
		const shouldPlayGameMusic = isGameRoute && !!(gameId && questions.length > 0 && !isGameFinalized);

		// Stop background music if we're on a game route (even before questions load)
		// This ensures background music stops immediately when entering game route
		if (isGameRoute && audioService.isPlaying(AudioKey.BACKGROUND_MUSIC)) {
			audioService.stop(AudioKey.BACKGROUND_MUSIC);
		}

		// Handle music transition based on current state
		if (shouldPlayGameMusic && !isGameMusicActiveRef.current) {
			// Switching to game music
			audioService.stop(AudioKey.BACKGROUND_MUSIC);
			if (!isMuted && musicEnabled) {
				audioService.markUserInteracted();
				requestAnimationFrame(() => {
					audioService.play(AudioKey.GAME_START);
					audioService.play(AudioKey.GAME_MUSIC);
					isGameMusicActiveRef.current = true;
				});
			}
		} else if (!shouldPlayGameMusic && isGameMusicActiveRef.current) {
			// Switching back to background music (game ended or navigated away)
			audioService.stop(AudioKey.GAME_MUSIC);
			// Play GAME_END sound effect when navigating away from game route
			if (
				!isInitialMount &&
				prevPath &&
				prevPath !== currentPath &&
				matchPath({ path: ROUTES.GAME_PLAY, end: true }, prevPath)
			) {
				audioService.play(AudioKey.GAME_END);
			}
			// Only switch to background music if we're not on a game route anymore
			// If still on game route but game ended, keep game music playing briefly
			if (!isGameRoute && !isMuted && musicEnabled) {
				audioService.markUserInteracted();
				requestAnimationFrame(() => {
					audioService.play(AudioKey.BACKGROUND_MUSIC);
					isGameMusicActiveRef.current = false;
				});
			} else if (!isGameRoute) {
				isGameMusicActiveRef.current = false;
			}
		} else if (!shouldPlayGameMusic && !isGameMusicActiveRef.current && !isGameRoute) {
			// Ensure background music is playing if not already (for non-game routes only)
			// Don't start background music if we're on a game route, even if questions haven't loaded yet
			const isBackgroundPlaying = audioService.isPlaying(AudioKey.BACKGROUND_MUSIC);
			const isGamePlaying = audioService.isPlaying(AudioKey.GAME_MUSIC);
			if (!isBackgroundPlaying && !isGamePlaying && !isMuted && musicEnabled) {
				audioService.markUserInteracted();
				requestAnimationFrame(() => {
					audioService.play(AudioKey.BACKGROUND_MUSIC);
				});
			}
		}

		prevPathnameRef.current = currentPath;
	}, [location.pathname, gameId, questions.length, isGameFinalized, isMuted, musicEnabled]);
}
