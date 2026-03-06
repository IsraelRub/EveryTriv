import type { HTMLAttributes } from 'react';

import { SkeletonVariant } from '@/constants';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
	variant: SkeletonVariant;
	inline?: boolean;
	count?: number;
}
