import type { LucideIcon } from 'lucide-react';

import type {
	CreditPurchaseOption,
	SecurityMetrics,
	SystemInsights,
	SystemPerformanceMetrics,
	SystemRecommendation,
} from '@shared/types';

export interface AdminPricingResponse {
	packages: CreditPurchaseOption[];
	isDefault: boolean;
}

export interface CreditPackageEditItem {
	id: string;
	credits: number;
	price: number;
	priceIls: number;
	tier?: string;
}

export interface AdminPricingUpdatePayload {
	packages: CreditPackageEditItem[];
}

export type { TriviaQuestionsResponse } from '@shared/types';

export interface AdminSystemHealthDashboardBundle {
	readonly performance: SystemPerformanceMetrics;
	readonly security: SecurityMetrics;
	readonly recommendations: SystemRecommendation[];
	readonly insights: SystemInsights;
}

export interface PlatformTrendsSectionStats {
	icon: LucideIcon;
	label: string;
	value: string;
	color: string;
}
