import type { LucideIcon } from 'lucide-react';
import { GamepadIcon } from 'lucide-react';

import { ButtonSize, ButtonVariant, ROUTES } from '@/constants';
import { cn } from '@/utils';
import { LinkButton } from './button';

export interface EmptyStateProps {
	data: string;
	icon?: LucideIcon;
	title?: string;
	description?: string;
	action?: React.ReactNode | null;
	className?: string;
}

export function EmptyState({ data, icon: Icon = GamepadIcon, title, description, action, className }: EmptyStateProps) {
	const defaultMessage = `No games yet. Start playing to see ${data} here!`;
	const displayTitle = title;
	const displayDescription = description !== undefined ? description : defaultMessage;
	const displayAction =
		action === undefined ? (
			<LinkButton to={ROUTES.GAME} size={ButtonSize.LG} variant={ButtonVariant.DEFAULT}>
				Play Now
			</LinkButton>
		) : (
			action
		);

	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center py-8 sm:py-12 text-center',
				className
			)}
		>
			<Icon className='h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50' />
			{displayTitle && <h2 className='text-xl font-semibold mb-2'>{displayTitle}</h2>}
			{displayDescription && (
				<p className='text-muted-foreground mb-6 max-w-sm'>{displayDescription}</p>
			)}
			{displayAction && <div className='mt-2'>{displayAction}</div>}
		</div>
	);
}
