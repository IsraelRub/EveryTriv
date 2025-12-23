/**
 * Client-side payment UI constants
 *
 * @module ClientPaymentUIConstants
 * @description Payment-related UI constants for client-side use
 * @used_by client/src/views/payment, client/src/components
 */

/**
 * Payment page features and content
 * @constant
 * @description Features displayed on the payment page
 * @used_by client/src/views/payment
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
 * @used_by client/src/views/payment
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
		credits: 'Credits',
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
		message: 'Your credits have been added to your account. You can now enjoy unlimited trivia questions!',
		startPlaying: 'Start Playing',
		backToHome: 'Back to Home',
	},
	LOADING: {
		message: 'Loading credit information...',
	},
	VALIDATION: {
		selectPackage: 'Please select a package to continue',
		packageSelected: 'Package selected successfully!',
	},
} as const;
