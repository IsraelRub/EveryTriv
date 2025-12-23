/**
 * Trivia-specific validation utilities (server-only)
 *
 * @module ServerTriviaValidation
 * @description Server-side trivia validation functions
 */
import { VALIDATION_CONFIG } from '@shared/constants';
import type { BaseValidationResult, GameDifficulty, TriviaInputValidationResult } from '@shared/types';
import {
	extractCustomDifficultyText,
	isCustomDifficulty,
	isGameDifficulty,
	isRegisteredDifficulty,
	validateCustomDifficultyText,
} from '@shared/validation/domain/difficulty.validation';

import { validateTopicLength } from '@internal/validation/core';

/**
 * Performs quick validation for trivia input without external API calls
 *
 * @param topic The trivia topic string to validate
 * @param difficulty The difficulty level string to validate
 * @returns TriviaInputValidationResult Validation result with detailed error information
 * @description Validates topic length, difficulty format, and custom difficulty requirements
 */
export function validateTriviaInputQuick(topic: string, difficulty: string): TriviaInputValidationResult {
	const result: TriviaInputValidationResult = {
		topic: { isValid: true, errors: [] },
		difficulty: { isValid: true, errors: [] },
		overall: { isValid: true, canProceed: true },
	};

	// Use validateTopicLength which already checks for empty/trimmed topic
	const topicValidation = validateTopicLength(topic);
	if (!topicValidation.isValid) {
		result.topic.isValid = false;
		if (topicValidation.errors.length > 0) {
			result.topic.errors.push(topicValidation.errors[0]);
		}
	}

	if (!difficulty) {
		result.difficulty.isValid = false;
		result.difficulty.errors.push('Difficulty is required');
	} else if (isCustomDifficulty(difficulty)) {
		// Validate custom difficulty using shared validation function
		const customText = extractCustomDifficultyText(difficulty);
		const customDifficultyValidation = validateCustomDifficultyText(customText);
		if (!customDifficultyValidation.isValid) {
			result.difficulty.isValid = false;
			result.difficulty.errors.push(...customDifficultyValidation.errors);
		}
	} else {
		if (!isRegisteredDifficulty(difficulty)) {
			result.difficulty.isValid = false;
			result.difficulty.errors.push('Please select a valid difficulty level');
		}
	}

	result.overall.isValid = result.topic.isValid && result.difficulty.isValid;
	result.overall.canProceed = result.overall.isValid;

	return result;
}

/**
 * Trivia question payload for validation
 */
export interface TriviaQuestionValidationPayload {
	question: string;
	answers: string[];
	correctAnswerIndex: number;
	topic?: string;
	difficulty?: GameDifficulty;
}

/**
 * Validates trivia question payload
 *
 * @param payload The trivia question payload to validate
 * @returns BaseValidationResult Validation result with errors if invalid
 * @description Validates question text, answers, correct answer index, topic, and difficulty
 */
export function validateTriviaQuestion(payload: TriviaQuestionValidationPayload): BaseValidationResult {
	const errors: string[] = [];

	// Validate question text
	if (!payload.question || payload.question.trim().length === 0) {
		errors.push('Question text is required');
	} else {
		const { MIN_LENGTH, MAX_LENGTH } = VALIDATION_CONFIG.limits.TRIVIA_QUESTION;
		if (payload.question.length < MIN_LENGTH) {
			errors.push(`Question text must be at least ${MIN_LENGTH} characters long`);
		}
		if (payload.question.length > MAX_LENGTH) {
			errors.push(`Question text is too long (max ${MAX_LENGTH} characters)`);
		}
	}

	// Validate answers
	if (!payload.answers || !Array.isArray(payload.answers)) {
		errors.push('Answers must be an array');
	} else {
		const { MIN, MAX } = VALIDATION_CONFIG.limits.ANSWER_COUNT;
		if (payload.answers.length < MIN) {
			errors.push(`At least ${MIN} answers are required`);
		}
		if (payload.answers.length > MAX) {
			errors.push(`Maximum ${MAX} answers allowed`);
		}

		// Validate each answer
		const maxAnswerLength = VALIDATION_CONFIG.limits.TRIVIA_ANSWER.MAX_LENGTH;
		for (let i = 0; i < payload.answers.length; i++) {
			const answer = payload.answers[i];
			if (!answer || typeof answer !== 'string' || answer.trim().length === 0) {
				errors.push(`Answer ${i + 1} cannot be empty`);
			} else if (answer.length > maxAnswerLength) {
				errors.push(`Answer ${i + 1} is too long (max ${maxAnswerLength} characters)`);
			}
		}
	}

	// Validate correct answer index
	if (!(typeof payload.correctAnswerIndex === 'number' && Number.isFinite(payload.correctAnswerIndex))) {
		errors.push('Correct answer index is required and must be a number');
	} else if (payload.correctAnswerIndex < 0 || payload.correctAnswerIndex >= (payload.answers?.length ?? 0)) {
		errors.push('Correct answer index must be within the range of available answers');
	}

	// Validate topic if provided
	if (payload.topic != null) {
		if (typeof payload.topic !== 'string') {
			errors.push('Topic must be a string');
		} else {
			const topicValidation = validateTopicLength(payload.topic);
			if (!topicValidation.isValid) {
				errors.push(...topicValidation.errors);
			}
		}
	}

	// Validate difficulty if provided
	if (payload.difficulty != null) {
		if (!isGameDifficulty(payload.difficulty)) {
			errors.push('Difficulty must be a valid difficulty level');
		} else if (isCustomDifficulty(payload.difficulty)) {
			const customText = extractCustomDifficultyText(payload.difficulty);
			const customDifficultyValidation = validateCustomDifficultyText(customText);
			if (!customDifficultyValidation.isValid) {
				errors.push(...customDifficultyValidation.errors);
			}
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}
