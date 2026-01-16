interface PayPalButton {
	render(container: string | HTMLElement): Promise<void>;
	close(): void;
}

interface PayPal {
	Buttons(options: {
		createOrder?: (
			data: unknown,
			actions: {
				order: {
					create: (orderData: {
						purchase_units: Array<{ amount: { value: string; currency_code: string }; description?: string }>;
					}) => Promise<string>;
				};
			}
		) => Promise<string>;
		onApprove?: (data: { orderID: string }, actions: unknown) => Promise<void>;
		onError?: (err: Error) => void;
		onCancel?: (data: unknown) => void;
	}): PayPalButton;
}

declare global {
	interface Window {
		paypal?: PayPal;
	}
}

export {};
