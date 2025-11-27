export interface SavedGameConfiguration extends Record<string, unknown> {
	defaultDifficulty: string;
	defaultTopic: string;
	requestedQuestions: number;
	timeLimit: number;
	soundEnabled: boolean;
}
