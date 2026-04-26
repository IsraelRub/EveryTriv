import { DEFAULT_GAME_CONFIG, DifficultyLevel } from '../../constants/domain/game.constants';
import { Locale } from '../../constants/domain/locale.constants';
import type { GameDifficulty } from '../../types/domain/game/trivia.types';
import { isCustomDifficulty } from './difficulty.validation';

export const TRUSTED_PRESET_TOPICS_BY_LOCALE: Readonly<Record<Locale, readonly string[]>> = {
	[Locale.EN]: ['General Knowledge', 'Science', 'History', 'Geography'],
	[Locale.HE]: ['ידע כללי', 'מדע', 'היסטוריה', 'גאוגרפיה'],
} as const;

export const TOPIC_DIFFICULTY_GATE_CACHE_MAX_KEYS = 500;

export const TOPIC_DIFFICULTY_GATE_CACHE_TTL_MS = 30 * 60 * 1000;

function normalizeTopicForMatch(topic: string): string {
	return topic.trim().replace(/\s+/g, ' ');
}

function isStandardPresetDifficulty(difficulty: GameDifficulty): boolean {
	if (isCustomDifficulty(difficulty)) {
		return false;
	}
	const lower = difficulty.toLowerCase();
	return lower === DifficultyLevel.EASY || lower === DifficultyLevel.MEDIUM || lower === DifficultyLevel.HARD;
}

export function isTrustedPresetTopic(topic: string, outputLanguage: Locale): boolean {
	const trimmed = normalizeTopicForMatch(topic);
	if (trimmed.length === 0) {
		return false;
	}

	const list = TRUSTED_PRESET_TOPICS_BY_LOCALE[outputLanguage] ?? TRUSTED_PRESET_TOPICS_BY_LOCALE[Locale.EN];

	const lowerTrimmed = trimmed.toLowerCase();
	for (const candidate of list) {
		const normalizedCandidate = normalizeTopicForMatch(candidate);
		if (outputLanguage === Locale.HE) {
			if (trimmed === normalizedCandidate) {
				return true;
			}
		} else if (lowerTrimmed === normalizedCandidate.toLowerCase()) {
			return true;
		}
	}

	// Default topic from server config (English canonical) when UI locale is EN
	if (outputLanguage === Locale.EN && lowerTrimmed === DEFAULT_GAME_CONFIG.defaultTopic.toLowerCase()) {
		return true;
	}

	return false;
}

export function shouldSkipTopicDifficultyGate(params: {
	topic: string;
	difficulty: GameDifficulty;
	outputLanguage: Locale;
}): boolean {
	return isStandardPresetDifficulty(params.difficulty) && isTrustedPresetTopic(params.topic, params.outputLanguage);
}

export function buildTopicDifficultyGateCacheKey(topic: string, difficulty: GameDifficulty, locale: Locale): string {
	const normalizedTopic = topic.trim().toLowerCase();
	const diff = typeof difficulty === 'string' ? difficulty.trim() : '';
	return `${locale}|${diff}|${normalizedTopic}`;
}
