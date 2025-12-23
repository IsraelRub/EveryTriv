/**
 * Answer Utilities
 *
 * @module AnswerUtils
 * @description Utility functions for answer validation and result creation
 * @used_by client/src/views/game, server/src/features/game
 */
import type { AnswerResult, TriviaQuestion } from '../../types';

/**
 * Check if user's answer is correct
 * @param question The trivia question
 * @param userAnswer User's answer (string or number index)
 * @returns Whether the answer is correct
 */
export function checkAnswerCorrectness(question: TriviaQuestion, userAnswer: string | number): boolean {
	if (typeof userAnswer === 'number') {
		return userAnswer === question.correctAnswerIndex;
	}
	const correctAnswerText = question.answers[question.correctAnswerIndex]?.text || '';
	return userAnswer.toLowerCase().trim() === correctAnswerText.toLowerCase().trim();
}

/**
 * Create AnswerResult from question and answer information
 * @param questionId Question identifier
 * @param question The trivia question
 * @param userAnswer User's answer (string or number index)
 * @param isCorrect Whether the answer is correct
 * @param timeSpent Time spent answering in seconds
 * @param scoreEarned Score earned for this answer
 * @param totalScore Total score so far (default: 0)
 * @returns AnswerResult object
 */
export function createAnswerResult(
	questionId: string,
	question: TriviaQuestion,
	userAnswer: string | number,
	isCorrect: boolean,
	timeSpent: number,
	scoreEarned: number,
	totalScore: number = 0
): AnswerResult {
	const correctAnswerText = question.answers[question.correctAnswerIndex]?.text || '';
	const userAnswerText = typeof userAnswer === 'number' ? question.answers[userAnswer]?.text || '' : userAnswer;

	return {
		questionId,
		userAnswer: userAnswerText,
		correctAnswer: correctAnswerText,
		isCorrect,
		timeSpent,
		scoreEarned,
		totalScore,
		feedback: isCorrect ? 'Correct answer!' : 'Wrong answer. Try again!',
	};
}
