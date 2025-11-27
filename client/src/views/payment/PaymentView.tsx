import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import {
	BillingCycle,
	CONTACT_INFO,
	PaymentMethod,
	PaymentStatus,
	PlanType,
	VALID_GAME_MODES,
} from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type {
	CreditPurchaseOption,
	SubscriptionData,
	SubscriptionPlans as SubscriptionPlansType,
	ValidationStatus,
} from '@shared/types';
import { formatCurrency, getErrorMessage, isSubscriptionData, isSubscriptionPlans } from '@shared/utils';

import {
	Button,
	Card,
	CardContent,
	CardGrid,
	CardHeader,
	CardTitle,
	Container,
	createStaggerContainer,
	fadeInDown,
	fadeInRight,
	fadeInUp,
	GridLayout,
	Icon,
	scaleIn,
	slideInUp,
	SubscriptionPlans,
	ValidationMessage,
} from '../../components';
import {
	AudioKey,
	ButtonVariant,
	CardVariant,
	ComponentSize,
	ContainerSize,
	PAYMENT_CONTENT,
	PAYMENT_FEATURES,
	Spacing,
} from '../../constants';
import {
	useAppDispatch,
	useAppSelector,
	useCancelSubscription,
	useCreateSubscription,
	useCreditBalance,
	useCreditPackages,
	useDebouncedCallback,
	usePurchaseCredits,
} from '../../hooks';
import { selectUserCreditBalance } from '../../redux/selectors';
import { setCreditBalance } from '../../redux/slices';
import { audioService, creditsService, storageService } from '../../services';
import type { CreditsPurchaseResponse, ManualPaymentPayload } from '../../types';

