import { Award, Crown, Flame, Star, User } from 'lucide-react';

import { DEFAULT_GAME_CONFIG, DifficultyLevel, GameMode, SurpriseScope } from '@shared/constants';

import type { GameModeState, RankDisplayEntry, RankKey, TopicBadgeMeta } from '@/types';
import { Colors } from '../core/ui/color.constants';
import { GameKey } from '../core/ui/localeKeys.constants';
import { VariantBase } from '../core/ui/variant.constants';

export const SURPRISE_SCOPE_LABEL_KEYS: Record<SurpriseScope, string> = {
	[SurpriseScope.TOPIC]: GameKey.SURPRISE_TOPIC,
	[SurpriseScope.DIFFICULTY]: GameKey.SURPRISE_DIFFICULTY,
	[SurpriseScope.BOTH]: GameKey.SURPRISE_BOTH,
};

export const DIFFICULTY_LABEL_KEYS: Record<DifficultyLevel, string> = {
	[DifficultyLevel.EASY]: GameKey.DIFFICULTY_EASY,
	[DifficultyLevel.MEDIUM]: GameKey.DIFFICULTY_MEDIUM,
	[DifficultyLevel.HARD]: GameKey.DIFFICULTY_HARD,
	[DifficultyLevel.CUSTOM]: GameKey.DIFFICULTY_CUSTOM,
};

export const ANSWER_LETTER_KEYS: readonly string[] = [
	GameKey.ANSWER_LETTER_FIRST,
	GameKey.ANSWER_LETTER_SECOND,
	GameKey.ANSWER_LETTER_THIRD,
	GameKey.ANSWER_LETTER_FOURTH,
	GameKey.ANSWER_LETTER_FIFTH,
];

export const GAME_MODES_SET: ReadonlySet<string> = new Set(Object.values(GameMode));

export enum TimerMode {
	COUNTDOWN = 'countdown',
	ELAPSED = 'elapsed',
}

export enum TimerColorPrefix {
	TEXT = 'text',
	BG = 'bg',
}

export enum AnswerButtonState {
	IDLE = 'idle',
	SELECTED = 'selected',
	CORRECT = 'correct',
	WRONG = 'wrong',
	DISABLED = 'disabled',
}

export enum TextLanguageStatus {
	IDLE = 'idle',
	PENDING = 'pending',
	VALID = 'valid',
	INVALID = 'invalid',
}

export const initialGameModeState: GameModeState = {
	currentMode: GameMode.QUESTION_LIMITED,
	currentTopic: DEFAULT_GAME_CONFIG.defaultTopic,
	currentDifficulty: DEFAULT_GAME_CONFIG.defaultDifficulty,
	currentSettings: {
		mode: GameMode.QUESTION_LIMITED,
		topic: DEFAULT_GAME_CONFIG.defaultTopic,
		difficulty: DEFAULT_GAME_CONFIG.defaultDifficulty,
		maxQuestionsPerGame: DEFAULT_GAME_CONFIG.maxQuestionsPerGame,
		timeLimit: undefined,
		answerCount: undefined,
	},
	isLoading: false,
	error: undefined,
};

export const RANK_DISPLAY = {
	1: {
		icon: Crown,
		textColor: Colors.YELLOW_500.text,
		bgColor: Colors.YELLOW_500.bg,
		podiumSlotIndex: 1,
		podiumHeight: 'h-40',
	},
	2: {
		icon: Award,
		textColor: Colors.GRAY_400.text,
		bgColor: Colors.GRAY_400.bg,
		podiumSlotIndex: 0,
		podiumHeight: 'h-32',
	},
	3: {
		icon: Award,
		textColor: Colors.AMBER_600.text,
		bgColor: Colors.AMBER_600.bg,
		podiumSlotIndex: 2,
		podiumHeight: 'h-24',
	},
};

export const STAR_GRADE_LEVELS_AND_THRESHOLDS = {
	threeStars: { stars: 3, threshold: 75 },
	twoStars: { stars: 2, threshold: 50 },
	oneStar: { stars: 1, threshold: 25 },
};

const RANK_KEYS = [1, 2, 3] as const;

export const PODIUM_SLOTS: readonly {
	rank: RankKey;
	resultIndex: number;
	icon: RankDisplayEntry['icon'];
	textColor: RankDisplayEntry['textColor'];
	bgColor: RankDisplayEntry['bgColor'];
	podiumSlotIndex: RankDisplayEntry['podiumSlotIndex'];
	podiumHeight: RankDisplayEntry['podiumHeight'];
}[] = [...RANK_KEYS]
	.sort((a, b) => RANK_DISPLAY[a].podiumSlotIndex - RANK_DISPLAY[b].podiumSlotIndex)
	.map(rank => ({
		rank,
		resultIndex: rank - 1,
		...RANK_DISPLAY[rank],
	}));

export enum TopicBadgeType {
	MOST_PLAYED = 'most-played',
	YOUR = 'your',
	BASIC = 'basic',
	POPULAR = 'popular',
}

export const TOPIC_BADGE_LABEL_KEYS: Partial<Record<TopicBadgeType, string>> = {
	[TopicBadgeType.MOST_PLAYED]: GameKey.TOPIC_BADGE_YOUR_TOP,
	[TopicBadgeType.YOUR]: GameKey.TOPIC_BADGE_YOUR,
	[TopicBadgeType.POPULAR]: GameKey.POPULAR,
};


export function isTopicBadgeType(value: string): value is TopicBadgeType {
	return TOPIC_BADGE_TYPE_SET.has(value);
}

export const TOPIC_BADGE_META: Partial<Record<TopicBadgeType, TopicBadgeMeta>> = {
	[TopicBadgeType.MOST_PLAYED]: {
		label: 'Your Top',
		variant: VariantBase.OUTLINE,
		icon: Star,
		iconClassName: 'text-indigo-600 dark:text-indigo-400 h-3.5 w-3.5',
		badgeClassName: 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
	},
	[TopicBadgeType.YOUR]: {
		label: 'Your',
		variant: VariantBase.OUTLINE,
		icon: User,
		iconClassName: `${Colors.AMBER_600.text} dark:text-amber-400 h-3.5 w-3.5`,
		badgeClassName: `${Colors.AMBER_600.border}/40 ${Colors.AMBER_600.bg}/15 text-amber-700 dark:text-amber-300`,
	},
	[TopicBadgeType.POPULAR]: {
		label: 'Popular',
		variant: VariantBase.OUTLINE,
		icon: Flame,
		iconClassName: 'text-teal-600 dark:text-teal-400',
		badgeClassName: 'border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-300',
	},
};

export const TIMER_WARNING_RATIO = 0.15;

export enum ExitReason {
	CREDITS_EXHAUSTED = 'credits_exhausted',
}

export enum ExitGameButtonVariant {
	GAME = 'game',
	ROOM = 'room',
}

const TOPIC_BADGE_TYPE_SET: ReadonlySet<string> = new Set([
	TopicBadgeType.MOST_PLAYED,
	TopicBadgeType.YOUR,
	TopicBadgeType.BASIC,
	TopicBadgeType.POPULAR,
]);

