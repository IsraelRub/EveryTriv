import type { AnswerResult, TriviaQuestion } from '../../types';

export function getCorrectAnswerIndex(question: TriviaQuestion): number {
	// Use stored correctAnswerIndex if available (for performance and consistency with DB)
	if (question.correctAnswerIndex !== undefined && question.correctAnswerIndex >= 0) {
		return question.correctAnswerIndex;
	}
	// Fallback: calculate dynamically from answers (for backward compatibility)
	return question.answers.findIndex(answer => answer.isCorrect);
}

export function checkAnswerCorrectness(question: TriviaQuestion, userAnswer: number): boolean {
	const correctIndex = getCorrectAnswerIndex(question);
	return userAnswer === correctIndex;
}

export function createAnswerResult(
	questionId: string,
	userAnswer: number,
	isCorrect: boolean,
	timeSpent: number,
	scoreEarned: number,
	totalScore: number = 0
): AnswerResult {
	return {
		questionId,
		userAnswerIndex: userAnswer >= 0 ? userAnswer : -1,
		isCorrect,
		timeSpent,
		scoreEarned,
		totalScore,
		feedback: isCorrect ? 'Correct answer!' : 'Wrong answer. Try again!',
	};
}
