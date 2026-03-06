import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { Root as LabelRoot } from '@radix-ui/react-label';

import { cn } from '@/utils';

const LABEL_BASE_CLASS = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';

export const Label = forwardRef<ElementRef<typeof LabelRoot>, ComponentPropsWithoutRef<typeof LabelRoot>>(
	({ className, ...props }, ref) => <LabelRoot ref={ref} className={cn(LABEL_BASE_CLASS, className)} {...props} />
);
Label.displayName = 'Label';
