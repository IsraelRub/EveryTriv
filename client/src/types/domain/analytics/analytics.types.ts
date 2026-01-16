import type { QuestionData } from '@shared/types';

export interface CurrentGameStats {
	score: number;
	correctAnswers: number;
	totalQuestionsAnswered: number;
	successRate: number;
	averageTimePerQuestion: number;
	totalTime: number;
	questionsData: QuestionData[];
}
