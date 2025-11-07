/**
 * Game Component Types
 * @module GameComponentTypes
 * @description Game component prop types and interfaces
 */
import { FormEvent } from 'react';

import { GameMode } from '@shared/constants';
import type { DifficultyBreakdown, FavoriteTopic, GameModeConfig, TriviaQuestion } from '@shared/types';

import { ClientGameState, GameTimerState } from './config.types';

/**
 * @interface CurrentQuestionMetadata
 * @description Metadata for the current question being displayed
 */
export interface CurrentQuestionMetadata {
	customDifficultyMultiplier?: number;
	actualDifficulty?: string;
	questionCount?: number;
}

/**
 * Game component props interface
 * @interface GameProps
 * @description Props for the Game component
 * @used_by client/src/components/game/Game.tsx
 */
export interface GameProps {
	state: ClientGameState;
	onStateChange: (newState: ClientGameState) => void;
	trivia?: TriviaQuestion;
	selected?: number | null;
	gameMode?: GameModeConfig;
	onNewQuestion?: () => Promise<void>;
	onGameEnd?: () => void;
}

/**
 * Props for trivia game component
 * @used_by client/src/components/game/TriviaGame.tsx
 */
export interface TriviaGameProps {
	question: TriviaQuestion;
	onComplete: (isCorrect: boolean, pointsEarned?: number) => void;
	timeLimit?: number;
}

/**
 * Props for game timer component
 * @used_by client/src/components/game/GameTimer.tsx
 * @description Props for the game timer component
 * @remarks Timer updates, warnings, and game end logic are handled by useGameTimer hook
 */
export interface GameTimerProps {
	timer: GameTimerState;
	gameMode?: GameModeConfig;
	className?: string;
}

/**
 * Props for trivia form component
 * @used_by client/src/components/game/TriviaForm.tsx
 */
export interface TriviaFormProps {
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	loading?: boolean;
	topic?: string;
	difficulty?: string;
	questionCount?: number;
	onTopicChange?: (topic: string) => void;
	onDifficultyChange?: (difficulty: string) => void;
	onQuestionCountChange?: (count: number) => void;
	onGameModeSelect?: (mode: string) => void;
	showGameModeSelector?: boolean;
	onGameModeSelectorClose?: () => void;
}

/**
 * Props for favorite topics component
 * @used_by client/src/components/user/FavoriteTopics.tsx
 */
export interface FavoriteTopicsProps {
	favorites: FavoriteTopic[];
	onRemove: (index: number) => void;
	onSelect?: (favorite: FavoriteTopic) => void;
	className?: string;
}

/**
 * Props for game mode UI component
 * @used_by client/src/components/gameMode/GameMode.tsx
 */
export interface GameModeUIProps {
	currentMode?: string;
	onModeChange?: (mode: string) => void;
	onTopicChange?: (topic: string) => void;
	onDifficultyChange?: (difficulty: string) => void;
	className?: string;
	isVisible?: boolean;
	onSelectMode?: (config: { mode: GameMode; timeLimit?: number; questionLimit?: number }) => void;
	onModeSelect?: (mode: string) => void;
	onCancel?: () => void;
}

/**
 * Props for scoring statistics component
 * @used_by client/src/components/stats/ScoringSystem.tsx
 */
export interface ScoringSystemProps {
	currentStreak: number;
	score?: number;
	total?: number;
	topicsPlayed?: string[];
	difficultyStats?: DifficultyBreakdown;
	currentQuestionMetadata?: CurrentQuestionMetadata;
}

/**
 * Props for custom difficulty history component
 * @used_by client/src/components/stats/CustomDifficultyHistory.tsx
 */
export interface CustomDifficultyHistoryProps {
	history?: {
		difficulty: string;
		score: number;
		date: string;
	}[];
	onItemClick?: (item: { id: string; name: string; value: number }) => void;
	className?: string;
	isVisible?: boolean;
	onClose?: () => void;
	onSelect?: (topic: string, difficulty: string) => void;
}

/**
 * Props for current difficulty component
 * @used_by client/src/components/home/CurrentDifficulty.tsx
 */
export interface CurrentDifficultyProps {
	difficulty: string;
	onDifficultyChange: (difficulty: string) => void;
	className?: string;
	delay?: number;
	topic?: string;
	onShowHistory?: () => void;
}

/**
 * Props for home title component
 * @used_by client/src/components/home/HomeTitle.tsx
 */
export interface HomeTitleProps {
	title: string;
	subtitle?: string;
	className?: string;
	delay?: number;
}

/**
 * Props for error component
 * @used_by client/src/components/home/ErrorBanner.tsx
 */
export interface ErrorBannerProps {
	message: string;
	type?: 'error' | 'warning' | 'info';
	onClose?: () => void;
	className?: string;
	difficulty?: string;
}

/**
 * Props for social sharing component
 * @used_by client/src/components/layout/SocialShare.tsx
 */
export interface SocialShareProps {
	text?: string;
	url?: string;
	platforms?: string[];
	className?: string;
	score?: number;
	total?: number;
	topic?: string;
	difficulty?: string;
}

/**
 * Props for leaderboard component
 * @used_by client/src/components/leaderboard/Leaderboard.tsx
 */
export interface LeaderboardProps {
	entries?: {
		rank: number;
		username: string;
		score: number;
		avatar?: string;
	}[];
	onEntryClick?: (entry: { id: string; username: string; score: number; rank: number }) => void;
	className?: string;
	userId?: string;
}