export default function PaymentView() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const creditBalance = useAppSelector(selectUserCreditBalance);

	// Use custom hooks for data fetching
	const { data: balanceData, isLoading: balanceLoading } = useCreditBalance();
	const { data: packages, isLoading: packagesLoading } = useCreditPackages();
	const purchaseMutation = usePurchaseCredits();
	const createSubscription = useCreateSubscription();
	const cancelSubscription = useCancelSubscription();

	const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
	const [purchasing, setPurchasing] = useState(false);
	const [success, setSuccess] = useState(false);
	const [purchaseStatus, setPurchaseStatus] = useState<ValidationStatus>('idle');
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MANUAL_CREDIT);
	const [cardNumber, setCardNumber] = useState('');
	const [expiryDate, setExpiryDate] = useState('');
	const [cvv, setCvv] = useState('');
	const [cardHolderName, setCardHolderName] = useState('');
	const [postalCode, setPostalCode] = useState('');
	const [pendingReference, setPendingReference] = useState<string | null>(null);
	const [paypalLoading, setPaypalLoading] = useState(false);
	const [paypalError, setPaypalError] = useState<string | null>(null);

	const parseExpiryDateParts = useCallback((value: string): { month: number; year: number } => {
		const [monthPart, yearPart] = value.split('/');
		const monthValue = parseInt((monthPart ?? '').trim(), 10);
		const yearDigits = parseInt((yearPart ?? '').trim(), 10);
		const yearValue = Number.isNaN(yearDigits) ? 0 : 2000 + yearDigits;
		return {
			month: Number.isNaN(monthValue) ? 0 : monthValue,
			year: yearValue,
		};
	}, []);

	const buildManualPaymentPayload = useCallback((): ManualPaymentPayload | null => {
		const sanitizedCardNumber = cardNumber.replace(/\s+/g, '');
		if (!sanitizedCardNumber || !expiryDate || !cvv || !cardHolderName) {
			return null;
		}

		const { month, year } = parseExpiryDateParts(expiryDate);

		return {
			cardNumber: sanitizedCardNumber,
			expiryMonth: month,
			expiryYear: year,
			cvv: cvv.trim(),
			cardHolderName: cardHolderName.trim(),
			postalCode: postalCode.trim() || undefined,
			expiryDate,
		};
	}, [cardNumber, cardHolderName, cvv, expiryDate, parseExpiryDateParts, postalCode]);

	const applySuccessfulPurchase = useCallback(
		(result: CreditsPurchaseResponse) => {
			setSuccess(true);
			setPurchasing(false);
			setPurchaseStatus('valid');
			setPendingReference(null);
			setPaypalError(null);

			if (result.balance) {
				dispatch(
					setCreditBalance({
						balance: result.balance.balance ?? result.balance.totalCredits ?? 0,
						purchasedCredits: result.balance.purchasedCredits ?? 0,
						freeQuestions: result.balance.freeQuestions ?? 0,
						lastUpdated: new Date().toISOString(),
						dailyLimit: result.balance.dailyLimit,
						nextResetTime: result.balance.nextResetTime,
					})
				);
			}

			audioService.play(AudioKey.SUCCESS);
		},
		[audioService, dispatch]
	);

	const handlePurchaseSuccess = useCallback(
		(result: CreditsPurchaseResponse) => {
			if (result.status === PaymentStatus.COMPLETED) {
				applySuccessfulPurchase(result);
				return;
			}

			setPurchasing(false);

			if (result.status === PaymentStatus.REQUIRES_CAPTURE) {
				setPurchaseStatus('warning');
				setPendingReference(
					result.manualCaptureReference
						? `Payment recorded and pending manual capture. Reference: ${result.manualCaptureReference}`
						: 'Payment recorded and pending manual capture.'
				);
				return;
			}

			setPurchaseStatus('invalid');
		},
		[applySuccessfulPurchase]
	);

	const handlePurchaseError = useCallback(
		(error: unknown) => {
			setPurchasing(false);
			setPurchaseStatus('invalid');
			const message = getErrorMessage(error);
			logger.paymentFailed('credits_purchase', message, {
				id: selectedPackage ?? 'unknown',
			});
			audioService.play(AudioKey.ERROR);
		},
		[audioService, logger, selectedPackage]
	);

	const loadPayPalSdk = useCallback(async (): Promise<void> => {
		if (window.paypal) {
			return;
		}

		await new Promise<void>((resolve, reject) => {
			const existingScript = document.querySelector<HTMLScriptElement>('script[src*="paypal.com"]');
			if (existingScript) {
				existingScript.addEventListener('load', () => resolve(), { once: true });
				existingScript.addEventListener('error', () => reject(new Error('Failed to load PayPal SDK')), { once: true });
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD';
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
			document.head.appendChild(script);
		});
	}, []);

	const handlePayPalPurchase = useCallback(
		async (packageId: string) => {
			try {
				setPurchaseStatus('validating');
				setPurchasing(true);
				setPaypalLoading(true);
				setPaypalError(null);
				setPendingReference(null);

				const initialResult = await creditsService.purchaseCredits({
					packageId,
					paymentMethod: PaymentMethod.PAYPAL,
				});

				if (initialResult.status === PaymentStatus.COMPLETED) {
					applySuccessfulPurchase(initialResult);
					return;
				}

				if (!initialResult.paypalOrderRequest) {
					throw new Error('PayPal configuration is unavailable.');
				}

				await loadPayPalSdk();

				if (!window.paypal) {
					throw new Error('PayPal SDK unavailable');
				}

				// PayPal button will be rendered and handle the payment flow
				// The order ID will be captured when user approves the payment
				setPurchaseStatus('warning');
				setPaypalError('PayPal payment requires user approval.');
				setPurchasing(false);
			} catch (error) {
				handlePurchaseError(error);
				setPaypalError(getErrorMessage(error));
			} finally {
				setPaypalLoading(false);
			}
		},
		[applySuccessfulPurchase, loadPayPalSdk, handlePurchaseError, creditsService]
	);

	const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlansType | null>(null);
	const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(true);
	const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
	const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);

	// Debounced package selection
	const debouncedPackageSelect = useDebouncedCallback((packageId: string) => {
		setSelectedPackage(packageId);
	}, 300);

	const handlePackageSelect = (packageId: string) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		debouncedPackageSelect.debounced(packageId);
		setPendingReference(null);
		setPurchaseStatus('idle');
		setPaypalError(null);

		logger.gameTarget('Package selected', {
			id: packageId,
			gameModes: VALID_GAME_MODES,
			timestamp: new Date().toISOString(),
		});
	};

	// Update Redux state when balance data changes
	useEffect(() => {
		if (balanceData) {
			dispatch(
				setCreditBalance({
					credits: 0,
					balance: balanceData.totalCredits,
					purchasedCredits: balanceData.purchasedCredits,
					freeQuestions: balanceData.freeQuestions,
					// Store as ISO string for Redux serializability
					lastUpdated: new Date().toISOString(),
				})
			);
		}
	}, [balanceData, dispatch]);

	useEffect(() => {
		const fetchSubscriptionStatus = async () => {
			try {
				const storedSubscription = await storageService.get('current_subscription', isSubscriptionData);
				if (storedSubscription && storedSubscription.success && storedSubscription.data) {
					setCurrentSubscription(storedSubscription.data);
				}
			} catch (err) {
				logger.payment('Failed to fetch current subscription status', {
					error: getErrorMessage(err),
				});
			}
		};

		const fetchSubscriptionPlans = async () => {
			setSubscriptionPlansLoading(true);
			try {
				const plans = await storageService.get('subscription_plans', isSubscriptionPlans);
				if (plans && plans.success && plans.data) {
					setSubscriptionPlans(plans.data);
				}
			} catch (err) {
				logger.payment('Failed to fetch subscription plans', { error: getErrorMessage(err) });
			} finally {
				setSubscriptionPlansLoading(false);
			}
		};

		fetchSubscriptionStatus();
		fetchSubscriptionPlans();
	}, []);

	// Memoize features array to avoid recreation on every render
	const features = useMemo(
		() => [
			{
				icon: (
					<Icon
						name={PAYMENT_FEATURES.UNLIMITED_QUESTIONS.icon}
						size={ComponentSize.XXL}
						color={PAYMENT_FEATURES.UNLIMITED_QUESTIONS.color}
					/>
				),
				title: PAYMENT_FEATURES.UNLIMITED_QUESTIONS.title,
				description: `${PAYMENT_FEATURES.UNLIMITED_QUESTIONS.description} ${CONTACT_INFO.features[1]}. ${CONTACT_INFO.features[3]}.`,
			},
			{
				icon: (
					<Icon
						name={PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.icon}
						size={ComponentSize.XXL}
						color={PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.color}
					/>
				),
				title: PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.title,
				description: `${PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.description} ${CONTACT_INFO.features[0]}. ${CONTACT_INFO.features[2]}.`,
			},
			{
				icon: (
					<Icon
						name={PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.icon}
						size={ComponentSize.XXL}
						color={PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.color}
					/>
				),
				title: PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.title,
				description: PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.description,
			},
			{
				icon: (
					<Icon name={PAYMENT_FEATURES.SUPPORT.icon} size={ComponentSize.XXL} color={PAYMENT_FEATURES.SUPPORT.color} />
				),
				title: PAYMENT_FEATURES.SUPPORT.title,
				description: `${PAYMENT_FEATURES.SUPPORT.description} ${CONTACT_INFO.tagline}. Contact us at ${CONTACT_INFO.email}.`,
			},
		],
		[]
	);

	const handlePurchase = useCallback(() => {
		if (!selectedPackage) {
			audioService.play(AudioKey.ERROR);
			setPurchaseStatus('invalid');
			return;
		}

		if (paymentMethod === PaymentMethod.PAYPAL) {
			void handlePayPalPurchase(selectedPackage);
			return;
		}

		const manualPayment = buildManualPaymentPayload();
		if (!manualPayment) {
			audioService.play(AudioKey.ERROR);
			setPurchaseStatus('invalid');
			return;
		}

		setPurchasing(true);
		setPurchaseStatus('validating');
		setPendingReference(null);
		setPaypalError(null);

		purchaseMutation.mutate(
			{
				packageId: selectedPackage,
				paymentMethod: PaymentMethod.MANUAL_CREDIT,
				manualPayment,
			},
			{
				onSuccess: handlePurchaseSuccess,
				onError: handlePurchaseError,
			}
		);
	}, [
		audioService,
		buildManualPaymentPayload,
		handlePayPalPurchase,
		handlePurchaseError,
		handlePurchaseSuccess,
		paymentMethod,
		purchaseMutation,
		selectedPackage,
	]);

	if (balanceLoading || packagesLoading) {
		return (
			<main
				role='main'
				aria-label='Payment Loading'
				className='min-h-screen pt-20 pb-12 px-4 flex items-center justify-center'
			>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
					<p className='text-slate-300'>{PAYMENT_CONTENT.LOADING.message}</p>
				</div>
			</main>
		);
	}

	if (success) {
		return (
			<main
				role='main'
				aria-label='Payment Success'
				className='min-h-screen pt-20 pb-12 px-4 flex items-center justify-center'
			>
				<motion.article
					variants={scaleIn}
					initial='hidden'
					animate='visible'
					className='text-center max-w-md'
					whileHover={{ scale: 1.02 }}
					aria-label='Payment Success Message'
				>
					<div className='w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6'>
						<Icon name='checkcircle' size={ComponentSize.XL} color='white' />
					</div>
					<h2 className='text-3xl font-bold gradient-text mb-4'>{PAYMENT_CONTENT.SUCCESS.title}</h2>
					<p className='text-slate-300 text-lg mb-8'>{PAYMENT_CONTENT.SUCCESS.message}</p>

					<Card variant={CardVariant.GLASS} className='mb-8'>
						<CardHeader>
							<CardTitle className='text-lg font-semibold text-white'>Updated Balance</CardTitle>
						</CardHeader>
						<CardContent>
							<div className='space-y-2 text-left text-slate-300'>
								<div className='flex justify-between'>
									<span>Total Credits:</span>
									<span className='font-semibold text-white'>{creditBalance?.totalCredits ?? 0}</span>
								</div>
								<div className='flex justify-between'>
									<span>Free Questions:</span>
									<span className='text-green-400'>{creditBalance?.freeQuestions ?? 0}</span>
								</div>
								<div className='flex justify-between'>
									<span>Purchased Credits:</span>
									<span className='text-blue-400'>{creditBalance?.purchasedCredits ?? 0}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className='space-y-3'>
						<motion.section
							variants={fadeInRight}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.2 }}
							aria-label='Action Buttons'
						>
							<Button
								onClick={() => {
									audioService.play(AudioKey.GAME_START);
									navigate('/');
								}}
								variant={ButtonVariant.PRIMARY}
								size={ComponentSize.LG}
								className='w-full max-w-sm bg-gradient-to-r from-blue-500 to-purple-500'
							>
								{PAYMENT_CONTENT.SUCCESS.startPlaying}
							</Button>
						</motion.section>
						<motion.section
							variants={fadeInRight}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.4 }}
							aria-label='Additional Actions'
						>
							<Button
								onClick={() => {
									audioService.play(AudioKey.BUTTON_CLICK);
									navigate('/');
								}}
								variant={ButtonVariant.GHOST}
								size={ComponentSize.LG}
								className='w-full max-w-sm text-slate-300'
							>
								{PAYMENT_CONTENT.SUCCESS.backToHome}
							</Button>
						</motion.section>
					</div>
				</motion.article>
			</main>
		);
	}

	const [activeTab, setActiveTab] = useState<'credits' | 'subscription'>('credits');

	return (
		<main role='main' aria-label='Payment'>
			<Container size={ContainerSize.XL} className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'>
				<Card variant={CardVariant.TRANSPARENT} padding={Spacing.XL} className='w-full space-y-8'>
					{/* Header */}
					<motion.header
						variants={fadeInDown}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.2 }}
						className='text-center mb-12'
					>
						<h1 className='text-5xl font-bold text-white mb-4 gradient-text'>{PAYMENT_CONTENT.HEADER.title}</h1>
						<p className='text-xl text-slate-300'>{PAYMENT_CONTENT.HEADER.subtitle}</p>
					</motion.header>

					{/* Tabs */}
					<motion.nav
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='mb-8'
						aria-label='Payment Options Navigation'
					>
						<div className='flex justify-center'>
							<div className='bg-slate-800/60 rounded-lg p-1 border border-white/10'>
								<button
									onClick={() => setActiveTab('credits')}
									className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
										activeTab === 'credits' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white'
									}`}
								>
									<Icon name='zap' size={ComponentSize.SM} className='mr-2 inline' />
									Credits Packages
								</button>
								<button
									onClick={() => setActiveTab('subscription')}
									className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
										activeTab === 'subscription' ? 'bg-blue-500 text-white' : 'text-slate-300 hover:text-white'
									}`}
								>
									<Icon name='star' size={ComponentSize.SM} className='mr-2 inline' />
									Subscription Plans
								</button>
							</div>
						</div>
					</motion.nav>

					{/* Subscription Management */}
					{activeTab === 'subscription' && (
						<motion.section
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.4 }}
							className='mb-8'
							aria-label='Subscription Management'
						>
							<Card variant={CardVariant.GLASS}>
								<CardHeader>
									<div className='flex justify-between items-center'>
										<CardTitle className='text-2xl font-bold text-white'>Subscription Management</CardTitle>
										<Button
											variant={ButtonVariant.SECONDARY}
											onClick={() => setShowSubscriptionManagement(!showSubscriptionManagement)}
											className='bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30'
										>
											{showSubscriptionManagement ? 'Hide' : 'Manage'}
										</Button>
									</div>
								</CardHeader>

								{showSubscriptionManagement && (
									<CardContent>
										<div className='space-y-4'>
											{currentSubscription && currentSubscription.subscriptionId ? (
												<Card
													variant={CardVariant.TRANSPARENT}
													className='border border-green-400/30 bg-green-500/10'
													padding={Spacing.LG}
												>
													<CardHeader>
														<CardTitle className='text-lg font-semibold text-green-300'>Active Subscription</CardTitle>
													</CardHeader>
													<CardContent>
														<GridLayout variant='balanced' gap={Spacing.MD} className='text-sm'>
															<div>
																<span className='text-slate-400'>Plan:</span>
																<span className='text-white ml-2'>
																	{String(currentSubscription.planType || 'Unknown')}
																</span>
															</div>
															<div>
																<span className='text-slate-400'>Status:</span>
																<span className='text-green-400 ml-2'>
																	{String(currentSubscription.status || 'Unknown')}
																</span>
															</div>
															<div>
																<span className='text-slate-400'>Next Billing:</span>
																<span className='text-white ml-2'>
																	{String(currentSubscription.nextBillingDate || 'Unknown')}
																</span>
															</div>
														</GridLayout>
														<div className='mt-4 flex gap-2'>
															<Button
																variant={ButtonVariant.SECONDARY}
																onClick={() => cancelSubscription.mutate()}
																disabled={cancelSubscription.isPending}
																className='bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30'
															>
																{cancelSubscription.isPending ? 'Canceling...' : 'Cancel Subscription'}
															</Button>
														</div>
													</CardContent>
												</Card>
											) : (
												<Card
													variant={CardVariant.TRANSPARENT}
													className='border border-slate-400/30 bg-slate-500/10'
													padding={Spacing.LG}
												>
													<CardHeader>
														<CardTitle className='text-lg font-semibold text-slate-300'>
															No Active Subscription
														</CardTitle>
													</CardHeader>
													<CardContent>
														<p className='text-slate-400 text-sm mb-4'>
															Subscribe to unlock unlimited questions and premium features.
														</p>
														<Button
															variant={ButtonVariant.PRIMARY}
															onClick={() =>
																createSubscription.mutate({
																	plan: PlanType.PREMIUM,
																	billingCycle: BillingCycle.MONTHLY,
																})
															}
															disabled={createSubscription.isPending}
															className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
														>
															{createSubscription.isPending ? 'Creating...' : 'Start Premium Subscription'}
														</Button>
													</CardContent>
												</Card>
											)}
										</div>
									</CardContent>
								)}
							</Card>
						</motion.section>
					)}

					{/* Current Subscription Status */}
					{activeTab === 'subscription' && currentSubscription && currentSubscription.subscriptionId && (
						<motion.section
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							exit='exit'
							className='mb-8'
							aria-label='Current Subscription Status'
						>
							<Card
								variant={CardVariant.TRANSPARENT}
								padding={Spacing.LG}
								className='rounded-lg border border-green-400/30 bg-green-500/20 text-center'
							>
								<Icon name='checkcircle' size={ComponentSize.LG} color='success' className='mx-auto mb-2' />
								<h3 className='text-lg font-semibold text-green-400 mb-1'>
									Active{' '}
									{String(currentSubscription.planType || 'Unknown')
										.charAt(0)
										.toUpperCase() + String(currentSubscription.planType || 'Unknown').slice(1)}{' '}
									Subscription
								</h3>
								<p className='text-green-300 text-sm'>
									Next billing: {new Date(String(currentSubscription.endDate || '')).toLocaleDateString()}
								</p>
							</Card>
						</motion.section>
					)}

					{/* Content based on active tab */}
					{activeTab === 'credits' ? (
						// Credits Packages Content
						<motion.section
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							exit='exit'
							aria-label='Credits Packages'
						>
							{/* Package Selection */}
							<motion.section
								variants={fadeInUp}
								initial='hidden'
								animate='visible'
								transition={{ delay: 0.4 }}
								whileHover={{ scale: 1.01 }}
								aria-label='Package Selection'
							>
								{/* Validation Status */}
								{purchaseStatus === 'validating' && (
									<ValidationMessage status='validating' className='mb-4 text-center' showMessages={true} />
								)}

								{selectedPackage && purchaseStatus === 'valid' && (
									<motion.div
										variants={fadeInRight}
										initial='hidden'
										animate='visible'
										transition={{ delay: 0.1 }}
										role='status'
										aria-live='polite'
									>
										<ValidationMessage
											status='valid'
											successMessage={PAYMENT_CONTENT.VALIDATION.packageSelected}
											className='mb-4 text-center'
											showMessages={true}
										/>
									</motion.div>
								)}

								{!selectedPackage && (
									<ValidationMessage
										status='warning'
										warnings={[PAYMENT_CONTENT.VALIDATION.selectPackage]}
										className='mb-4 text-center'
										showMessages={true}
									/>
								)}

								<CardGrid columns={3} gap={Spacing.LG} className='mb-8'>
									{Array.isArray(packages) && packages.length > 0 ? (
										packages.map((pkg, index) => (
											<motion.article
												key={pkg.id}
												variants={fadeInRight}
												initial='hidden'
												animate='visible'
												transition={{ delay: 0.1 + index * 0.1 }}
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												aria-label={`Package ${pkg.credits} credits for ${pkg.priceDisplay}`}
											>
												<Card
													variant={CardVariant.GLASS}
													className={`relative cursor-pointer transition-all duration-300 ${
														selectedPackage === pkg.id ? 'ring-2 ring-blue-500 bg-blue-500/10' : 'hover:bg-white/5'
													} ${pkg.popular ? 'ring-2 ring-yellow-400' : ''}`}
													onClick={() => handlePackageSelect(pkg.id)}
													padding={Spacing.MD}
												>
													{pkg.popular && (
														<div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
															<div className='bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center'>
																<Icon name='star' size={ComponentSize.SM} color='black' className='mr-1' />
																{PAYMENT_CONTENT.PACKAGES.popularBadge}
															</div>
														</div>
													)}

													<CardContent>
														<div className='text-center'>
															<h3 className='text-2xl font-bold text-white mb-2'>{formatCurrency(pkg.price)}</h3>
															<div className='text-4xl font-bold text-white mb-4'>
																{pkg.credits} {PAYMENT_CONTENT.PACKAGES.credits}
																{pkg.savings && (
																	<span className='text-lg text-green-400 block'>
																		{PAYMENT_CONTENT.PACKAGES.save} {pkg.savings}
																	</span>
																)}
															</div>
															<div className='space-y-3 mb-6'>
																<div className='flex items-center text-slate-300'>
																	<Icon
																		name='checkcircle'
																		size={ComponentSize.SM}
																		color='success'
																		className='mr-3 flex-shrink-0'
																	/>
																	{pkg.credits} {PAYMENT_CONTENT.PACKAGES.features.questions}
																</div>
																<div className='flex items-center text-slate-300'>
																	<Icon
																		name='checkcircle'
																		size={ComponentSize.SM}
																		color='success'
																		className='mr-3 flex-shrink-0'
																	/>
																	{PAYMENT_CONTENT.PACKAGES.features.difficulties}
																</div>
																<div className='flex items-center text-slate-300'>
																	<Icon
																		name='checkcircle'
																		size={ComponentSize.SM}
																		color='success'
																		className='mr-3 flex-shrink-0'
																	/>
																	{PAYMENT_CONTENT.PACKAGES.features.noExpiration}
																</div>
															</div>
															<Button
																variant={selectedPackage === pkg.id ? ButtonVariant.PRIMARY : ButtonVariant.GHOST}
																className={`w-full ${
																	selectedPackage === pkg.id ? 'bg-gradient-to-r from-blue-500 to-purple-500' : ''
																}`}
															>
																{selectedPackage === pkg.id
																	? PAYMENT_CONTENT.PACKAGES.selected
																	: PAYMENT_CONTENT.PACKAGES.selectPlan}
															</Button>
														</div>
													</CardContent>
												</Card>
											</motion.article>
										))
									) : (
										<div className='col-span-full text-center py-12'>
											<Icon name='alerttriangle' size={ComponentSize.XXL} color='warning' className='mx-auto mb-4' />
											<h3 className='text-xl font-semibold text-white mb-2'>
												{PAYMENT_CONTENT.PACKAGES.noPackagesTitle}
											</h3>
											<p className='text-slate-300'>{PAYMENT_CONTENT.PACKAGES.noPackagesMessage}</p>
										</div>
									)}
								</CardGrid>
							</motion.section>
						</motion.section>
					) : (
						// Subscription Plans Content
						<motion.section
							variants={fadeInUp}
							initial='hidden'
							animate='visible'
							exit='exit'
							aria-label='Subscription Plans'
						>
							{subscriptionPlansLoading ? (
								<div className='text-center py-12'>
									<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
									<p className='text-slate-300 mt-4'>Loading subscription plans...</p>
								</div>
							) : subscriptionPlans ? (
								<SubscriptionPlans plans={subscriptionPlans} />
							) : (
								<div className='text-center py-12'>
									<p className='text-slate-300'>Failed to load subscription plans</p>
								</div>
							)}
						</motion.section>
					)}

					{/* Payment Form */}
					{selectedPackage && (
						<motion.div
							variants={slideInUp}
							initial='hidden'
							animate='visible'
							transition={{ delay: 0.6 }}
							whileHover={{ scale: 1.01 }}
						>
							<Card variant={CardVariant.GLASS}>
								<CardHeader>
									<CardTitle className='text-2xl font-bold text-white text-center'>
										{PAYMENT_CONTENT.PAYMENT.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='flex justify-center gap-4 mb-6'>
										<Button
											variant={
												paymentMethod === PaymentMethod.MANUAL_CREDIT ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY
											}
											size={ComponentSize.MD}
											onClick={() => setPaymentMethod(PaymentMethod.MANUAL_CREDIT)}
											disabled={purchasing || paypalLoading}
											className={
												paymentMethod === PaymentMethod.MANUAL_CREDIT
													? 'bg-blue-500 text-white'
													: 'bg-transparent border border-white/20 text-slate-200'
											}
										>
											Manual Credit
										</Button>
										<Button
											variant={paymentMethod === PaymentMethod.PAYPAL ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
											size={ComponentSize.MD}
											onClick={() => setPaymentMethod(PaymentMethod.PAYPAL)}
											disabled={purchasing || paypalLoading}
											className={
												paymentMethod === PaymentMethod.PAYPAL
													? 'bg-blue-500 text-white'
													: 'bg-transparent border border-white/20 text-slate-200'
											}
										>
											PayPal
										</Button>
									</div>

									{paymentMethod === PaymentMethod.MANUAL_CREDIT && (
										<GridLayout variant='form' gap={Spacing.LG}>
											<div>
												<label className='block text-white font-medium mb-2'>
													{PAYMENT_CONTENT.PAYMENT.cardNumber}
												</label>
												<input
													type='text'
													value={cardNumber}
													onChange={event => setCardNumber(event.target.value)}
													placeholder={PAYMENT_CONTENT.PAYMENT.cardNumberPlaceholder}
													className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													disabled={purchasing}
													autoComplete='cc-number'
												/>
											</div>
											<div>
												<label className='block text-white font-medium mb-2'>
													{PAYMENT_CONTENT.PAYMENT.expiryDate}
												</label>
												<input
													type='text'
													value={expiryDate}
													onChange={event => setExpiryDate(event.target.value)}
													placeholder={PAYMENT_CONTENT.PAYMENT.expiryDatePlaceholder}
													className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													disabled={purchasing}
													autoComplete='cc-exp'
												/>
											</div>
											<div>
												<label className='block text-white font-medium mb-2'>{PAYMENT_CONTENT.PAYMENT.cvv}</label>
												<input
													type='text'
													value={cvv}
													onChange={event => setCvv(event.target.value)}
													placeholder={PAYMENT_CONTENT.PAYMENT.cvvPlaceholder}
													className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													disabled={purchasing}
													autoComplete='cc-csc'
												/>
											</div>
											<div>
												<label className='block text-white font-medium mb-2'>
													{PAYMENT_CONTENT.PAYMENT.nameOnCard}
												</label>
												<input
													type='text'
													value={cardHolderName}
													onChange={event => setCardHolderName(event.target.value)}
													placeholder={PAYMENT_CONTENT.PAYMENT.nameOnCardPlaceholder}
													className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													disabled={purchasing}
													autoComplete='cc-name'
												/>
											</div>
											<div>
												<label className='block text-white font-medium mb-2'>Postal Code</label>
												<input
													type='text'
													value={postalCode}
													onChange={event => setPostalCode(event.target.value)}
													placeholder='12345'
													className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
													disabled={purchasing}
													autoComplete='postal-code'
												/>
											</div>
										</GridLayout>
									)}

									{pendingReference && (
										<ValidationMessage
											status='warning'
											warnings={[pendingReference]}
											className='mt-4 text-center'
											showMessages={true}
										/>
									)}

									{paypalError && (
										<ValidationMessage
											status='invalid'
											errors={[paypalError]}
											className='mt-4 text-center'
											showMessages={true}
										/>
									)}

									<div className='mt-8 text-center'>
										<motion.div variants={fadeInRight} initial='hidden' animate='visible' transition={{ delay: 0.2 }}>
											<Button
												variant={ButtonVariant.PRIMARY}
												size={ComponentSize.LG}
												className='w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
												onClick={handlePurchase}
												disabled={purchasing || paypalLoading}
											>
												{purchasing || paypalLoading ? (
													<div className='flex items-center justify-center'>
														<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
														{PAYMENT_CONTENT.PAYMENT.processing}
													</div>
												) : paymentMethod === PaymentMethod.PAYPAL ? (
													'Continue with PayPal'
												) : (
													`${PAYMENT_CONTENT.PAYMENT.payButton} ${formatCurrency(packages?.find((pkg: CreditPurchaseOption) => pkg.id === selectedPackage)?.price ?? 0)}`
												)}
											</Button>
										</motion.div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					)}

					{/* Features Comparison */}
					<motion.div
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.8 }}
						whileHover={{ scale: 1.01 }}
					>
						<Card variant={CardVariant.GLASS}>
							<CardHeader>
								<CardTitle className='text-2xl font-bold text-white text-center'>
									{PAYMENT_CONTENT.FEATURES.title}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<motion.div variants={createStaggerContainer(0.1)} initial='hidden' animate='visible'>
									<GridLayout variant='content' gap={Spacing.LG}>
										{features.map((feature, index) => (
											<motion.div
												key={index}
												variants={fadeInRight}
												custom={index * 0.1}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
											>
												<div className='text-center'>
													<div className='text-4xl mb-4'>{feature.icon}</div>
													<h3 className='text-xl font-semibold text-white mb-2'>{feature.title}</h3>
													<p className='text-slate-300'>{feature.description}</p>
												</div>
											</motion.div>
										))}
									</GridLayout>
								</motion.div>
							</CardContent>
						</Card>
					</motion.div>
				</Card>
			</Container>
		</main>
	);
}
