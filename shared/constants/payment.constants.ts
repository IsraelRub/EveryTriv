/**
 * Payment constants for EveryTriv with enhanced features
 * Defines payment features and content
 *
 * @module PaymentConstants
 * @description Payment configuration constants with advanced options
 * @used_by client/src/views/payment/PaymentView.tsx
 */

/**
 * Payment page features and content
 * @constant
 * @description Features displayed on the payment page
 * @used_by client/src/views/payment/PaymentView.tsx
 */
export const PAYMENT_FEATURES = {
	UNLIMITED_QUESTIONS: {
		title: 'Unlimited Questions',
		description: 'Access to an endless library of trivia questions across all categories and difficulties.',
		icon: 'zap',
		color: 'primary',
		priority: 1,
		featured: true,
	},
	CUSTOM_DIFFICULTIES: {
		title: 'Custom Difficulties',
		description: 'Create and play trivia games with custom difficulty settings, perfect for all skill levels.',
		icon: 'star',
		color: 'accent',
	},
	DAILY_FREE_QUESTIONS: {
		title: 'Daily Free Questions (20)',
		description: 'Get 20 free questions daily to play without spending points. Reset at midnight UTC.',
		icon: 'timer',
		color: 'success',
	},
	SUPPORT: {
		title: '24/7 Support',
		description: 'Our dedicated support team is available 24/7 to help you with any questions or issues.',
		icon: 'lightbulb',
		color: 'warning',
	},
} as const;

/**
 * Payment page text content
 * @constant
 * @description Text content used throughout the payment page
 * @used_by client/src/views/payment/PaymentView.tsx
 */
export const PAYMENT_CONTENT = {
	HEADER: {
		title: 'Upgrade Your Experience',
		subtitle: 'Get unlimited access to custom difficulties and premium features',
	},
	PACKAGES: {
		noPackagesTitle: 'No Packages Available',
		noPackagesMessage: 'Please try again later or contact support.',
		popularBadge: 'POPULAR',
		selectPlan: 'Select Plan',
		selected: 'Selected',
		points: 'Points',
		save: 'Save',
		features: {
			questions: 'trivia questions',
			difficulties: 'Access to all difficulties',
			noExpiration: 'No expiration date',
		},
	},
	PAYMENT: {
		title: 'Payment Details',
		cardNumber: 'Card Number',
		cardNumberPlaceholder: '1234 5678 9012 3456',
		expiryDate: 'Expiry Date',
		expiryDatePlaceholder: 'MM/YY',
		cvv: 'CVV',
		cvvPlaceholder: '123',
		nameOnCard: 'Name on Card',
		nameOnCardPlaceholder: 'John Doe',
		processing: 'Processing...',
		payButton: 'Pay',
	},
	FEATURES: {
		title: 'What You Get',
	},
	SUCCESS: {
		title: 'Payment Successful!',
		message: 'Your points have been added to your account. You can now enjoy unlimited trivia questions!',
		startPlaying: 'Start Playing',
		backToHome: 'Back to Home',
	},
	LOADING: {
		message: 'Loading point information...',
	},
	VALIDATION: {
		selectPackage: 'Please select a package to continue',
		packageSelected: 'Package selected successfully!',
	},
} as const;

/**
 * Points pricing tiers
 * @constant
 * @description Available point packages and pricing
 * @used_by server/src/features/points/points.service.ts, client/src/services/api.service.ts
 */
export const POINTS_PRICING_TIERS = [
	{ points: 50, price: 4.99, pricePerPoint: 0.0998 },
	{ points: 100, price: 8.99, pricePerPoint: 0.0899 },
	{ points: 250, price: 19.99, pricePerPoint: 0.07996 },
	{ points: 500, price: 34.99, pricePerPoint: 0.06998 },
	{ points: 1000, price: 59.99, pricePerPoint: 0.05999 },
] as const;
