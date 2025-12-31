import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, CreditCard, Gamepad2, Wallet } from 'lucide-react';

import { CREDIT_PURCHASE_PACKAGES } from '@shared/constants';
import type { CreditPurchaseOption } from '@shared/types';
import { ButtonVariant, ROUTES } from '@/constants';
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	CreditHistoryCard,
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
import { useCreditBalance, useCreditHistory, useCreditPackages, useModalRoute } from '@/hooks';

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

export function PaymentView() {
	const navigate = useNavigate();
	const { isModal, closeModal } = useModalRoute();
	const [selectedPackage, setSelectedPackage] = useState<CreditPurchaseOption | null>(null);
	const [showPaymentDialog, setShowPaymentDialog] = useState(false);
	const [showSuccessDialog, setShowSuccessDialog] = useState(false);
	const [purchasedCredits, setPurchasedCredits] = useState(0);

	const { data: creditBalance, isLoading: balanceLoading } = useCreditBalance();
	const { data: creditPackages, isLoading: packagesLoading } = useCreditPackages();
	const { data: creditHistory, isLoading: historyLoading } = useCreditHistory(20);

	const balance = creditBalance?.totalCredits ?? 0;

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

	const handlePurchaseClick = (pkg: CreditPurchaseOption) => {
		setSelectedPackage(pkg);
		setShowPaymentDialog(true);
	};

	const handlePaymentSuccess = (credits: number) => {
		setPurchasedCredits(credits);
		setShowSuccessDialog(true);
	};

	return (
		<div className='max-w-6xl mx-auto'>
			<Card>
				<CardHeader>
					<CardTitle className='text-4xl font-bold text-center mb-2'>Credits</CardTitle>
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
							<TabsTrigger value='history'>History</TabsTrigger>
						</TabsList>

						<TabsContent value='credits' className='mt-8'>
							{packagesLoading ? (
								<div className='grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden'>
									{[...Array(3)].map((_, i) => (
										<Card key={i} className='overflow-hidden'>
											<CardHeader className='overflow-hidden'>
												<Skeleton className='h-6 w-24 max-w-full' />
												<Skeleton className='h-4 w-32 max-w-full' />
											</CardHeader>
											<CardContent className='overflow-hidden'>
												<Skeleton className='h-10 w-20 max-w-full' />
											</CardContent>
											<CardFooter className='overflow-hidden'>
												<Skeleton className='h-10 w-full max-w-full' />
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
											onPurchase={() => handlePurchaseClick(pkg)}
											isPurchasing={false}
										/>
									))}
								</div>
							)}
						</TabsContent>

						<TabsContent value='history' className='mt-8'>
							<div className='max-w-2xl mx-auto'>
								<CreditHistoryCard transactions={creditHistory} isLoading={historyLoading} />
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
						<Button variant={ButtonVariant.OUTLINE} onClick={() => setShowSuccessDialog(false)}>
							Stay Here
						</Button>
						<Button
							onClick={() => {
								setShowSuccessDialog(false);
								if (isModal) {
									closeModal();
								} else {
									navigate(ROUTES.HOME);
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
