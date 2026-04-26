import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DEFAULT_GAME_CONFIG, DifficultyLevel, LengthKey, VALIDATION_COUNT } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import {
	createCustomDifficulty,
	validateCustomDifficultyText,
	validateNoForbiddenWords,
	validateStringLength,
	validateTriviaInputQuick,
} from '@shared/validation';

import { GameKey, TextLanguageStatus, VALIDATION_MESSAGES } from '@/constants';
import type { GameSettingsValidationResult, UseGameSettingsFormReturn, ValidateGameSettingsOptions } from '@/types';
import { gameService } from '@/services';
import { translateValidationMessage } from '@/utils';
import { useUserRole } from '@/hooks/useAuth';
import { useAppSelector } from '@/hooks/useRedux';
import { selectLocale } from '@/redux/selectors';

export function useGameSettingsForm(): UseGameSettingsFormReturn {
	const { isAdmin } = useUserRole();
	const triviaOutputLocale = useAppSelector(selectLocale);
	const { t } = useTranslation();
	const defaultTopicString = t(GameKey.DEFAULT_TOPIC);

	const [topic, setTopic] = useState<string>(() => defaultTopicString);
	const [topicError, setTopicError] = useState<string>('');
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DEFAULT_GAME_CONFIG.defaultDifficulty);
	const [customDifficulty, setCustomDifficulty] = useState('');
	const [customDifficultyError, setCustomDifficultyError] = useState<string>('');
	const [answerCount, setAnswerCount] = useState<number>(VALIDATION_COUNT.ANSWER_COUNT.DEFAULT);

	const trimmedTopic = useMemo(() => topic.trim(), [topic]);
	const trimmedCustomDifficulty = useMemo(() => customDifficulty.trim(), [customDifficulty]);

	const topicLanguageStatus = TextLanguageStatus.IDLE;
	const topicLanguageError = '';
	const customDifficultyLanguageStatus = TextLanguageStatus.IDLE;
	const customDifficultyLanguageError = '';

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
			}
		},
		[t]
	);

	const canSubmitLanguage = useMemo(() => {
		const topicOk =
			trimmedTopic === defaultTopicString ||
			(Boolean(trimmedTopic) &&
				validateStringLength(topic, LengthKey.TOPIC).isValid &&
				validateNoForbiddenWords(topic, 'Topic').isValid);
		const customOk =
			selectedDifficulty !== DifficultyLevel.CUSTOM ||
			!trimmedCustomDifficulty ||
			validateCustomDifficultyText(trimmedCustomDifficulty).isValid;
		return topicOk && customOk;
	}, [trimmedTopic, defaultTopicString, topic, selectedDifficulty, trimmedCustomDifficulty]);

	const validateTriviaTopicGate = useCallback(
		async (finalDifficulty: GameDifficulty): Promise<void> => {
			const topicForGate = trimmedTopic.length > 0 ? trimmedTopic : DEFAULT_GAME_CONFIG.defaultTopic;
			await gameService.validateTriviaTopic({
				topic: topicForGate,
				difficulty: finalDifficulty,
				outputLanguage: triviaOutputLocale,
			});
		},
		[trimmedTopic, triviaOutputLocale]
	);

	const validateSettings = useCallback(
		(options?: ValidateGameSettingsOptions): GameSettingsValidationResult => {
			const applyFieldErrors = options?.applyFieldErrors !== false;

			let finalDifficulty: GameDifficulty = selectedDifficulty;
			if (selectedDifficulty === DifficultyLevel.CUSTOM) {
				finalDifficulty = trimmedCustomDifficulty
					? createCustomDifficulty(trimmedCustomDifficulty)
					: DEFAULT_GAME_CONFIG.defaultDifficulty;
			}

			const result = validateTriviaInputQuick(trimmedTopic, finalDifficulty);

			const topicMsgs = result.topic.errors.map(e => translateValidationMessage(e, t));
			const diffMsgs = result.difficulty.errors.map(e => translateValidationMessage(e, t));
			const fromQuick = [...topicMsgs, ...diffMsgs];

			const structuralExtra: string[] = [];
			if (!canSubmitLanguage) {
				const topicOk =
					trimmedTopic === defaultTopicString ||
					(Boolean(trimmedTopic) &&
						validateStringLength(topic, LengthKey.TOPIC).isValid &&
						validateNoForbiddenWords(topic, 'Topic').isValid);
				if (!topicOk) {
					const len = validateStringLength(topic, LengthKey.TOPIC);
					if (!len.isValid && len.errors[0]) {
						structuralExtra.push(translateValidationMessage(len.errors[0], t));
					}
					const fw = validateNoForbiddenWords(topic, 'Topic');
					if (!fw.isValid && fw.errors[0]) {
						structuralExtra.push(translateValidationMessage(fw.errors[0], t));
					}
					if (structuralExtra.length === 0 && trimmedTopic && trimmedTopic !== defaultTopicString) {
						structuralExtra.push(translateValidationMessage(VALIDATION_MESSAGES.FIELD_INVALID('Topic'), t));
					}
				}
				if (
					selectedDifficulty === DifficultyLevel.CUSTOM &&
					trimmedCustomDifficulty &&
					!validateCustomDifficultyText(trimmedCustomDifficulty).isValid
				) {
					const cd = validateCustomDifficultyText(trimmedCustomDifficulty);
					for (const err of cd.errors) {
						structuralExtra.push(translateValidationMessage(err, t));
					}
				}
			}

			const issues = [...new Set([...fromQuick, ...structuralExtra].filter(Boolean))];

			if (applyFieldErrors) {
				setTopicError(result.topic.isValid ? '' : (topicMsgs[0] ?? ''));
				if (selectedDifficulty === DifficultyLevel.CUSTOM) {
					const diffMsg = diffMsgs[0] ?? translateValidationMessage(VALIDATION_MESSAGES.CUSTOM_DIFFICULTY_INVALID, t);
					setCustomDifficultyError(result.difficulty.isValid ? '' : diffMsg);
				} else {
					setCustomDifficultyError('');
				}
			}

			const isValid = result.overall.isValid && canSubmitLanguage;
			return { isValid, finalDifficulty, issues };
		},
		[trimmedTopic, trimmedCustomDifficulty, selectedDifficulty, t, canSubmitLanguage, defaultTopicString, topic]
	);

	const resetForm = useCallback(() => {
		setTopic(t(GameKey.DEFAULT_TOPIC));
		setTopicError('');
		setSelectedDifficulty(DEFAULT_GAME_CONFIG.defaultDifficulty);
		setCustomDifficulty('');
		setCustomDifficultyError('');
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
		validateTriviaTopicGate,
		resetForm,
	};
}
