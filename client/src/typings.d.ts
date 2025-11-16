declare module './date' {
	export function getCurrentTimestamp(): string;
}

interface PayPalButton {
	render(container: string | HTMLElement): Promise<void>;
}

interface PayPal {
	Buttons(options: {
		createOrder?: (data: unknown, actions: unknown) => Promise<string>;
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
