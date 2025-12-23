/**
 * Question Utilities
 *
 * @module QuestionUtils
 * @description Utility functions for question data creation and manipulation
 * @used_by client/src/views/game, server/src/features/game
 */
import type { QuestionData, TriviaQuestion } from '../../types';

/**
 * Create QuestionData from question and answer information
 * @param question The trivia question
 * @param userAnswer User's answer (string or number index)
 * @param isCorrect Whether the answer is correct
 * @param timeSpent Time spent answering in seconds
 * @returns QuestionData object
 */
export function createQuestionData(
	question: TriviaQuestion,
	userAnswer: string | number,
	isCorrect: boolean,
	timeSpent: number
): QuestionData {
	const correctAnswerText = question.answers[question.correctAnswerIndex]?.text || '';
	const userAnswerText = typeof userAnswer === 'number' ? question.answers[userAnswer]?.text || '' : userAnswer;

	return {
		question: question.question,
		userAnswer: userAnswerText,
		correctAnswer: correctAnswerText,
		isCorrect,
		timeSpent,
	};
}
