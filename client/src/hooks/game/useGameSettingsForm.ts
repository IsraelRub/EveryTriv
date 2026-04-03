import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
	DEFAULT_GAME_CONFIG,
	DifficultyLevel,
	LengthKey,
	Locale,
	ValidateTextContext,
	VALIDATION_COUNT,
} from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import {
	createCustomDifficulty,
	isLocale,
	validateCustomDifficultyText,
	validateNoForbiddenWords,
	validateStringLength,
	validateTriviaInputQuick,
} from '@shared/validation';

import {
	ErrorsKey,
	GameKey,
	LANGUAGE_VALIDATION_DEBOUNCE_MS,
	TextLanguageStatus,
	VALIDATION_MESSAGES,
} from '@/constants';
import type { GameSettingsValidationResult, UseGameSettingsFormReturn } from '@/types';
import { gameService } from '@/services';
import { translateValidationMessage } from '@/utils';
import { useUserRole } from '@/hooks/useAuth';

export function useGameSettingsForm(): UseGameSettingsFormReturn {
	const { isAdmin } = useUserRole();
	const { t, i18n } = useTranslation();
	const validationLanguage: Locale = isLocale(i18n.language)
		? i18n.language
		: i18n.language?.startsWith(Locale.HE)
			? Locale.HE
			: Locale.EN;
	const defaultTopicString = t(GameKey.DEFAULT_TOPIC);

	const [topic, setTopic] = useState<string>(() => defaultTopicString);
	const [topicError, setTopicError] = useState<string>('');
	const [topicLanguageStatus, setTopicLanguageStatus] = useState<TextLanguageStatus>(TextLanguageStatus.IDLE);
	const [topicLanguageError, setTopicLanguageError] = useState<string>('');
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DEFAULT_GAME_CONFIG.defaultDifficulty);
	const [customDifficulty, setCustomDifficulty] = useState('');
	const [customDifficultyError, setCustomDifficultyError] = useState<string>('');
	const [customDifficultyLanguageStatus, setCustomDifficultyLanguageStatus] = useState<TextLanguageStatus>(
		TextLanguageStatus.IDLE
	);
	const [customDifficultyLanguageError, setCustomDifficultyLanguageError] = useState<string>('');
	const [answerCount, setAnswerCount] = useState<number>(VALIDATION_COUNT.ANSWER_COUNT.DEFAULT);

	const topicDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const customDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const topicRequestRef = useRef<string | null>(null);
	const customRequestRef = useRef<string | null>(null);

	const trimmedTopic = useMemo(() => topic.trim(), [topic]);
	const trimmedCustomDifficulty = useMemo(() => customDifficulty.trim(), [customDifficulty]);

	const handleTopicChange = useCallback(
		(value: string) => {
			setTopic(value);
			if (value.trim()) {
				const topicLengthResult = validateStringLength(value, LengthKey.TOPIC);
				const topicValidation = !topicLengthResult.isValid
					? topicLengthResult
					: validateNoForbiddenWords(value, 'Topic');
				setTopicError(topicValidation.isValid ? '' : translateValidationMessage(topicValidation.errors[0] ?? '', t));
			} else {
				setTopicError('');
				setTopicLanguageStatus(TextLanguageStatus.IDLE);
				setTopicLanguageError('');
			}
		},
		[t]
	);

	useEffect(() => {
		const trimmed = topic.trim();
		if (topicDebounceRef.current) {
			clearTimeout(topicDebounceRef.current);
			topicDebounceRef.current = null;
		}
		const topicLengthResult = validateStringLength(topic, LengthKey.TOPIC);
		const topicValid = topicLengthResult.isValid && validateNoForbiddenWords(topic, 'Topic').isValid;
		if (!trimmed || !topicValid) {
			topicRequestRef.current = null;
			setTopicLanguageStatus(TextLanguageStatus.IDLE);
			setTopicLanguageError('');
			return;
		}
		setTopicLanguageStatus(TextLanguageStatus.PENDING);
		setTopicLanguageError('');
		topicRequestRef.current = trimmed;
		topicDebounceRef.current = setTimeout(async () => {
			topicDebounceRef.current = null;
			const requestId = trimmed;
			try {
				const res = await gameService.validateText(trimmed, ValidateTextContext.TOPIC, validationLanguage);
				if (topicRequestRef.current !== requestId) return;
				setTopicLanguageStatus(res.isValid ? TextLanguageStatus.VALID : TextLanguageStatus.INVALID);
				setTopicLanguageError(res.isValid ? '' : translateValidationMessage(res.errors[0] ?? '', t));
			} catch {
				if (topicRequestRef.current !== requestId) return;
				setTopicLanguageStatus(TextLanguageStatus.INVALID);
				setTopicLanguageError(t(ErrorsKey.INPUT_VALIDATION_FAILED));
			}
		}, LANGUAGE_VALIDATION_DEBOUNCE_MS);
		return () => {
			if (topicDebounceRef.current) clearTimeout(topicDebounceRef.current);
		};
	}, [topic, validationLanguage, t]);

	useEffect(() => {
		const trimmed = customDifficulty.trim();
		if (customDebounceRef.current) {
			clearTimeout(customDebounceRef.current);
			customDebounceRef.current = null;
		}
		if (selectedDifficulty !== DifficultyLevel.CUSTOM || !trimmed || !validateCustomDifficultyText(trimmed).isValid) {
			customRequestRef.current = null;
			setCustomDifficultyLanguageStatus(TextLanguageStatus.IDLE);
			setCustomDifficultyLanguageError('');
			return;
		}
		setCustomDifficultyLanguageStatus(TextLanguageStatus.PENDING);
		setCustomDifficultyLanguageError('');
		customRequestRef.current = trimmed;
		customDebounceRef.current = setTimeout(async () => {
			customDebounceRef.current = null;
			const requestId = trimmed;
			try {
				const res = await gameService.validateText(trimmed, ValidateTextContext.CUSTOM_DIFFICULTY, validationLanguage);
				if (customRequestRef.current !== requestId) return;
				setCustomDifficultyLanguageStatus(res.isValid ? TextLanguageStatus.VALID : TextLanguageStatus.INVALID);
				setCustomDifficultyLanguageError(res.isValid ? '' : translateValidationMessage(res.errors[0] ?? '', t));
			} catch {
				if (customRequestRef.current !== requestId) return;
				setCustomDifficultyLanguageStatus(TextLanguageStatus.INVALID);
				setCustomDifficultyLanguageError(t(ErrorsKey.INPUT_VALIDATION_FAILED));
			}
		}, LANGUAGE_VALIDATION_DEBOUNCE_MS);
		return () => {
			if (customDebounceRef.current) clearTimeout(customDebounceRef.current);
		};
	}, [selectedDifficulty, customDifficulty, validationLanguage, t]);

	// Allow submit when topic is the app default (no async validation required) or validated; same for custom difficulty when empty
	const topicLanguageOk =
		topicLanguageStatus === TextLanguageStatus.VALID ||
		(trimmedTopic === defaultTopicString &&
			topicLanguageStatus !== TextLanguageStatus.INVALID &&
			topicLanguageStatus !== TextLanguageStatus.PENDING);
	const customDifficultyLanguageOk =
		selectedDifficulty !== DifficultyLevel.CUSTOM ||
		customDifficultyLanguageStatus === TextLanguageStatus.VALID ||
		(selectedDifficulty === DifficultyLevel.CUSTOM &&
			!trimmedCustomDifficulty &&
			customDifficultyLanguageStatus !== TextLanguageStatus.PENDING &&
			customDifficultyLanguageStatus !== TextLanguageStatus.INVALID);
	const canSubmitLanguage = topicLanguageOk && customDifficultyLanguageOk;

	const validateSettings = useCallback((): GameSettingsValidationResult => {
		let finalDifficulty: GameDifficulty = selectedDifficulty;
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			finalDifficulty = trimmedCustomDifficulty
				? createCustomDifficulty(trimmedCustomDifficulty)
				: DEFAULT_GAME_CONFIG.defaultDifficulty;
		}

		const result = validateTriviaInputQuick(trimmedTopic, finalDifficulty);

		setTopicError(result.topic.isValid ? '' : translateValidationMessage(result.topic.errors[0] ?? '', t));
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			const diffMsg = result.difficulty.errors[0] ?? VALIDATION_MESSAGES.CUSTOM_DIFFICULTY_INVALID;
			setCustomDifficultyError(result.difficulty.isValid ? '' : translateValidationMessage(diffMsg, t));
		} else {
			setCustomDifficultyError('');
		}

		return { isValid: result.overall.isValid, finalDifficulty };
	}, [trimmedTopic, trimmedCustomDifficulty, selectedDifficulty, t]);

	const resetForm = useCallback(() => {
		setTopic(t(GameKey.DEFAULT_TOPIC));
		setTopicError('');
		setTopicLanguageStatus(TextLanguageStatus.IDLE);
		setTopicLanguageError('');
		setSelectedDifficulty(DEFAULT_GAME_CONFIG.defaultDifficulty);
		setCustomDifficulty('');
		setCustomDifficultyError('');
		setCustomDifficultyLanguageStatus(TextLanguageStatus.IDLE);
		setCustomDifficultyLanguageError('');
		setAnswerCount(VALIDATION_COUNT.ANSWER_COUNT.DEFAULT);
	}, [t]);

	return {
		topic,
		topicError,
		topicLanguageStatus,
		topicLanguageError,
		selectedDifficulty,
		customDifficulty,
		customDifficultyError,
		customDifficultyLanguageStatus,
		customDifficultyLanguageError,
		answerCount,
		isAdmin,
		canSubmitLanguage,
		handleTopicChange,
		setSelectedDifficulty,
		setCustomDifficulty,
		setCustomDifficultyError,
		setAnswerCount,
		validateSettings,
		resetForm,
	};
}
