import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { resetGameMode, selectGameMode, setGameMode as setGameModeAction } from '@/redux/features/gameModeSlice';

import { GameModeConfig, GameSessionData, GameSessionStats, GameSessionUpdate } from '../../../types/game.types';
import { useOperationTimer } from '../../contexts';
import { useDebouncedCallback , useLocalStorage } from '../utils';

// import { useThrottle } from '../utils/useThrottle';

export function useGameMode() {
	const dispatch = useDispatch();
	const gameMode = useSelector(selectGameMode);
	const { start, complete } = useOperationTimer('game-mode-change');
	const [isGameOver, setIsGameOver] = useState(false);
	const [gameStats, setGameStats] = useState<GameSessionStats>({
		questionsAnswered: 0,
		correctAnswers: 0,
		timeElapsed: 0,
		score: 0,
	});

	// Enhanced tracking with previous values
	const previousGameMode = gameMode.currentMode;
	const previousScore = gameStats.score;

	// Debounced game mode change handler
	const debouncedSetGameMode = useDebouncedCallback(
		(config: GameModeConfig) => {
			start();
			dispatch(setGameModeAction({ mode: config.mode, config }));
			complete();
		},
		300,
		{ leading: true, trailing: false }
	);

	const setGameMode = useCallback(
		(config: GameModeConfig) => {
			debouncedSetGameMode.debounced(config);
		},
		[debouncedSetGameMode]
	);

	const startGameSession = useCallback(() => {
		start();
		setIsGameOver(false);
		setGameStats({
			questionsAnswered: 0,
			correctAnswers: 0,
			timeElapsed: 0,
			score: 0,
		});
		complete();
	}, [start, complete]);

	const endGameSession = useCallback(() => {
		start();
		setIsGameOver(true);
		complete();
	}, [start, complete]);

	const resetGameSession = useCallback(() => {
		start();
		dispatch(resetGameMode());
		setIsGameOver(false);
		setGameStats({
			questionsAnswered: 0,
			correctAnswers: 0,
			timeElapsed: 0,
			score: 0,
		});
		complete();
	}, [dispatch, start, complete]);

	const handleQuestionAnswered = useCallback((isCorrect: boolean, score: number) => {
		setGameStats(prev => ({
			...prev,
			questionsAnswered: prev.questionsAnswered + 1,
			correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
			score: score,
		}));
	}, []);

	const updateTimeElapsed = useCallback((time: number) => {
		setGameStats(prev => ({
			...prev,
			timeElapsed: time,
		}));
	}, []);

	// Auto-save game stats
	useEffect(() => {
		if (gameStats.questionsAnswered > 0) {
			localStorage.setItem('game-stats', JSON.stringify(gameStats));
		}
	}, [gameStats]);

	return {
		gameMode,
		setGameMode,
		startGameSession,
		endGameSession,
		resetGameSession,
		handleQuestionAnswered,
		updateTimeElapsed,
		isGameOver,
		gameStats,
		previousGameMode,
		previousScore,
		accuracy: gameStats.questionsAnswered > 0 ? (gameStats.correctAnswers / gameStats.questionsAnswered) * 100 : 0,
	};
}

// Enhanced game session management with persistence
export function useGameSession() {
	const [sessionData, setSessionData] = useLocalStorage<GameSessionData>('game-session', {
		lastGameMode: null,
		lastScore: 0,
		lastTimeElapsed: 0,
		sessionCount: 0,
	});

	const updateSessionData = useCallback(
		(data: GameSessionUpdate) => {
			setSessionData(prev => ({
				...prev,
				...data,
				sessionCount: prev.sessionCount + 1,
			}));
		},
		[setSessionData]
	);

	const clearSessionData = useCallback(() => {
		setSessionData({
			lastGameMode: null,
			lastScore: 0,
			lastTimeElapsed: 0,
			sessionCount: 0,
		});
	}, [setSessionData]);

	return {
		sessionData,
		updateSessionData,
		clearSessionData,
	};
}
