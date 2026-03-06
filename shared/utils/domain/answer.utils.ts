import type { TriviaQuestion } from '../../types';

export function getCorrectAnswerIndex(question: TriviaQuestion): number {
	const idx = question.correctAnswerIndex;
	const answersLength = Array.isArray(question.answers) ? question.answers.length : 0;
	const isValid = typeof idx === 'number' && Number.isInteger(idx) && idx >= 0 && idx < answersLength;
	return isValid ? idx : -1;
}

export function isAnswerCorrect(question: TriviaQuestion, userAnswer: number | null | undefined): boolean {
	if (typeof userAnswer !== 'number' || userAnswer < 0) {
		return false;
	}
	const correctIndex = getCorrectAnswerIndex(question);
	return correctIndex !== -1 && userAnswer === correctIndex;
}
