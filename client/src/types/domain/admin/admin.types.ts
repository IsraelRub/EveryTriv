import type { LucideIcon } from 'lucide-react';

import type { CreditPurchaseOption } from '@shared/types';

export interface AdminPricingResponse {
	packages: CreditPurchaseOption[];
	isDefault: boolean;
}

export interface CreditPackageEditItem {
	id: string;
	credits: number;
	price: number;
	tier?: string;
}

export interface AdminPricingUpdatePayload {
	packages: CreditPackageEditItem[];
}

export interface ClearOperation {
	id: string;
	title: string;
	description: string;
	itemName: string;
	currentCount?: number;
	onClear: () => void | Promise<void>;
	isLoading?: boolean;
	icon: LucideIcon;
}

export type { TriviaQuestionsResponse } from '@shared/types';

export interface PlatformTrendsSectionStats {
	icon: LucideIcon;
	label: string;
	value: string;
	color: string;
}
