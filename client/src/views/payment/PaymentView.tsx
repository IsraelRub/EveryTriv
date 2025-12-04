import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';
import { Check, CheckCircle, CreditCard, Gamepad2, Sparkles, Wallet, Zap } from 'lucide-react';

import { BillingCycle, CREDIT_PURCHASE_PACKAGES, PaymentMethod, PlanType, SUBSCRIPTION_PLANS } from '@shared/constants';
import type { CreditPurchaseOption } from '@shared/types';

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
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/components';
import { AudioKey, ButtonSize } from '@/constants';
import {
	useAudio,
	useCancelSubscription,
	useCreateSubscription,
	useCreditBalance,
	useCreditPackages,
	useModalRoute,
	usePurchaseCredits,
	useToast,
} from '@/hooks';

function BalanceCard({ balance, isLoading }: { balance: number; isLoading: boolean }) {
	return (
		<Card className='border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5'>
			<CardHeader className='pb-2'>
				<CardTitle className='flex items-center gap-2 text-lg'>
					<Wallet className='h-5 w-5' />
					Your Balance
				</CardTitle>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className='h-10 w-32' />
				) : (
					<div className='flex items-baseline gap-2'>
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
						<Badge className='rounded-none rounded-bl-lg bg-green-500'>+{pkg.bonus} bonus</Badge>
					</div>
				)}
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<CreditCard className='h-5 w-5' />
						{pkg.description || `${pkg.credits} Credits`}
					</CardTitle>
					<CardDescription>
						{pkg.credits} credits
						{hasBonus && <span className='text-green-500'> + {pkg.bonus} bonus</span>}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='text-3xl font-bold'>{pkg.priceDisplay}</div>
					<p className='text-sm text-muted-foreground mt-1'>${pkg.pricePerCredit.toFixed(3)} per credit</p>
				</CardContent>
				<CardFooter>
					<Button className='w-full' onClick={onPurchase} disabled={isPurchasing}>
						{isPurchasing ? 'Processing...' : 'Purchase'}
					</Button>
				</CardFooter>
			</Card>
		</motion.div>
	);
}

interface SubscriptionPlanDisplay {
	id: PlanType;
	name: string;
	price: number;
	features: string[];
	creditBonus: number;
}

function SubscriptionCard({
	plan,
	isPopular,
	onSubscribe,
	isSubscribing,
}: {
	plan: SubscriptionPlanDisplay;
	isPopular?: boolean;
	onSubscribe: () => void;
	isSubscribing: boolean;
}) {
	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
			<Card className={`relative ${isPopular ? 'border-primary shadow-lg' : ''}`}>
				{isPopular && (
					<div className='absolute -top-3 left-1/2 -translate-x-1/2'>
						<Badge className='bg-primary'>
							<Sparkles className='h-3 w-3 mr-1' />
							Most Popular
						</Badge>
					</div>
				)}
				<CardHeader className='pt-8'>
					<CardTitle className='flex items-center gap-2'>
						<Zap className='h-5 w-5' />
						{plan.name}
					</CardTitle>
					<CardDescription>{plan.creditBonus} bonus credits/month</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div>
						<span className='text-4xl font-bold'>${plan.price.toFixed(2)}</span>
						<span className='text-muted-foreground'>/month</span>
					</div>
					<ul className='space-y-2'>
						{plan.features.map((feature, idx) => (
							<li key={idx} className='flex items-center gap-2 text-sm'>
								<Check className='h-4 w-4 text-green-500' />
								{feature}
							</li>
						))}
					</ul>
				</CardContent>
				<CardFooter>
					<Button
						className='w-full'
						variant={isPopular ? 'default' : 'outline'}
						onClick={onSubscribe}
						disabled={isSubscribing}
					>
						{isSubscribing ? 'Processing...' : 'Subscribe'}
					</Button>
				</CardFooter>
			</Card>
		</motion.div>
	);
}

