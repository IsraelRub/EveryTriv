import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Coins, Crown, Plus } from 'lucide-react';

import { Colors, ComponentSize, GameKey, LoadingKey, PaymentKey, ROUTES } from '@/constants';
import { cn } from '@/utils';
import { Spinner } from '@/components';
import { useCreditBalance, useUserRole } from '@/hooks';

export function CreditBalance() {
	const { t } = useTranslation(['game', 'payment', 'loading']);
	const { data: creditBalance, isLoading } = useCreditBalance();
	const { isAdmin } = useUserRole();

	if (isLoading) {
		return (
			<div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50'>
				<Spinner
					size={ComponentSize.SM}
					className='text-muted-foreground'
					message={t(LoadingKey.LOADING_BALANCE)}
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
					{isAdmin ? t(GameKey.UNLIMITED) : totalCredits}
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
						{t(PaymentKey.ADD_CREDITS)}
					</span>
				</Link>
			)}
		</div>
	);
}
