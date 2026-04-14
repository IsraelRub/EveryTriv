import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle, Coins, Play, Wallet } from 'lucide-react';

import {
	AnalyticsAction,
	AnalyticsEventType,
	AnalyticsPageName,
	CREDIT_PURCHASE_PACKAGES,
	EMPTY_VALUE,
	PaymentStatus,
} from '@shared/constants';
import type { CreditPurchaseOption } from '@shared/types';
import { formatCurrency } from '@shared/utils';

import {
	LoadingKey,
	PaymentKey,
	PaymentTab,
	SEMANTIC_ICON_TEXT,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	TabsListVariant,
	VariantBase,
} from '@/constants';
import { cn, repeat } from '@/utils';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	PaymentDialog,
	Skeleton,
	Tabs,
	TabsContent,
} from '@/components';
import { TabsBar } from '@/components/layout';
import {
	useCreditBalance,
	useCreditPackages,
	useNavigationClose,
	usePaymentHistory,
	useTrackAnalyticsEvent,
} from '@/hooks';

function formatPricePerCredit(value: number): string {
	if (!Number.isFinite(value) || value <= 0) {
		return '$0.00';
	}
	if (value < 0.01) {
		return `$${value.toFixed(4)}`;
	}
	if (value < 0.1) {
		return `$${value.toFixed(3)}`;
	}
	return `$${value.toFixed(2)}`;
}

function paymentStatusLabelKey(status: string): PaymentKey | null {
	switch (status) {
		case PaymentStatus.COMPLETED:
			return PaymentKey.STATUS_COMPLETED;
		case PaymentStatus.FAILED:
			return PaymentKey.STATUS_FAILED;
		case PaymentStatus.PENDING:
			return PaymentKey.STATUS_PENDING;
		case PaymentStatus.REQUIRES_ACTION:
			return PaymentKey.STATUS_REQUIRES_ACTION;
		case PaymentStatus.REQUIRES_CAPTURE:
			return PaymentKey.STATUS_REQUIRES_CAPTURE;
		default:
			return null;
	}
}

function BalanceCard({ balance, isLoading, t }: { balance: number; isLoading: boolean; t: (key: string) => string }) {
	return (
		<Card className='w-fit border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5'>
			<CardHeader className='pb-2 text-center'>
				<CardTitle className='flex items-center justify-center gap-2 text-lg'>
					<Wallet className='h-5 w-5 text-primary' />
					{t(PaymentKey.YOUR_BALANCE)}
				</CardTitle>
			</CardHeader>
			<CardContent className='text-center'>
				{!isLoading ? (
					<div className='flex items-baseline justify-center gap-2'>
						<span className='text-4xl font-bold text-primary'>{balance}</span>
						<span className='text-muted-foreground'>{t(PaymentKey.CREDITS)}</span>
					</div>
				) : (
					<Skeleton variant={SkeletonVariant.Input} className='mx-auto' />
				)}
			</CardContent>
		</Card>
	);
}

