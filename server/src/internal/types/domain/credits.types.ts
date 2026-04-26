import type { CreditSource, CreditTransactionType } from '@shared/constants';

export interface CreditPackageConfigItem {
	id: string;
	credits: number;
	price: number;

	priceIls?: number;
	tier?: string;
}

export interface CreditTransaction {
	id: string;
	userId: string;
	amount: number;
	type: CreditTransactionType;
	source?: CreditSource;
	balanceAfter: number;
	description?: string;
	purchasedCreditsAfter: number;
	paymentId?: string;
	metadata: {
		questionsPerRequest?: number;
		requiredCredits?: number;
		originalAmount?: number;
		gameMode?: string;
		purchasedCreditsUsed?: number;
		creditsUsed?: number;
		reason?: string | null;
	};
}
