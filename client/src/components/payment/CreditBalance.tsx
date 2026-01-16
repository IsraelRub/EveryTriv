import { Link } from 'react-router-dom';
import { Coins, Crown, Plus } from 'lucide-react';

import { UserRole } from '@shared/constants';

import { ROUTES, SpinnerSize, VariantBase } from '@/constants';
import { Badge, Spinner } from '@/components';
import { useCreditBalance, useUserRole } from '@/hooks';

export function CreditBalance() {
	const { data: creditBalance, isLoading } = useCreditBalance();
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	if (isLoading) {
		return (
			<div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50'>
				<Spinner size={SpinnerSize.SM} variant='loader' className='text-muted-foreground' />
				<span className='text-sm text-muted-foreground'>Loading...</span>
			</div>
		);
	}

	// Admin users have unlimited credits
	if (isAdmin) {
		return (
			<Badge variant={VariantBase.SECONDARY} className='bg-amber-500/10 text-amber-600 border-amber-500/30 px-3 py-1.5'>
				<Crown className='w-4 h-4 mr-1.5' />
				<span className='font-medium'>Unlimited</span>
			</Badge>
		);
	}

	const totalCredits = creditBalance?.totalCredits ?? 0;

	return (
		<div className='flex items-center rounded-full bg-primary/10 overflow-hidden'>
			{/* Credit Information Display */}
			<div className='flex items-center gap-2 px-3 py-1.5'>
				<Coins className='w-4 h-4 text-yellow-500' />
				<span className='text-sm font-medium text-yellow-500'>{totalCredits}</span>
			</div>

			{/* Divider */}
			<div className='h-6 w-px bg-border/50' />

			{/* Add Credits Button */}
			<Link
				to={ROUTES.PAYMENT}
				className='flex items-center gap-1.5 px-3 py-1.5 hover:bg-primary/20 transition-colors cursor-pointer group'
			>
				<Plus className='w-4 h-4 text-yellow-500 opacity-70 group-hover:opacity-100 transition-opacity' />
				<span className='text-xs font-medium text-yellow-500 opacity-70 group-hover:opacity-100 transition-opacity'>
					ADD
				</span>
			</Link>
		</div>
	);
}
