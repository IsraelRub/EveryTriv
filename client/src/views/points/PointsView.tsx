/**
 * Points View
 *
 * @module PointsView
 * @description User points balance and transaction history display
 */

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import type { PointTransaction } from '@shared/types';

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Container,
	createStaggerContainer,
	fadeInUp,
	GridLayout,
	scaleIn,
} from '../../components';
import { AudioKey, ButtonVariant, CardVariant, ContainerSize, Spacing } from '../../constants';
import { usePointBalance, useTransactionHistory } from '../../hooks';
import { audioService } from '../../services';

export default function PointsView() {
	const { data: balance, isLoading: balanceLoading } = usePointBalance();
	const { data: history, isLoading: historyLoading } = useTransactionHistory(20);

	const handleBuyPoints = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
		logger.gameInfo('Navigate to points store');
		// Navigate to payment view
		window.location.href = '/payment';
	};

	return (
		<main role='main' aria-label='Points'>
			<Container size={ContainerSize.XL} className='min-h-screen py-8'>
				{/* Header */}
				<motion.header variants={fadeInUp} initial='hidden' animate='visible' className='text-center mb-12'>
					<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Your Points</h1>
					<p className='text-xl text-slate-300'>Manage your points and view transaction history</p>
				</motion.header>

				{/* Balance Card */}
				<motion.section
					variants={scaleIn}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.2 }}
					className='mb-8'
					aria-label='Points Balance'
				>
					<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='text-center'>
						<CardContent>
							{balanceLoading ? (
								<div className='animate-pulse'>
									<div className='h-16 bg-slate-700 rounded mb-4'></div>
									<div className='h-8 bg-slate-700 rounded'></div>
								</div>
							) : (
								<>
									<div className='text-6xl font-bold text-white mb-4'>{balance?.totalPoints ?? 0}</div>
									<p className='text-slate-300 text-lg mb-6'>Total Points Available</p>

									<GridLayout variant='balanced' gap={Spacing.MD} className='mb-6'>
										<div className='text-center'>
											<div className='text-2xl font-semibold text-blue-400'>{balance?.freeQuestions ?? 0}</div>
											<p className='text-sm text-slate-400'>Free Questions</p>
										</div>
										<div className='text-center'>
											<div className='text-2xl font-semibold text-green-400'>{balance?.purchasedPoints ?? 0}</div>
											<p className='text-sm text-slate-400'>Purchased Points</p>
										</div>
										<div className='text-center'>
											<div className='text-2xl font-semibold text-purple-400'>{balance?.dailyLimit || 10}</div>
											<p className='text-sm text-slate-400'>Daily Limit</p>
										</div>
									</GridLayout>

									<Button
										variant={ButtonVariant.PRIMARY}
										onClick={handleBuyPoints}
										className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
									>
										Buy More Points
									</Button>
								</>
							)}
						</CardContent>
					</Card>
				</motion.section>

				{/* Transaction History */}
				<motion.section
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.4 }}
					aria-label='Transaction History'
				>
					<Card variant={CardVariant.GLASS}>
						<CardHeader>
							<CardTitle className='text-2xl font-bold text-white'>Transaction History</CardTitle>
						</CardHeader>
						<CardContent>
							{historyLoading ? (
								<div className='space-y-4'>
									{[1, 2, 3].map(i => (
										<div
											key={i}
											className='animate-pulse flex justify-between items-center p-4 bg-slate-800/50 rounded'
										>
											<div className='h-4 bg-slate-700 rounded w-1/3'></div>
											<div className='h-4 bg-slate-700 rounded w-1/4'></div>
										</div>
									))}
								</div>
							) : history && history.length > 0 ? (
								<motion.div
									className='space-y-4'
									variants={createStaggerContainer(0.05)}
									initial='hidden'
									animate='visible'
								>
									{history.map((transaction: PointTransaction, index: number) => (
										<motion.div
											key={index}
											variants={fadeInUp}
											className='flex justify-between items-center p-4 bg-slate-800/50 rounded hover:bg-slate-800/70 transition-colors'
										>
											<div>
												<p className='text-white font-medium'>{transaction.description || 'Points Transaction'}</p>
												<p className='text-sm text-slate-400'>
													{new Date(transaction.createdAt).toLocaleDateString()} at{' '}
													{new Date(transaction.createdAt).toLocaleTimeString()}
												</p>
											</div>
											<div
												className={`text-lg font-semibold ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}
											>
												{transaction.amount > 0 ? '+' : ''}
												{transaction.amount}
											</div>
										</motion.div>
									))}
								</motion.div>
							) : (
								<p className='text-center text-slate-400 py-8'>No transactions yet</p>
							)}
						</CardContent>
					</Card>
				</motion.section>
			</Container>
		</main>
	);
}
