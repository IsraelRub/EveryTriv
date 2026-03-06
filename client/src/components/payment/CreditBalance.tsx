import { Link } from 'react-router-dom';
import { Coins, Crown, Plus } from 'lucide-react';

import { UserRole } from '@shared/constants';

import { Colors, ComponentSize, LoadingMessages, ROUTES } from '@/constants';
import { Spinner } from '@/components';
import { useCreditBalance, useUserRole } from '@/hooks';
import { cn } from '@/utils';

export function CreditBalance() {
	const { data: creditBalance, isLoading } = useCreditBalance();
	const userRole = useUserRole();
	const isAdmin = userRole === UserRole.ADMIN;

	if (isLoading) {
		return (
			<div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50'>
				<Spinner
					size={ComponentSize.SM}
					className='text-muted-foreground'
					message={LoadingMessages.LOADING_BALANCE}
					messageInline
				/>
			</div>
		);
	}

	const totalCredits = creditBalance?.totalCredits ?? 0;

	return (
		<div className='flex items-center rounded-full bg-primary/10 overflow-hidden'>
			{/* Credit Information Display */}
			<div className='flex items-center gap-2 px-3 py-1.5'>
				<Coins className={cn('w-4 h-4', Colors.YELLOW_500.text)} />
				<span className={cn('text-sm font-medium', Colors.YELLOW_500.text)}>
					{isAdmin ? 'Unlimited' : totalCredits}
				</span>
			</div>

			{/* Divider */}
			<div className='h-6 w-px bg-border/50' />

			{/* Right Side - Crown for admin, Add button for regular users */}
			{isAdmin ? (
				<div className='flex items-center gap-1.5 px-3 py-1.5'>
					<Crown className={cn('w-4 h-4', Colors.AMBER_600.text)} />
				</div>
			) : (
				<Link
					to={ROUTES.PAYMENT}
					className='flex items-center gap-1.5 px-3 py-1.5 hover:bg-primary/20 transition-colors cursor-pointer group'
				>
					<Plus
						className={cn('w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity', Colors.YELLOW_500.text)}
					/>
					<span
						className={cn(
							'text-xs font-medium opacity-70 group-hover:opacity-100 transition-opacity',
							Colors.YELLOW_500.text
						)}
					>
						ADD
					</span>
				</Link>
			)}
		</div>
	);
}
