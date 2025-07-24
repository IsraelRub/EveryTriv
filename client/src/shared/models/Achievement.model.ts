export interface Achievement {
	id: string;
	title: string;
	description: string;
	icon: string;
	condition: (stats: GameStats) => boolean;
	progress: (stats: GameStats) => number;
	target: number;
}

export interface GameStats {
	totalGames: number;
	correctAnswers: number;
	topicsPlayed: Record<string, number>;
	difficultyStats: Record<string, { correct: number; total: number }>;
	streaks: {
		current: number;
		best: number;
	};
}

export const ACHIEVEMENTS: Achievement[] = [
	{
		id: 'first_correct',
		title: 'First Steps',
		description: 'Get your first correct answer',
		icon: '🌟',
		condition: (stats) => stats.correctAnswers >= 1,
		progress: (stats) => Math.min(stats.correctAnswers, 1),
		target: 1,
	},
	{
		id: 'master_easy',
		title: 'Easy Master',
		description: 'Get 90% success rate in Easy difficulty (min. 10 questions)',
		icon: '🎯',
		condition: (stats) => {
			const easy = stats.difficultyStats['easy'] || { correct: 0, total: 0 };
			return easy.total >= 10 && easy.correct / easy.total >= 0.9;
		},
		progress: (stats) => {
			const easy = stats.difficultyStats['easy'] || { correct: 0, total: 0 };
			return easy.total >= 10 ? (easy.correct / easy.total) * 100 : 0;
		},
		target: 90,
	},
	{
		id: 'topic_explorer',
		title: 'Topic Explorer',
		description: 'Play questions from 5 different topics',
		icon: '🌍',
		condition: (stats) => Object.keys(stats.topicsPlayed).length >= 5,
		progress: (stats) => Object.keys(stats.topicsPlayed).length,
		target: 5,
	},
	{
		id: 'streak_master',
		title: 'Streak Master',
		description: 'Get a streak of 5 correct answers',
		icon: '🔥',
		condition: (stats) => stats.streaks.best >= 5,
		progress: (stats) => stats.streaks.best,
		target: 5,
	},
	{
		id: 'hard_champion',
		title: 'Hard Champion',
		description: 'Answer 10 hard questions correctly',
		icon: '👑',
		condition: (stats) => {
			const hard = stats.difficultyStats['hard'] || { correct: 0, total: 0 };
			return hard.correct >= 10;
		},
		progress: (stats) => {
			const hard = stats.difficultyStats['hard'] || { correct: 0, total: 0 };
			return hard.correct;
		},
		target: 10,
	},
];
