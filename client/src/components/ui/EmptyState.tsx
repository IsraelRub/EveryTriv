import { GamepadIcon, Play, UserX } from 'lucide-react';

import { ButtonSize, ROUTES, VariantBase } from '@/constants';
import type { EmptyStateProps } from '@/types';
import { LinkButton } from './button';

export function EmptyState({ data, title, description, showPlayNow = true }: EmptyStateProps) {
	const Icon = showPlayNow ? GamepadIcon : UserX;
	const displayTitle = title ?? 'No Games Yet';
	const displayDescription = description ?? `Start playing to see ${data} here!`;

	const actionNode = showPlayNow ? (
		<LinkButton to={ROUTES.GAME} size={ButtonSize.LG} variant={VariantBase.DEFAULT}>
			<Play className='h-4 w-4 mr-2' />
			Play Now
		</LinkButton>
	) : null;

	return (
		<div className='flex flex-col items-center justify-center py-8 sm:py-12 text-center'>
			<Icon className='h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50' />
			{displayTitle && <h2 className='text-xl font-semibold mb-2'>{displayTitle}</h2>}
			{displayDescription && <p className='text-muted-foreground mb-6 max-w-sm'>{displayDescription}</p>}
			{actionNode && <div className='mt-2'>{actionNode}</div>}
		</div>
	);
}
