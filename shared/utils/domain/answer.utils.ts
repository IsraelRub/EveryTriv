import type { TriviaQuestion } from '@shared/types';
import { VALIDATORS } from '@shared/validation';

export function getCorrectAnswerIndex(question: TriviaQuestion): number {
	const idx = question.correctAnswerIndex;
	const answersLength = Array.isArray(question.answers) ? question.answers.length : 0;
	const isValid = VALIDATORS.number(idx) && Number.isInteger(idx) && idx >= 0 && idx < answersLength;
	return isValid ? idx : -1;
}

export function isAnswerCorrect(question: TriviaQuestion, userAnswer: number | null | undefined): boolean {
	if (!VALIDATORS.number(userAnswer) || userAnswer < 0) {
		return false;
	}
	const correctIndex = getCorrectAnswerIndex(question);
	return correctIndex !== -1 && userAnswer === correctIndex;
}
