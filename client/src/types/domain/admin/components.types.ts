import type { AdminTriviaQuestion } from './admin.types';

export interface TriviaTableProps {
	questions: AdminTriviaQuestion[];
	totalCount: number;
	isLoading: boolean;
	onClearAll?: () => void;
}

export interface ConfirmClearDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	itemName: string;
	onConfirm: () => void;
	isLoading: boolean;
}

export interface UserTableRow {
	id: string;
	email: string;
	role: string;
	createdAt: string;
	lastLogin: string;
}

export interface ConsistencyDiscrepancy {
	expected: number;
	actual: number;
}

export interface ConsistencyResultRow {
	userId: string;
	isConsistent: boolean;
	discrepancies: {
		totalGames: ConsistencyDiscrepancy;
		totalQuestionsAnswered: ConsistencyDiscrepancy;
		correctAnswers: ConsistencyDiscrepancy;
		totalScore: ConsistencyDiscrepancy;
	};
}
