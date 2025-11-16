export interface SavedGameConfiguration extends Record<string, unknown> {
	defaultDifficulty: string;
	defaultTopic: string;
	questionCount: number;
	timeLimit: number;
	soundEnabled: boolean;
}
