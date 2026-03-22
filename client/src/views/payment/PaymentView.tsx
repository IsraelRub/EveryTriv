import { useEffect, useState } from 'react';
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
	Colors,
	LoadingKey,
	PaymentKey,
	PaymentTab,
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
				{isLoading ? (
					<Skeleton variant={SkeletonVariant.Input} className='mx-auto' />
				) : (
					<div className='flex items-baseline justify-center gap-2'>
						<span className='text-4xl font-bold text-primary'>{balance}</span>
						<span className='text-muted-foreground'>{t(PaymentKey.CREDITS)}</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function CreditPackageCard({
	pkg,
	onPurchase,
	isPurchasing,
	t,
}: {
	pkg: CreditPurchaseOption;
	onPurchase: () => void;
	isPurchasing: boolean;
	t: (key: string, opts?: { count?: number }) => string;
}) {
	const hasBonus = pkg.bonus && pkg.bonus > 0;

	return (
		<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
			<Card className='relative overflow-hidden'>
				{hasBonus && (
					<div className='absolute top-0 end-0'>
						<Badge className={cn('rounded-none rounded-bl-lg', Colors.GREEN_500.bg)}>
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
							<span className={Colors.GREEN_500.text}>{t(PaymentKey.BONUS_CREDITS, { count: pkg.bonus })}</span>
						</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<div className='text-3xl font-bold'>{pkg.priceDisplay}</div>
					<p className='text-sm text-muted-foreground mt-1'>
						${pkg.pricePerCredit.toFixed(3)} {t(PaymentKey.PER_CREDIT)}
					</p>
				</CardContent>
				<CardFooter>
					<Button className='w-full' onClick={onPurchase} disabled={isPurchasing}>
						{isPurchasing ? t(LoadingKey.PROCESSING) : t(PaymentKey.PURCHASE)}
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

	const { data: creditBalance, isLoading: balanceLoading } = useCreditBalance();
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

	// Track page view analytics
	useEffect(() => {
		trackAnalyticsEvent.mutate({
			eventType: AnalyticsEventType.PAGE_VIEW,
			page: AnalyticsPageName.PAYMENT,
			action: AnalyticsAction.VIEW,
		});
	}, [trackAnalyticsEvent]);

	const handlePaymentSuccess = (credits: number, packageId?: string, amount?: number) => {
		setPurchasedCredits(credits);
		setShowSuccessDialog(true);
		// Track analytics event for purchase
		if (selectedPackage) {
			trackAnalyticsEvent.mutate({
				eventType: AnalyticsEventType.PURCHASE_CREDITS,
				page: AnalyticsPageName.PAYMENT,
				action: AnalyticsAction.PURCHASE_SUCCESS,
				value: amount ?? selectedPackage.price,
				properties: {
					packageId: packageId ?? selectedPackage.id,
					credits: credits,
					price: amount ?? selectedPackage.price,
				},
			});
		}
	};

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
																	{payment.status}
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
			<Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className={cn('flex items-center gap-2', Colors.GREEN_500.text)}>
							<CheckCircle className='w-6 h-6' />
							{t(PaymentKey.PURCHASE_COMPLETE)}
						</DialogTitle>
						<DialogDescription>{t(PaymentKey.CREDITS_ADDED_TO_ACCOUNT)}</DialogDescription>
					</DialogHeader>
					<div className='py-6'>
						<div className='flex flex-col items-center text-center space-y-4'>
							<div className={cn('p-4 rounded-full', `${Colors.GREEN_500.bg}/10`)}>
								<Wallet className={cn('w-12 h-12', Colors.GREEN_500.text)} />
							</div>
							<div>
								<p className='text-lg font-medium'>
									<span className='text-3xl font-bold text-primary'>+{purchasedCredits}</span>
									<span className='text-muted-foreground ms-2'>{t(PaymentKey.CREDITS_ADDED)}</span>
								</p>
								<p className='text-sm text-muted-foreground mt-2'>
									{t(PaymentKey.NEW_BALANCE)}{' '}
									<span className='font-semibold text-foreground'>{balance + purchasedCredits}</span>{' '}
									{t(PaymentKey.CREDITS)}
								</p>
							</div>
						</div>
					</div>
					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => setShowSuccessDialog(false)}>
							{t(PaymentKey.STAY_HERE)}
						</Button>
						<Button
							onClick={() => {
								setShowSuccessDialog(false);
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
