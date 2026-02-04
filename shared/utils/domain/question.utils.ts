import type { AnswerHistory, AnswerHistoryComplete, TriviaQuestion } from '../../types';
import { getCorrectAnswerIndex } from './answer.utils';

export function createAnswerHistory(
	question: TriviaQuestion,
	userAnswer: number,
	isCorrect: boolean,
	timeSpent: number
): AnswerHistoryComplete {
	return {
		question: question.question,
		questionId: question.id,
		userAnswerIndex: userAnswer >= 0 ? userAnswer : -1,
		correctAnswerIndex: getCorrectAnswerIndex(question),
		isCorrect,
		timeSpent,
	};
}

export function hasQuestionAccess(data: AnswerHistory): data is AnswerHistoryComplete {
	return 'questionId' in data && 'userAnswerIndex' in data && 'correctAnswerIndex' in data;
}
