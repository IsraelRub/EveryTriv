import {
	Award,
	BookOpen,
	Crown,
	Flame,
	GamepadIcon,
	GraduationCap,
	Star,
	Trophy,
	User,
	Zap,
	type LucideIcon,
} from 'lucide-react';

import { GAME_STATE_DEFAULTS, GameMode } from '@shared/constants';

import type { GameModeState, RankDisplayEntry, RankKey, TopicBadgeMeta } from '@/types';
import { Colors } from '../core/ui/color.constants';
import { VariantBase } from '../core/ui/variant.constants';

// ---------------------------------------------------------------------------
// Client-only: topics list, timer mode
// ---------------------------------------------------------------------------

export const GAME_MODES_SET: ReadonlySet<string> = new Set(Object.values(GameMode));

export const BASIC_TOPICS = [GAME_STATE_DEFAULTS.TOPIC, 'Science', 'History', 'Geography'] as const;

export enum TimerMode {
	COUNTDOWN = 'countdown',
	ELAPSED = 'elapsed',
}

// ---------------------------------------------------------------------------
// Game state (answer button, initial game mode)
// ---------------------------------------------------------------------------

export enum AnswerButtonState {
	IDLE = 'idle',
	SELECTED = 'selected',
	CORRECT = 'correct',
	WRONG = 'wrong',
	DISABLED = 'disabled',
}

export const initialGameModeState: GameModeState = {
	currentMode: GameMode.QUESTION_LIMITED,
	currentTopic: GAME_STATE_DEFAULTS.TOPIC,
	currentDifficulty: GAME_STATE_DEFAULTS.DIFFICULTY,
	currentSettings: {
		mode: GameMode.QUESTION_LIMITED,
		topic: GAME_STATE_DEFAULTS.TOPIC,
		difficulty: GAME_STATE_DEFAULTS.DIFFICULTY,
		maxQuestionsPerGame: GAME_STATE_DEFAULTS.TOTAL_QUESTIONS,
		timeLimit: undefined,
		answerCount: undefined,
	},
	isLoading: false,
	error: undefined,
};

// ---------------------------------------------------------------------------
// Rank & podium display (icon, colors, podium slot order and height)
// ---------------------------------------------------------------------------

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
	threeStars: { stars: 3, threshold: 70 },
	twoStars: { stars: 2, threshold: 50 },
	oneStar: { stars: 1, threshold: 30 },
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

// ---------------------------------------------------------------------------
// Achievement display (client-only): category and Lucide Icon per id
// ---------------------------------------------------------------------------

export const ACHIEVEMENT_DISPLAY: Record<string, { category: string; Icon: LucideIcon }> = {
	'ach-first-game': { category: 'Engagement', Icon: GamepadIcon },
	'ach-ten-games': { category: 'Engagement', Icon: Trophy },
	'ach-twenty-five-games': { category: 'Engagement', Icon: Award },
	'ach-fifty-games': { category: 'Engagement', Icon: Award },
	'ach-hundred-games': { category: 'Engagement', Icon: Crown },
	'ach-week-warrior': { category: 'Engagement', Icon: Flame },
	'ach-streak-hero': { category: 'Engagement', Icon: Zap },
	'ach-high-scorer': { category: 'Performance', Icon: Star },
	'ach-expert': { category: 'Performance', Icon: GraduationCap },
	'ach-hundred-answers': { category: 'Engagement', Icon: BookOpen },
	'ach-five-hundred-answers': { category: 'Engagement', Icon: BookOpen },
	'ach-thousand-answers': { category: 'Engagement', Icon: BookOpen },
	'ach-topic-specialist': { category: 'Knowledge', Icon: BookOpen },
};

// ---------------------------------------------------------------------------
// Topic badges, timer, scoring (client-only defaults where needed)
// ---------------------------------------------------------------------------

export enum TopicBadgeType {
	MOST_PLAYED = 'most-played',
	YOUR = 'your',
	BASIC = 'basic',
	POPULAR = 'popular',
}

/** Set for O(1) membership checks (e.g. narrowing string to TopicBadgeType). */
export const TOPIC_BADGE_TYPE_SET: ReadonlySet<string> = new Set([
	TopicBadgeType.MOST_PLAYED,
	TopicBadgeType.YOUR,
	TopicBadgeType.BASIC,
	TopicBadgeType.POPULAR,
]);

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

// ---------------------------------------------------------------------------
// Game exit – credits exhausted (elegant exit message and actions)
// ---------------------------------------------------------------------------

export const CREDITS_EXIT_MESSAGES = {
	TITLE: "You've run out of credits",
	DESCRIPTION: 'Your game progress has been saved. You can view your summary or get more credits to continue playing.',
	VIEW_SUMMARY: 'View game summary',
	GET_CREDITS: 'Get credits',
	GO_HOME: 'Go to home',
} as const;
