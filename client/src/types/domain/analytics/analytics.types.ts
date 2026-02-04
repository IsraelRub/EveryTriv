import type { AnswerHistory } from '@shared/types';

export interface CurrentGameStats {
	score: number;
	correctAnswers: number;
	totalQuestionsAnswered: number;
	successRate: number;
	averageTimePerQuestion: number;
	totalTime: number;
	answerHistory: AnswerHistory[];
}
