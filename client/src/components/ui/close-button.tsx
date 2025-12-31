import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

import type { CloseButtonProps } from '@/types';
import { cn } from '@/utils';

/**
 * CloseButton component
 * @description A reusable close button that navigates to a specified route (defaults to home page)
 */
export function CloseButton({ to = '/', className }: CloseButtonProps) {
	return (
		<Link
			to={to}
			className={cn(
				'p-2 rounded-full hover:bg-destructive transition-colors text-muted-foreground hover:text-white z-10 inline-flex items-center justify-center',
				className
			)}
		>
			<X className='h-5 w-5' />
		</Link>
	);
}