export function PaymentView() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const audioService = useAudio();
	const { isModal, closeModal } = useModalRoute();
	const [purchasingId, setPurchasingId] = useState<string | null>(null);
	const [subscribingId, setSubscribingId] = useState<PlanType | null>(null);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [purchasedCredits, setPurchasedCredits] = useState(0);

	const { data: creditBalance, isLoading: balanceLoading } = useCreditBalance();
	const { data: creditPackages, isLoading: packagesLoading } = useCreditPackages();
	const purchaseCredits = usePurchaseCredits();
	const createSubscription = useCreateSubscription();
	const cancelSubscription = useCancelSubscription();

	const balance = creditBalance?.totalCredits || 0;

	// Use packages from API or fallback to shared constants
	const packages: CreditPurchaseOption[] =
		creditPackages ||
		CREDIT_PURCHASE_PACKAGES.map(pkg => ({
			id: pkg.id,
			credits: pkg.credits,
			price: pkg.price,
			priceDisplay: pkg.priceDisplay,
			pricePerCredit: pkg.pricePerCredit,
			description: `${pkg.credits} Credits`,
		}));

	// Subscription plans from shared constants
	const subscriptionPlans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
		id: key as PlanType,
		name: key.charAt(0).toUpperCase() + key.slice(1),
		price: plan.price,
		features: [...plan.features],
		creditBonus: plan.creditBonus,
	}));

	const handlePurchase = async (packageId: string) => {
		setPurchasingId(packageId);
		try {
			// Find the package to get credit amount
			const pkg = packages.find(p => p.id === packageId);
			const totalCredits = pkg ? pkg.credits + (pkg.bonus || 0) : 0;

			await purchaseCredits.mutateAsync({
				packageId,
				paymentMethod: PaymentMethod.MANUAL_CREDIT,
			});

			// Show success dialog
			setPurchasedCredits(totalCredits);
			setShowSuccessDialog(true);
			audioService.play(AudioKey.SUCCESS);

			toast({
				title: 'Purchase Successful',
				description: 'Credits have been added to your account.',
			});
		} catch {
			audioService.play(AudioKey.ERROR);
			toast({
				title: 'Purchase Failed',
				description: 'Unable to complete purchase. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setPurchasingId(null);
		}
	};

	const handleSubscribe = async (planId: PlanType) => {
		setSubscribingId(planId);
		try {
			await createSubscription.mutateAsync({
				plan: planId,
				billingCycle: BillingCycle.MONTHLY,
			});
			audioService.play(AudioKey.SUCCESS);
			toast({
				title: 'Subscription Created',
				description: 'Your subscription is now active.',
			});
		} catch {
			audioService.play(AudioKey.ERROR);
			toast({
				title: 'Subscription Failed',
				description: 'Unable to create subscription. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setSubscribingId(null);
		}
	};

	const handleCancelSubscription = async () => {
		try {
			await cancelSubscription.mutateAsync();
			toast({
				title: 'Subscription Cancelled',
				description: 'Your subscription has been cancelled.',
			});
		} catch {
			audioService.play(AudioKey.ERROR);
			toast({
				title: 'Error',
				description: 'Unable to cancel subscription.',
				variant: 'destructive',
			});
		}
	};

	return (
		<div className='max-w-6xl mx-auto'>
			<Card>
				<CardHeader>
					<CardTitle className='text-4xl font-bold text-center mb-2'>Credits & Subscriptions</CardTitle>
					<CardDescription className='text-center'>Get credits to play more trivia games</CardDescription>
				</CardHeader>
				<CardContent className='space-y-8'>
					{/* Balance Card */}
					<div className='max-w-md mx-auto'>
						<BalanceCard balance={balance} isLoading={balanceLoading} />
					</div>

					<Tabs defaultValue='credits' className='w-full'>
						<TabsList className='grid w-full max-w-md mx-auto grid-cols-2'>
							<TabsTrigger value='credits'>Buy Credits</TabsTrigger>
							<TabsTrigger value='subscription'>Subscriptions</TabsTrigger>
						</TabsList>

						<TabsContent value='credits' className='mt-8'>
							{packagesLoading ? (
								<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
									{[...Array(3)].map((_, i) => (
										<Card key={i}>
											<CardHeader>
												<Skeleton className='h-6 w-24' />
												<Skeleton className='h-4 w-32' />
											</CardHeader>
											<CardContent>
												<Skeleton className='h-10 w-20' />
											</CardContent>
											<CardFooter>
												<Skeleton className='h-10 w-full' />
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
											onPurchase={() => handlePurchase(pkg.id)}
											isPurchasing={purchasingId === pkg.id}
										/>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value='subscription' className='mt-8'>
							<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
								{subscriptionPlans.map((plan, index) => (
									<SubscriptionCard
										key={plan.id}
										plan={plan}
										isPopular={index === 1}
										onSubscribe={() => handleSubscribe(plan.id)}
										isSubscribing={subscribingId === plan.id}
									/>
								))}
							</div>
							{cancelSubscription && (
								<div className='mt-8 text-center'>
									<Button
										variant='ghost'
										size={ButtonSize.SM}
										className='text-muted-foreground'
										onClick={handleCancelSubscription}
										disabled={cancelSubscription.isPending}
									>
										Cancel existing subscription
									</Button>
								</div>
							)}
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			{/* Success Dialog */}
			<Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
				<DialogContent className='sm:max-w-md'>
					<DialogHeader>
						<DialogTitle className='flex items-center gap-2 text-green-600'>
							<CheckCircle className='w-6 h-6' />
							Purchase Complete!
						</DialogTitle>
						<DialogDescription>Your credits have been added to your account.</DialogDescription>
					</DialogHeader>
					<div className='py-6'>
						<div className='flex flex-col items-center text-center space-y-4'>
							<div className='p-4 rounded-full bg-green-500/10'>
								<Wallet className='w-12 h-12 text-green-600' />
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
						<Button variant='outline' onClick={() => setShowSuccessDialog(false)}>
							Stay Here
						</Button>
						<Button
							onClick={() => {
								setShowSuccessDialog(false);
								if (isModal) {
									closeModal();
								} else {
									navigate('/');
								}
							}}
						>
							<Gamepad2 className='w-4 h-4 mr-2' />
							Play Now
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
