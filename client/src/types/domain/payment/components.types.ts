import type { CreditPurchaseOption } from '@shared/types';

export interface PayPalButtonInstance {
	render: (container: string | HTMLElement) => Promise<void>;
	close: () => void;
}

export interface PaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	package: CreditPurchaseOption;
	onSuccess: (credits: number) => void;
}
