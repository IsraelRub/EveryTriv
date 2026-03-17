import { memo } from 'react';

import { DEFAULT_SECTION_CARD_CLASS } from '@/constants';
import type { SectionCardProps } from '@/types';
import { cn } from '@/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export const SectionCard = memo(function SectionCard({
	title,
	description,
	icon: Icon,
	children,
	className = DEFAULT_SECTION_CARD_CLASS,
	contentClassName,
}: SectionCardProps) {
	const hasHeader = (title != null && title !== '') || (description != null && description !== '');
	return (
		<Card className={className}>
			{hasHeader && (
				<CardHeader>
					{title != null && title !== '' && (
						<CardTitle className='flex items-center gap-2'>
							{Icon != null ? <Icon className='h-5 w-5 text-primary' /> : null}
							{title}
						</CardTitle>
					)}
					{description != null && description !== '' && <CardDescription>{description}</CardDescription>}
				</CardHeader>
			)}
			<CardContent className={cn(contentClassName)}>{children}</CardContent>
		</Card>
	);
});