function CreditPackageCard({
	pkg,
	onPurchase,
	isPurchasing,
	isBestValue,
	t,
}: {
	pkg: CreditPurchaseOption;
	onPurchase: () => void;
	isPurchasing: boolean;
	isBestValue: boolean;
	t: (key: string, opts?: { count?: number }) => string;
}) {
	const hasBonus = pkg.bonus && pkg.bonus > 0;

	return (
		<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
			<Card className='relative overflow-hidden'>
				{isBestValue && (
					<div className='absolute top-0 start-0'>
						<Badge className='rounded-none rounded-ee-lg bg-primary text-primary-foreground'>
							{t(PaymentKey.BEST_VALUE)}
						</Badge>
					</div>
				)}
				{hasBonus && (
					<div className='absolute top-0 end-0'>
						<Badge className='rounded-none rounded-bl-lg bg-success text-white'>
							+{pkg.bonus} {t(PaymentKey.BONUS)}
						</Badge>
					</div>
				)}
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Coins className='h-5 w-5 text-primary' />
						{pkg.description ?? t(PaymentKey.CREDITS_PACKAGE, { count: pkg.credits })}
					</CardTitle>
					{hasBonus && (
						<CardDescription>
							<span className={SEMANTIC_ICON_TEXT.success}>{t(PaymentKey.BONUS_CREDITS, { count: pkg.bonus })}</span>
						</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<div className='text-3xl font-bold'>{pkg.priceDisplay}</div>
					<p className='text-sm text-muted-foreground mt-1'>
						{formatPricePerCredit(pkg.pricePerCredit)} {t(PaymentKey.PER_CREDIT)}
					</p>
				</CardContent>
				<CardFooter>
					<Button className='w-full' onClick={onPurchase} disabled={isPurchasing}>
						{!isPurchasing ? t(PaymentKey.PURCHASE) : t(LoadingKey.PROCESSING)}
					</Button>
				</CardFooter>
			</Card>
		</motion.div>
	);
}

export function PaymentView() {
	const { t } = useTranslation(['payment', 'loading']);
	const { handleClose } = useNavigationClose();
	const [selectedPackage, setSelectedPackage] = useState<CreditPurchaseOption | null>(null);
	const [showPaymentDialog, setShowPaymentDialog] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [purchasedCredits, setPurchasedCredits] = useState(0);
	const [postPurchaseTotalCredits, setPostPurchaseTotalCredits] = useState<number | null>(null);

	const { data: creditBalance, isLoading: balanceLoading, refetch: refetchCreditBalance } = useCreditBalance();
	const { data: creditPackages, isLoading: packagesLoading } = useCreditPackages();
	const { data: paymentHistory, isLoading: paymentHistoryLoading } = usePaymentHistory();
	const trackAnalyticsEvent = useTrackAnalyticsEvent();

	const balance = creditBalance?.totalCredits ?? 0;

	// Use packages from API or fallback to shared constants
	const packages: CreditPurchaseOption[] =
		creditPackages ??
		CREDIT_PURCHASE_PACKAGES.map(pkg => ({
			id: pkg.id,
			credits: pkg.credits,
			price: pkg.price,
			priceDisplay: pkg.priceDisplay,
			pricePerCredit: pkg.pricePerCredit,
			description: t(PaymentKey.CREDITS_PACKAGE, { count: pkg.credits }),
		}));

	const bestValuePackageId = useMemo((): string | null => {
		const first = packages[0];
		if (first == null) {
			return null;
		}
		let best = first;
		for (const p of packages) {
			if (p.pricePerCredit < best.pricePerCredit) {
				best = p;
			}
		}
		return best.id;
	}, [packages]);

	// Track page view analytics
	useEffect(() => {
		trackAnalyticsEvent.mutate({
			eventType: AnalyticsEventType.PAGE_VIEW,
			page: AnalyticsPageName.PAYMENT,
			action: AnalyticsAction.VIEW,
		});
	}, [trackAnalyticsEvent]);

	const handlePaymentSuccess = useCallback(
		async (credits: number) => {
			setPurchasedCredits(credits);
			const refetched = await refetchCreditBalance();
			const nextTotal = refetched.data?.totalCredits ?? (creditBalance?.totalCredits ?? 0) + credits;
			setPostPurchaseTotalCredits(nextTotal);
			setShowSuccessDialog(true);
			// Track analytics event for purchase
			if (selectedPackage) {
				trackAnalyticsEvent.mutate({
					eventType: AnalyticsEventType.PURCHASE_CREDITS,
					page: AnalyticsPageName.PAYMENT,
					action: AnalyticsAction.PURCHASE_SUCCESS,
					value: selectedPackage.price,
					properties: {
						packageId: selectedPackage.id,
						credits: credits,
						price: selectedPackage.price,
					},
				});
			}
		},
		[creditBalance?.totalCredits, refetchCreditBalance, selectedPackage, trackAnalyticsEvent]
	);

	const handleSuccessDialogOpenChange = useCallback((open: boolean) => {
		setShowSuccessDialog(open);
		if (!open) {
			setPostPurchaseTotalCredits(null);
		}
	}, []);

	return (
		<div className='view-centered-6xl h-full flex flex-col'>
			<Card className='flex-1 flex flex-col overflow-hidden'>
				<CardHeader className='flex-shrink-0'>
					<CardTitle className='text-3xl md:text-4xl font-bold text-center mb-1 md:mb-2'>
						{t(PaymentKey.CREDITS_PAGE_TITLE)}
					</CardTitle>
					<CardDescription className='text-center text-sm md:text-base'>
						{t(PaymentKey.GET_CREDITS_TO_PLAY)}
					</CardDescription>
					<p className='text-center text-xs text-muted-foreground max-w-2xl mx-auto mt-2'>
						{t(PaymentKey.CREDITS_VALUE_EXPLAINER)}
					</p>
				</CardHeader>
				<CardContent className='view-spacing-lg view-scroll-inline'>
					{/* Balance Card */}
					<div className='flex justify-center'>
						<BalanceCard balance={balance} isLoading={balanceLoading} t={t} />
					</div>

					<Tabs defaultValue={PaymentTab.CREDITS} className='w-full flex-1 flex flex-col overflow-hidden min-h-0'>
						<TabsBar
							items={[
								{ value: PaymentTab.CREDITS, label: t(PaymentKey.BUY_CREDITS) },
								{ value: PaymentTab.PAYMENT_HISTORY, label: t(PaymentKey.PAYMENT_HISTORY) },
							]}
							variant={TabsListVariant.COMPACT}
						/>

						<TabsContent
							value={PaymentTab.CREDITS}
							className='mt-4 md:mt-6 lg:mt-8 flex-1 overflow-y-auto min-h-[320px] w-full'
						>
							{packagesLoading ? (
								<div className='grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden'>
									{repeat(SKELETON_PLACEHOLDER_COUNTS.MEDIUM, i => (
										<Card key={i} className='overflow-hidden'>
											<CardHeader className='overflow-hidden'>
												<Skeleton variant={SkeletonVariant.TextLargeNarrow} className='max-w-full' />
												<Skeleton variant={SkeletonVariant.TextLine} className='max-w-full' />
											</CardHeader>
											<CardContent className='overflow-hidden'>
												<Skeleton variant={SkeletonVariant.InputSmall} className='max-w-full' />
											</CardContent>
											<CardFooter className='overflow-hidden'>
												<Skeleton variant={SkeletonVariant.InputFull} className='max-w-full' />
											</CardFooter>
										</Card>
									))}
								</div>
							) : (
								<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
									{packages.map(pkg => (
										<CreditPackageCard
											key={pkg.id}
											pkg={pkg}
											t={t}
											isBestValue={bestValuePackageId != null && pkg.id === bestValuePackageId}
											onPurchase={() => {
												setSelectedPackage(pkg);
												setShowPaymentDialog(true);
											}}
											isPurchasing={false}
										/>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent
							value={PaymentTab.PAYMENT_HISTORY}
							className='mt-4 md:mt-6 lg:mt-8 flex-1 overflow-y-auto min-h-[320px] w-full'
						>
							<div className='w-full'>
								{paymentHistoryLoading ? (
									<Card>
										<CardHeader>
											<CardTitle>{t(PaymentKey.PAYMENT_HISTORY)}</CardTitle>
										</CardHeader>
										<CardContent>
											<div className='space-y-4'>
												<Skeleton variant={SkeletonVariant.Row} count={SKELETON_PLACEHOLDER_COUNTS.MEDIUM} />
											</div>
										</CardContent>
									</Card>
								) : paymentHistory && paymentHistory.length > 0 ? (
									<Card>
										<CardHeader>
											<CardTitle>{t(PaymentKey.PAYMENT_HISTORY)}</CardTitle>
											<CardDescription>{t(PaymentKey.YOUR_PAYMENT_TRANSACTION_HISTORY)}</CardDescription>
										</CardHeader>
										<CardContent>
											<div className='space-y-4'>
												{paymentHistory.map((payment, index) => (
													<Card
														key={payment.paymentId ?? payment.transactionId ?? `payment-${index}`}
														className='border'
													>
														<CardContent className='pt-6'>
															<div className='flex justify-between items-start'>
																<div className='space-y-1'>
																	<p className='font-medium'>
																		{payment.amount != null
																			? formatCurrency(payment.amount, payment.currency ?? 'USD')
																			: EMPTY_VALUE}
																	</p>
																	<p className='text-sm text-muted-foreground'>{payment.paymentMethod}</p>
																	{payment.message && (
																		<p className='text-sm text-muted-foreground'>{payment.message}</p>
																	)}
																</div>
																<Badge
																	variant={
																		payment.status === PaymentStatus.COMPLETED
																			? VariantBase.DEFAULT
																			: payment.status === PaymentStatus.FAILED
																				? VariantBase.DESTRUCTIVE
																				: VariantBase.SECONDARY
																	}
																>
																	{(() => {
																		const labelKey = paymentStatusLabelKey(payment.status);
																		return labelKey ? t(labelKey) : payment.status;
																	})()}
																</Badge>
															</div>
														</CardContent>
													</Card>
												))}
											</div>
										</CardContent>
									</Card>
								) : (
									<Card>
										<CardHeader>
											<CardTitle>{t(PaymentKey.PAYMENT_HISTORY)}</CardTitle>
											<CardDescription>{t(PaymentKey.YOUR_PAYMENT_TRANSACTION_HISTORY)}</CardDescription>
										</CardHeader>
										<CardContent>
											<p className='text-center text-muted-foreground py-8'>{t(PaymentKey.NO_PAYMENT_HISTORY_FOUND)}</p>
										</CardContent>
									</Card>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Payment Dialog */}
			{selectedPackage && (
				<PaymentDialog
					open={showPaymentDialog}
					onOpenChange={setShowPaymentDialog}
					package={selectedPackage}
					onSuccess={handlePaymentSuccess}
				/>
			)}

			{/* Success Dialog */}
			<Dialog open={showSuccessDialog} onOpenChange={handleSuccessDialogOpenChange}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className={cn('flex items-center gap-2', SEMANTIC_ICON_TEXT.success)}>
							<CheckCircle className='w-6 h-6' />
							{t(PaymentKey.PURCHASE_COMPLETE)}
						</DialogTitle>
						<DialogDescription>{t(PaymentKey.CREDITS_ADDED_TO_ACCOUNT)}</DialogDescription>
					</DialogHeader>
					<div className='py-6'>
						<div className='flex flex-col items-center text-center space-y-4'>
							<div className={cn('p-4 rounded-full', 'bg-success/10')}>
								<Wallet className={cn('w-12 h-12', SEMANTIC_ICON_TEXT.success)} />
							</div>
							<div>
								<p className='text-lg font-medium'>
									<span className='text-3xl font-bold text-primary'>+{purchasedCredits}</span>
									<span className='text-muted-foreground ms-2'>{t(PaymentKey.CREDITS_ADDED)}</span>
								</p>
								<p className='text-sm text-muted-foreground mt-2'>
									{t(PaymentKey.NEW_BALANCE)}{' '}
									<span className='font-semibold text-foreground'>
										{postPurchaseTotalCredits ?? balance + purchasedCredits}
									</span>{' '}
									{t(PaymentKey.CREDITS)}
								</p>
							</div>
						</div>
					</div>
					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => handleSuccessDialogOpenChange(false)}>
							{t(PaymentKey.STAY_HERE)}
						</Button>
						<Button
							onClick={() => {
								handleSuccessDialogOpenChange(false);
								handleClose();
							}}
						>
							<Play className='w-4 h-4 me-2' />
							{t(PaymentKey.PLAY_NOW)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
