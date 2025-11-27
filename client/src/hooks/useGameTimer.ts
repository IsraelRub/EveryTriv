import { useEffect, useRef } from 'react';

import { GameMode } from '@shared/constants';
import type { GameModeConfig } from '@shared/types';

import { AudioKey } from '../constants';
import { audioService } from '../services';
import type { ClientGameState } from '../types';

/**
 * Hook for managing game timer, game over checks, and time warnings
 * Centralized hook for game timer logic including timer interval management, time calculations, game over detection, and time warnings
 *
 * @param currentGameMode Current game mode configuration from GameModeConfig
 * @param onStateChange Callback to update game state when timer changes
 * @param state Current game state (ClientGameState)
 * @param onGameEnd Optional callback when game ends (time runs out or question limit reached)
 * @returns Void - this hook manages side effects only
 */
export function useGameTimer(
	currentGameMode: GameModeConfig | undefined,
	onStateChange: (newState: ClientGameState) => void,
	state: ClientGameState | undefined,
	onGameEnd?: () => void
): void {
	const lastWarningTimeRef = useRef<number | null>(null);

	useEffect(() => {
		if (!currentGameMode || currentGameMode.isGameOver) return;

		const checkGameOver = (): boolean => {
			if (!onStateChange || !state?.gameMode) return false;

			let shouldEndGame = false;
			let updatedGameMode = { ...currentGameMode };

			if (currentGameMode.mode === GameMode.TIME_LIMITED && currentGameMode.timer?.timeRemaining !== undefined) {
				if (currentGameMode.timer.timeRemaining <= 0) {
					shouldEndGame = true;
					updatedGameMode = {
						...currentGameMode,
						isGameOver: true,
						timer: {
							...currentGameMode.timer,
							timeRemaining: 0,
						},
					};
				}
			} else if (
				currentGameMode.mode === GameMode.QUESTION_LIMITED &&
				currentGameMode.questionLimit !== undefined &&
				currentGameMode.questionLimit <= 0
			) {
				shouldEndGame = true;
				updatedGameMode = {
					...currentGameMode,
					isGameOver: true,
				};
			}

			if (shouldEndGame) {
				onStateChange({
					...state,
					gameMode: updatedGameMode,
				});
				onGameEnd?.();
				return true;
			}

			return false;
		};

		if (!currentGameMode.timer?.isRunning) {
			checkGameOver();
			return;
		}

		const interval = setInterval(() => {
			const now = Date.now();
			const startTime = currentGameMode.timer?.startTime ?? now;
			const elapsed = now - startTime;

			if (onStateChange && state?.gameMode) {
				const updatedTimer = {
					...currentGameMode.timer,
					timeElapsed: elapsed,
				};

				if (currentGameMode.mode === GameMode.TIME_LIMITED && currentGameMode.timeLimit) {
					const remaining = Math.max(0, currentGameMode.timeLimit - elapsed);
					updatedTimer.timeRemaining = remaining;

					if (remaining > 0) {
						const remainingSeconds = Math.floor(remaining / 1000);

						if (remainingSeconds <= 10 && remainingSeconds > 3 && lastWarningTimeRef.current !== remainingSeconds) {
							audioService.play(AudioKey.TIME_WARNING);
							lastWarningTimeRef.current = remainingSeconds;
						} else if (
							remainingSeconds <= 3 &&
							remainingSeconds > 0 &&
							lastWarningTimeRef.current !== remainingSeconds
						) {
							audioService.play(AudioKey.COUNTDOWN);
							lastWarningTimeRef.current = remainingSeconds;
						} else if (
							remainingSeconds > 0 &&
							remainingSeconds % 30 === 0 &&
							lastWarningTimeRef.current !== remainingSeconds
						) {
							audioService.play(AudioKey.BEEP);
							lastWarningTimeRef.current = remainingSeconds;
						}
					}
				}

				onStateChange({
					...state,
					gameMode: {
						...currentGameMode,
						timer: updatedTimer,
					},
				});

				checkGameOver();
			}
		}, 1000);

		return () => {
			clearInterval(interval);
			lastWarningTimeRef.current = null;
		};
	}, [
		currentGameMode?.timer?.isRunning,
		currentGameMode?.timer?.startTime,
		currentGameMode?.mode,
		currentGameMode?.timeLimit,
		currentGameMode?.questionLimit,
		currentGameMode?.isGameOver,
		onGameEnd,
		onStateChange,
		state,
	]);
}
