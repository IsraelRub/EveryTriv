import type { QuestionData, QuestionDataWithQuestion, TriviaQuestion } from '../../types';
import { getCorrectAnswerIndex } from './answer.utils';

export function createQuestionData(
	question: TriviaQuestion,
	userAnswer: number,
	isCorrect: boolean,
	timeSpent: number
): QuestionDataWithQuestion {
	return {
		question: question.question,
		questionId: question.id,
		userAnswerIndex: userAnswer >= 0 ? userAnswer : -1,
		correctAnswerIndex: getCorrectAnswerIndex(question),
		isCorrect,
		timeSpent,
	};
}

export function hasQuestionAccess(data: QuestionData): data is QuestionDataWithQuestion {
	return 'questionId' in data && 'userAnswerIndex' in data && 'correctAnswerIndex' in data;
}
