/**
 * Payment Component Types
 * @module PaymentComponentTypes
 * @description Type definitions for payment-related components
 */

import type { CreditPurchaseOption, CreditTransaction } from '@shared/types';

/**
 * Payment dialog component props
 * @interface PaymentDialogProps
 * @description Props for the PaymentDialog component
 * @used_by client/src/components/payment/PaymentDialog.tsx
 */
export interface PaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	package: CreditPurchaseOption;
	onSuccess: (credits: number) => void;
}

/**
 * Credit history card component props
 * @interface CreditHistoryCardProps
 * @description Props for the CreditHistoryCard component
 * @used_by client/src/components/payment/CreditHistoryCard.tsx
 */
export interface CreditHistoryCardProps {
	transactions: CreditTransaction[] | undefined;
	isLoading: boolean;
}
