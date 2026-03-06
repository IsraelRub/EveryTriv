import { useEffect, useRef } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import { RoomStatus } from '@shared/constants';

import { AudioKey, ROUTES } from '@/constants';
import { audioService } from '@/services';
import {
	selectGameId,
	selectGameQuestions,
	selectIsGameFinalized,
	selectIsMuted,
	selectMultiplayerRoom,
	selectMusicEnabled,
} from '@/redux/selectors';
import { useAppSelector } from '../useRedux';

export function useRouteBasedMusic() {
	const location = useLocation();
	const prevPathnameRef = useRef<string | null>(null);
	const isGameMusicActiveRef = useRef(false);

	const gameId = useAppSelector(selectGameId);
	const questions = useAppSelector(selectGameQuestions);
	const isGameFinalized = useAppSelector(selectIsGameFinalized);
	const room = useAppSelector(selectMultiplayerRoom);
	const isMuted = useAppSelector(selectIsMuted);
	const musicEnabled = useAppSelector(selectMusicEnabled);

	useEffect(() => {
		const currentPath = location.pathname;
		const prevPath = prevPathnameRef.current;
		const isInitialMount = prevPath === null;

		const isSinglePlayRoute = matchPath({ path: ROUTES.GAME_SINGLE_PLAY, end: true }, currentPath) != null;
		const isMultiplayerPlayRoute = matchPath({ path: ROUTES.MULTIPLAYER_PLAY, end: false }, currentPath) != null;
		const isGameRoute = isSinglePlayRoute || isMultiplayerPlayRoute;

		const isSinglePlayerGameActive = isSinglePlayRoute && !!(gameId && questions.length > 0 && !isGameFinalized);
		// Play game music when on multiplayer play URL and room is in PLAYING state (questions may still be loading)
		const isMultiplayerGameActive = isMultiplayerPlayRoute && room != null && room.status === RoomStatus.PLAYING;

		const shouldPlayGameMusic = isGameRoute && (isSinglePlayerGameActive || isMultiplayerGameActive);

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
			// Play GAME_END sound effect when navigating away from game route (single or multiplayer)
			const wasOnSinglePlay = prevPath && matchPath({ path: ROUTES.GAME_SINGLE_PLAY, end: true }, prevPath);
			const wasOnMultiplayerPlay = prevPath && matchPath({ path: ROUTES.MULTIPLAYER_PLAY, end: false }, prevPath);
			if (!isInitialMount && prevPath && prevPath !== currentPath && (wasOnSinglePlay ?? wasOnMultiplayerPlay)) {
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
	}, [location.pathname, gameId, questions.length, isGameFinalized, room, isMuted, musicEnabled]);
}
