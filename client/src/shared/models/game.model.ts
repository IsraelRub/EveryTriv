import { TriviaQuestion } from './trivia.model';

export interface GameState {
	favorites: Array<{ topic: string; difficulty: string }>;
	trivia: TriviaQuestion | null;
	loading: boolean;
	error: string;
	score: number;
	total: number;
	selected: number | null;
	stats: {
		topicsPlayed: Record<string, number>;
		successRateByDifficulty: Record<string, { correct: number; total: number }>;
	};
}
