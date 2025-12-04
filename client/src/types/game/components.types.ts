/**
 * Game Component Types
 * @module GameComponentTypes
 * @description Game component prop types and interfaces
 */
import { FormEvent } from 'react';

import { GameMode } from '@shared/constants';
import type {
	BaseGameTopicDifficulty,
	DifficultyBreakdown,
	GameDifficulty,
	GameModeConfig,
	TriviaQuestion,
	ValidationSeverity,
} from '@shared/types';

import {
	ClickableItem,
	ClientGameState,
	CurrentQuestionMetadata,
	GameConfig,
	GameModeSelectionConfig,
	GameTimerState,
	HistoryItem,
	LeaderboardClickEntry,
	LeaderboardDisplayEntry,
} from './config.types';

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
	onComplete: (isCorrect: boolean, scoreEarned?: number) => void;
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
	answerCount?: number;
	onTopicChange?: (topic: string) => void;
	onDifficultyChange?: (difficulty: GameDifficulty) => void;
	onAnswerCountChange?: (count: number) => void;
}

/**
 * Props for favorite topics component
 * @used_by client/src/components/user/FavoriteTopics.tsx
 */
export interface FavoriteTopicsProps {
	favorites: BaseGameTopicDifficulty[];
	onRemove: (index: number) => void;
	onSelect?: (favorite: BaseGameTopicDifficulty) => void;
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
	onDifficultyChange?: (difficulty: GameDifficulty) => void;
	className?: string;
	isVisible?: boolean;
	onSelectMode?: (config: GameModeSelectionConfig) => void;
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
	history?: HistoryItem[];
	onItemClick?: (item: ClickableItem) => void;
	className?: string;
	isVisible?: boolean;
	onClose?: () => void;
	onSelect?: (selection: BaseGameTopicDifficulty) => void;
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
	type?: ValidationSeverity;
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
	entries?: LeaderboardDisplayEntry[];
	onEntryClick?: (entry: LeaderboardClickEntry) => void;
	className?: string;
	userId?: string;
}

/**
 * Game mode component props interface
 * @interface GameModeProps
 * @description Props for the GameMode component
 */
export interface GameModeProps {
	onModeSelect?: (mode: GameMode, settings?: GameConfig) => void;
}
