import type { JSX } from 'react';
import { ChevronDown } from 'lucide-react';

import type { DisclosureChevronProps } from '@/types';
import { cn } from '@/utils';

export function DisclosureChevron({ expanded, className }: DisclosureChevronProps): JSX.Element {
	return (
		<ChevronDown
			className={cn('shrink-0 transition-transform duration-200', expanded && 'rotate-180', className)}
			aria-hidden
		/>
	);
}
