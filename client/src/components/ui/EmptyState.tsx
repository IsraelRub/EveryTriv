import { useTranslation } from 'react-i18next';
import { GamepadIcon, Play } from 'lucide-react';

import { ButtonSize, HomeKey, Routes, UiDensity, VariantBase } from '@/constants';
import type { EmptyStateProps } from '@/types';
import { cn } from '@/utils';
import { LinkButton } from './button';

export function EmptyState({
	data,
	icon,
	title,
	description,
	showPlayNow = true,
	density = UiDensity.DEFAULT,
}: EmptyStateProps) {
	const { t } = useTranslation();
	const Icon = icon ?? GamepadIcon;
	const displayTitle = title ?? t(HomeKey.NO_GAMES_YET);
	const displayDescription = description ?? t(HomeKey.START_PLAYING_TO_SEE_HERE, { what: data });
	const isCompact = density === UiDensity.COMPACT;
	const actionButtonSize = isCompact ? ButtonSize.SM : ButtonSize.LG;

	const actionNode = showPlayNow ? (
		<LinkButton to={Routes.GAME} size={actionButtonSize} variant={VariantBase.DEFAULT}>
			<Play className={cn('me-2 shrink-0', isCompact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
			{t(HomeKey.PLAY_NOW)}
		</LinkButton>
	) : null;

	return (
		<div
			className={cn(
				'flex flex-col items-center justify-center text-center',
				isCompact ? 'py-5 sm:py-6' : 'py-8 sm:py-12'
			)}
		>
			<Icon
				className={cn(
					'mx-auto text-muted-foreground opacity-50',
					isCompact ? 'mb-3 h-9 w-9 sm:h-10 sm:w-10' : 'mb-4 h-12 w-12 sm:h-16 sm:w-16'
				)}
			/>
			{displayTitle && (
				<h2 className={cn('font-semibold', isCompact ? 'mb-1.5 text-base sm:text-lg' : 'mb-2 text-xl')}>
					{displayTitle}
				</h2>
			)}
			{displayDescription && (
				<p className={cn('text-muted-foreground max-w-sm', isCompact ? 'mb-4 text-sm leading-relaxed' : 'mb-6')}>
					{displayDescription}
				</p>
			)}
			{actionNode && <div className={cn(isCompact ? 'mt-1' : 'mt-2')}>{actionNode}</div>}
		</div>
	);
}
