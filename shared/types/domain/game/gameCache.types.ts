export interface SavedGameConfiguration extends Record<string, unknown> {
	defaultDifficulty: string;
	defaultTopic: string;
	questionsPerRequest: number;
	timeLimit: number;
	soundEnabled: boolean;
}
