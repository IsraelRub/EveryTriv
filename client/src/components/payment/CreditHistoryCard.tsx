import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Calendar, CreditCard } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';

import type { CreditHistoryCardProps } from '@/types';

import { formatDate } from '@/utils';

export function CreditHistoryCard({ transactions, isLoading }: CreditHistoryCardProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className='h-6 w-32' />
					<Skeleton className='h-4 w-48 mt-2' />
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{[...Array(3)].map((_, i) => (
							<Skeleton key={i} className='h-16 w-full' />
						))}
					</div>
				</CardContent>
			</Card>
		);
	}

	if (!transactions || transactions.length === 0) {
		return (
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<CreditCard className='h-5 w-5' />
							Credit History
						</CardTitle>
						<CardDescription>Your credit transaction history</CardDescription>
					</CardHeader>
					<CardContent>
						<p className='text-sm text-muted-foreground text-center py-8'>
							No transactions found. Your purchase history will appear here.
						</p>
					</CardContent>
				</Card>
			</motion.div>
		);
	}

	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<CreditCard className='h-5 w-5' />
						Credit History
					</CardTitle>
					<CardDescription>
						{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-3'>
						{transactions.map((transaction, index) => {
							const isCredit = transaction.amount > 0;
							const isDebit = transaction.amount < 0;
							const amount = Math.abs(transaction.amount);

							return (
								<motion.div
									key={transaction.id || index}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.05 }}
									className='flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
								>
									<div className='flex items-center gap-3 flex-1'>
										<div
											className={`p-2 rounded-full ${
												isCredit ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
											}`}
										>
											{isCredit ? <ArrowUp className='h-4 w-4' /> : <ArrowDown className='h-4 w-4' />}
										</div>
										<div className='flex-1 min-w-0'>
											<div className='flex items-center gap-2'>
												<p className='font-medium text-sm'>{transaction.type || 'Transaction'}</p>
											</div>
											{transaction.metadata?.reason && (
												<p className='text-xs text-muted-foreground truncate'>{transaction.metadata.reason}</p>
											)}
											<div className='flex items-center gap-1 mt-1 text-xs text-muted-foreground'>
												<Calendar className='h-3 w-3' />
												{transaction.createdAt ? formatDate(transaction.createdAt) : 'N/A'}
											</div>
										</div>
									</div>
									<div className='text-right'>
										<p
											className={`font-bold ${
												isCredit ? 'text-green-500' : isDebit ? 'text-red-500' : 'text-foreground'
											}`}
										>
											{isCredit ? '+' : '-'}
											{amount} credits
										</p>
										{transaction.balanceAfter !== undefined && (
											<p className='text-xs text-muted-foreground'>Balance: {transaction.balanceAfter}</p>
										)}
									</div>
								</motion.div>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
