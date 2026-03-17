export interface UserFieldConfig {
	type: 'string' | 'number' | 'boolean';
	fieldName?: string;
	minLength?: number;
	maxLength?: number;
}

export interface CreateGoogleUserData {
	googleId: string;
	email: string;
	firstName?: string;
	lastName?: string;
}

export interface UserIdRow {
	userId: string;
}

export interface RecentGameActivity {
	gameId: string;
	score: number;
	correctAnswers: number;
	totalQuestions: number;
	timeSpent: number;
	topic: string;
	difficulty: string;
	createdAt: Date;
}

export interface CleanupTestUsersResponse {
	success: boolean;
	message: string;
	deletedUsers: number;
	deletedGameHistory: number;
	deletedUserStats: number;
	deletedCreditTransactions: number;
	deletedPaymentHistory: number;
}
