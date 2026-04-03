import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '@/types';

export const selectCurrentGameMode = (state: RootState) => state.gameMode.currentMode;
export const selectCurrentTopic = (state: RootState) => state.gameMode.currentTopic;
export const selectCurrentDifficulty = (state: RootState) => state.gameMode.currentDifficulty;
export const selectCurrentSettings = (state: RootState) => state.gameMode.currentSettings;

export const selectGameId = (state: RootState) => state.gameSession.gameId;
export const selectCurrentQuestionIndex = (state: RootState) => state.gameSession.currentQuestionIndex;
export const selectGameQuestionCount = (state: RootState) => state.gameSession.gameQuestionCount;
export const selectGameScore = (state: RootState) => state.gameSession.score;
export const selectCorrectAnswers = (state: RootState) => state.gameSession.correctAnswers;
export const selectGameQuestions = (state: RootState) => state.gameSession.questions;
export const selectAnswerHistory = (state: RootState) => state.gameSession.answerHistory;
export const selectSelectedAnswer = (state: RootState) => state.gameSession.selectedAnswer;
export const selectAnswered = (state: RootState) => state.gameSession.answered;
export const selectStreak = (state: RootState) => state.gameSession.streak;
export const selectGameLoading = (state: RootState) => state.gameSession.loading;
export const selectGameLoadingStep = (state: RootState) => state.gameSession.loadingStep;
export const selectGameStartTime = (state: RootState) => state.gameSession.gameStartTime;
export const selectTimeSpent = (state: RootState) => state.gameSession.timeSpent;
export const selectIsGameFinalized = (state: RootState) => state.gameSession.isGameFinalized;
export const selectCreditsDeducted = (state: RootState) => state.gameSession.creditsDeducted;
export const selectLastScoreEarned = (state: RootState) => state.gameSession.lastScoreEarned;

export const selectCurrentQuestion = createSelector(
	[selectGameQuestions, selectCurrentQuestionIndex],
	(questions, index) => {
		return questions[index] ?? null;
	}
);

export const selectIsConnected = (state: RootState) => state.multiplayer.isConnected;
export const selectMultiplayerRoom = (state: RootState) => state.multiplayer.room;
export const selectMultiplayerGameState = (state: RootState) => state.multiplayer.gameState;
export const selectMultiplayerError = (state: RootState) => state.multiplayer.error;
export const selectMultiplayerLoading = (state: RootState) => state.multiplayer.isLoading;
export const selectMultiplayerPersonalAnswerHistory = (state: RootState) => state.multiplayer.personalAnswerHistory;

export const selectVolume = (state: RootState) => state.audioSettings.volume;
export const selectSoundEffectsVolume = (state: RootState) => state.audioSettings.soundEffectsVolume ?? 1;
export const selectMusicVolume = (state: RootState) => state.audioSettings.musicVolume ?? 1;
export const selectIsMuted = (state: RootState) => state.audioSettings.isMuted;
export const selectSoundEnabled = (state: RootState) => state.audioSettings.soundEnabled;
export const selectMusicEnabled = (state: RootState) => state.audioSettings.musicEnabled;
export const selectAudioInitialized = (state: RootState) => state.audioSettings.isInitialized;

export const selectLeaderboardPeriod = (state: RootState) => state.uiPreferences.leaderboardPeriod;
export const selectLocale = (state: RootState) => state.uiPreferences.locale;
