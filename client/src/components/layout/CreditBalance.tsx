import { Link } from 'react-router-dom';

import { Coins, Crown, Loader2, Plus } from 'lucide-react';

import { UserRole } from '@shared/constants';

import { Badge } from '@/components';
import { useAppSelector, useCreditBalance } from '@/hooks';
import { selectUserRole } from '@/redux/selectors';

/**
 * Credit Balance Display Component
 * Shows user's credit balance with link to payment page
 * Admins see "Unlimited" badge instead of credit count
 */
export function CreditBalance() {
	const { data: creditBalance, isLoading } = useCreditBalance();
	const userRole = useAppSelector(selectUserRole);
	const isAdmin = userRole === UserRole.ADMIN;

	if (isLoading) {
		return (
			<div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50'>
				<Loader2 className='w-4 h-4 animate-spin text-muted-foreground' />
				<span className='text-sm text-muted-foreground'>Loading...</span>
			</div>
		);
	}

	// Admin users have unlimited credits
	if (isAdmin) {
		return (
			<Badge variant='secondary' className='bg-amber-500/10 text-amber-600 border-amber-500/30 px-3 py-1.5'>
				<Crown className='w-4 h-4 mr-1.5' />
				<span className='font-medium'>Unlimited</span>
			</Badge>
		);
	}

	const totalCredits = creditBalance?.totalCredits ?? 0;
	const freeQuestions = creditBalance?.freeQuestions ?? 0;

	return (
		<div className='flex items-center rounded-full bg-primary/10 overflow-hidden'>
			{/* Credit Information Display */}
			<div className='flex items-center gap-2 px-3 py-1.5'>
				<Coins className='w-4 h-4 text-primary' />
				<span className='text-sm font-medium'>
					{totalCredits}
					{freeQuestions > 0 && <span className='text-muted-foreground ml-1'>({freeQuestions} free)</span>}
				</span>
			</div>

			{/* Divider */}
			<div className='h-6 w-px bg-border/50' />

			{/* Add Credits Button */}
			<Link
				to='/payment'
				className='flex items-center gap-1.5 px-3 py-1.5 hover:bg-primary/20 transition-colors cursor-pointer group'
				aria-label='Add credits'
			>
				<Plus className='w-4 h-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity' />
				<span className='text-xs font-medium text-primary opacity-70 group-hover:opacity-100 transition-opacity'>
					ADD
				</span>
			</Link>
		</div>
	);
}
