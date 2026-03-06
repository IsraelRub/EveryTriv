import { useEffect, useState } from 'react';
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
	LoadingMessages,
	PaymentTab,
	SKELETON_PLACEHOLDER_COUNTS,
	SkeletonVariant,
	VariantBase,
} from '@/constants';
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
	TabsList,
	TabsTrigger,
} from '@/components';
import {
	useCreditBalance,
	useCreditPackages,
	useNavigationClose,
	usePaymentHistory,
	useTrackAnalyticsEvent,
} from '@/hooks';
import { cn, repeat } from '@/utils';

function BalanceCard({ balance, isLoading }: { balance: number; isLoading: boolean }) {
	return (
		<Card className='w-fit border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5'>
			<CardHeader className='pb-2 text-center'>
				<CardTitle className='flex items-center justify-center gap-2 text-lg'>
					<Wallet className='h-5 w-5 text-primary' />
					Your Balance
				</CardTitle>
			</CardHeader>
			<CardContent className='text-center'>
				{isLoading ? (
					<Skeleton variant={SkeletonVariant.Input} className='mx-auto' />
				) : (
					<div className='flex items-baseline justify-center gap-2'>
						<span className='text-4xl font-bold text-primary'>{balance}</span>
						<span className='text-muted-foreground'>credits</span>
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
}: {
	pkg: CreditPurchaseOption;
	onPurchase: () => void;
	isPurchasing: boolean;
}) {
	const hasBonus = pkg.bonus && pkg.bonus > 0;

	return (
		<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
			<Card className='relative overflow-hidden'>
				{hasBonus && (
					<div className='absolute top-0 right-0'>
						<Badge className={cn('rounded-none rounded-bl-lg', Colors.GREEN_500.bg)}>+{pkg.bonus} bonus</Badge>
					</div>
				)}
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Coins className='h-5 w-5 text-primary' />
						{pkg.description ?? `${pkg.credits} Credits`}
					</CardTitle>
					{hasBonus && (
						<CardDescription>
							<span className={Colors.GREEN_500.text}>+{pkg.bonus} bonus credits</span>
						</CardDescription>
					)}
				</CardHeader>
				<CardContent>
					<div className='text-3xl font-bold'>{pkg.priceDisplay}</div>
					<p className='text-sm text-muted-foreground mt-1'>${pkg.pricePerCredit.toFixed(3)} per credit</p>
				</CardContent>
				<CardFooter>
					<Button className='w-full' onClick={onPurchase} disabled={isPurchasing}>
						{isPurchasing ? LoadingMessages.PROCESSING : 'Purchase'}
					</Button>
				</CardFooter>
			</Card>
		</motion.div>
	);
}

export function PaymentView() {
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
			description: `${pkg.credits} Credits`,
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
					<CardTitle className='text-3xl md:text-4xl font-bold text-center mb-1 md:mb-2'>Credits</CardTitle>
					<CardDescription className='text-center text-sm md:text-base'>
						Get credits to play more trivia games
					</CardDescription>
				</CardHeader>
				<CardContent className='view-spacing-lg view-scroll-inline'>
					{/* Balance Card */}
					<div className='flex justify-center'>
						<BalanceCard balance={balance} isLoading={balanceLoading} />
					</div>

					<Tabs defaultValue={PaymentTab.CREDITS} className='w-full flex-1 flex flex-col overflow-hidden min-h-0'>
						<TabsList className='grid w-full max-w-md mx-auto grid-cols-2 flex-shrink-0'>
							<TabsTrigger value={PaymentTab.CREDITS}>Buy Credits</TabsTrigger>
							<TabsTrigger value={PaymentTab.PAYMENT_HISTORY}>Payment History</TabsTrigger>
						</TabsList>

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
											<CardTitle>Payment History</CardTitle>
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
											<CardTitle>Payment History</CardTitle>
											<CardDescription>Your payment transaction history</CardDescription>
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
											<CardTitle>Payment History</CardTitle>
											<CardDescription>Your payment transaction history</CardDescription>
										</CardHeader>
										<CardContent>
											<p className='text-center text-muted-foreground py-8'>No payment history found</p>
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
							Purchase Complete!
						</DialogTitle>
						<DialogDescription>Your credits have been added to your account.</DialogDescription>
					</DialogHeader>
					<div className='py-6'>
						<div className='flex flex-col items-center text-center space-y-4'>
							<div className={cn('p-4 rounded-full', `${Colors.GREEN_500.bg}/10`)}>
								<Wallet className={cn('w-12 h-12', Colors.GREEN_500.text)} />
							</div>
							<div>
								<p className='text-lg font-medium'>
									<span className='text-3xl font-bold text-primary'>+{purchasedCredits}</span>
									<span className='text-muted-foreground ml-2'>credits added</span>
								</p>
								<p className='text-sm text-muted-foreground mt-2'>
									New balance: <span className='font-semibold text-foreground'>{balance + purchasedCredits}</span>{' '}
									credits
								</p>
							</div>
						</div>
					</div>
					<DialogFooter className='gap-2 sm:gap-0'>
						<Button variant={VariantBase.OUTLINE} onClick={() => setShowSuccessDialog(false)}>
							Stay Here
						</Button>
						<Button
							onClick={() => {
								setShowSuccessDialog(false);
								handleClose();
							}}
						>
							<Play className='w-4 h-4 mr-2' />
							Play Now
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
