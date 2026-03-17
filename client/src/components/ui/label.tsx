import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { Root as LabelRoot } from '@radix-ui/react-label';

import { LABEL_BASE_CLASS } from '@/constants';
import { cn } from '@/utils';

export const Label = forwardRef<ElementRef<typeof LabelRoot>, ComponentPropsWithoutRef<typeof LabelRoot>>(
	({ className, ...props }, ref) => <LabelRoot ref={ref} className={cn(LABEL_BASE_CLASS, className)} {...props} />
);
Label.displayName = 'Label';
