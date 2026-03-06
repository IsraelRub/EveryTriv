import { useCallback, useState } from 'react';

import { DifficultyLevel, GAME_STATE_DEFAULTS, UserRole, VALIDATION_COUNT } from '@shared/constants';
import type { GameDifficulty } from '@shared/types';
import {
	createCustomDifficulty,
	validateCustomDifficultyText,
	validateTopicLength,
	validateTriviaRequest,
} from '@shared/validation';

import { VALIDATION_MESSAGES } from '@/constants';
import { useUserRole } from '@/hooks/useAuth';
import type { GameSettingsValidationResult, UseGameSettingsFormReturn } from '@/types';

export function useGameSettingsForm(): UseGameSettingsFormReturn {
	const [topic, setTopic] = useState<string>(GAME_STATE_DEFAULTS.TOPIC);
	const [topicError, setTopicError] = useState<string>('');
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
	const [customDifficulty, setCustomDifficulty] = useState('');
	const [customDifficultyError, setCustomDifficultyError] = useState<string>('');
	const [answerCount, setAnswerCount] = useState<number>(VALIDATION_COUNT.ANSWER_COUNT.DEFAULT);

	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	const handleTopicChange = useCallback((value: string) => {
		setTopic(value);
		if (value.trim()) {
			const topicValidation = validateTopicLength(value.trim());
			setTopicError(topicValidation.isValid ? '' : (topicValidation.errors[0] ?? ''));
		} else {
			setTopicError('');
		}
	}, []);

	const validateSettings = useCallback((): GameSettingsValidationResult => {
		let finalDifficulty: GameDifficulty = selectedDifficulty;
		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			finalDifficulty = customDifficulty.trim() ? createCustomDifficulty(customDifficulty) : DifficultyLevel.MEDIUM;
		}

		const trimmedTopic = topic.trim();
		if (trimmedTopic) {
			const triviaValidation = validateTriviaRequest(trimmedTopic, finalDifficulty);
			if (!triviaValidation.isValid) {
				const topicErrors = triviaValidation.errors.filter(
					err => err.toLowerCase().includes('topic') || err.toLowerCase().includes('length')
				);
				if (topicErrors.length > 0 && topicErrors[0]) {
					setTopicError(topicErrors[0]);
				}
				if (selectedDifficulty === DifficultyLevel.CUSTOM) {
					const difficultyErrors = triviaValidation.errors.filter(
						err => !err.toLowerCase().includes('topic') && !err.toLowerCase().includes('length')
					);
					if (difficultyErrors.length > 0 && difficultyErrors[0]) {
						setCustomDifficultyError(difficultyErrors[0]);
					}
				}
				return { isValid: false, finalDifficulty };
			}
		}
		setTopicError('');

		if (selectedDifficulty === DifficultyLevel.CUSTOM) {
			const trimmedCustomDifficulty = customDifficulty.trim();
			const validation = validateCustomDifficultyText(trimmedCustomDifficulty);
			if (!validation.isValid) {
				setCustomDifficultyError(validation.errors[0] ?? VALIDATION_MESSAGES.CUSTOM_DIFFICULTY_INVALID);
				return { isValid: false, finalDifficulty };
			}
			setCustomDifficultyError('');
		}

		return { isValid: true, finalDifficulty };
	}, [topic, selectedDifficulty, customDifficulty]);

	const resetForm = useCallback(() => {
		setTopic(GAME_STATE_DEFAULTS.TOPIC);
		setTopicError('');
		setSelectedDifficulty(DifficultyLevel.MEDIUM);
		setCustomDifficulty('');
		setCustomDifficultyError('');
		setAnswerCount(VALIDATION_COUNT.ANSWER_COUNT.DEFAULT);
	}, []);

	return {
		topic,
		topicError,
		selectedDifficulty,
		customDifficulty,
		customDifficultyError,
		answerCount,
		isAdmin,
		handleTopicChange,
		setSelectedDifficulty,
		setCustomDifficulty,
		setCustomDifficultyError,
		setAnswerCount,
		validateSettings,
		resetForm,
	};
}
