import { createSlice,PayloadAction } from '@reduxjs/toolkit';
import {
	CUSTOM_DIFFICULTY_MULTIPLIERS,
	CUSTOM_DIFFICULTY_PREFIX,
	DIFFICULTY_MULTIPLIERS,
	DifficultyLevel,
} from 'everytriv-shared/constants';

import { FavoritePayload, GameMode, GameState, ScoreUpdatePayload, TriviaQuestion } from '../../types';

const initialState: GameState = {
	isPlaying: false,
	currentQuestion: 0,
	totalQuestions: 0,
	score: 0,
	timeRemaining: 0,
	difficulty: '',
	topic: '',
	questions: [],
	answers: [],
	loading: false,
	error: null,
	trivia: null,
	selected: null,
	total: 0,
	streak: 0,
	favorites: [],
	stats: {
		totalGames: 0,
		topicsPlayed: {},
		difficultyStats: {},
		successRateByDifficulty: {},
	},
	gameMode: {
		mode: GameMode.CLASSIC,
		isGameOver: false,
		timer: {
			isRunning: false,
			startTime: null,
			timeElapsed: 0,
		},
		questionsRemaining: undefined,
		timeLimit: undefined,
		questionLimit: undefined,
	},
};

const gameStateSlice = createSlice({
	name: 'game',
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setError: (state, action: PayloadAction<string>) => {
			state.error = action.payload;
			state.loading = false;
		},
		setTrivia: (state, action: PayloadAction<TriviaQuestion>) => {
			state.trivia = action.payload;
			state.loading = false;
			state.error = null;
			state.selected = null;
		},
		setSelected: (state, action: PayloadAction<number | null>) => {
			state.selected = action.payload;
		},
		updateScore: (state, action: PayloadAction<ScoreUpdatePayload>) => {
			const basePoints = 100;
			let currentStreak = state.streak || 0;

			if (action.payload.correct) {
				// Calculate multipliers
				const difficultyMultiplier = (() => {
					if (!state.trivia) return 1;

					// Check if custom difficulty has metadata with multiplier
					if (state.trivia.metadata?.customDifficultyMultiplier) {
						return state.trivia.metadata.customDifficultyMultiplier;
					}

					// Check if it's a custom difficulty (starts with custom:)
					if (state.trivia.difficulty.startsWith(CUSTOM_DIFFICULTY_PREFIX)) {
						// Extract custom difficulty text and find matching multiplier
						const customText = state.trivia.difficulty.substring(CUSTOM_DIFFICULTY_PREFIX.length).toLowerCase();

						// Find matching multiplier from CUSTOM_DIFFICULTY_MULTIPLIERS
						for (const [keyword, multiplier] of Object.entries(CUSTOM_DIFFICULTY_MULTIPLIERS)) {
							if (customText.includes(keyword.toLowerCase())) {
								return multiplier;
							}
						}

						return DIFFICULTY_MULTIPLIERS.CUSTOM_DEFAULT; // Default custom difficulty multiplier
					}

					// Standard difficulty multipliers
					switch (state.trivia.difficulty) {
						case DifficultyLevel.EASY:
							return DIFFICULTY_MULTIPLIERS[DifficultyLevel.EASY];
						case DifficultyLevel.MEDIUM:
							return DIFFICULTY_MULTIPLIERS[DifficultyLevel.MEDIUM];
						case DifficultyLevel.HARD:
							return DIFFICULTY_MULTIPLIERS[DifficultyLevel.HARD];
						default:
							return 1;
					}
				})();

				const timeBonus =
					action.payload.totalTime && action.payload.timeSpent
						? 1 + ((action.payload.totalTime - action.payload.timeSpent) / action.payload.totalTime) * 0.5
						: 1;

				const optionsMultiplier = (() => {
					const optionsCount = state.trivia?.answers.length || 3;
					switch (optionsCount) {
						case 3:
							return 1;
						case 4:
							return 1.2;
						case 5:
							return 1.4;
						default:
							return 1;
					}
				})();

				const totalMultiplier = difficultyMultiplier * timeBonus * optionsMultiplier;
				const pointsEarned = Math.round(basePoints * totalMultiplier);

				state.score += pointsEarned;
				currentStreak += 1;

				// Update difficulty stats
				const difficulty = state.trivia?.difficulty || 'unknown';
				if (!state.stats.difficultyStats[difficulty]) {
					state.stats.difficultyStats[difficulty] = { correct: 0, total: 0 };
				}
				state.stats.difficultyStats[difficulty].correct += 1;
				state.stats.difficultyStats[difficulty].total += 1;
			} else {
				currentStreak = 0; // Reset streak on wrong answer
			}

			state.streak = currentStreak;
		},
		addFavorite: (state, action: PayloadAction<FavoritePayload>) => {
			state.favorites.push(action.payload);
		},
		removeFavorite: (state, action: PayloadAction<number>) => {
			state.favorites.splice(action.payload, 1);
		},
		resetGame: () => initialState,
	},
});

export const { setLoading, setError, setTrivia, setSelected, updateScore, addFavorite, removeFavorite, resetGame } =
	gameStateSlice.actions;

export default gameStateSlice.reducer;
