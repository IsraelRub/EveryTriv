import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva } from 'class-variance-authority';

import { TabsListVariant } from '@/constants';
import type { TabsListProps } from '@/types';
import { cn } from '@/utils';

const tabsListVariants = cva(
	'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
	{
		variants: {
			variant: {
				[TabsListVariant.DEFAULT]: '',
				[TabsListVariant.COMPACT]: 'w-max mx-auto gap-2',
			},
		},
		defaultVariants: { variant: TabsListVariant.DEFAULT },
	}
);

export const Tabs = TabsPrimitive.Root;

export const TabsList = forwardRef<ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
	({ className, variant = TabsListVariant.DEFAULT, ...props }, ref) => (
		<TabsPrimitive.List ref={ref} className={cn(tabsListVariants({ variant }), className)} {...props} />
	)
);
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
	ElementRef<typeof TabsPrimitive.Trigger>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
			className
		)}
		{...props}
	/>
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
	ElementRef<typeof TabsPrimitive.Content>,
	ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
			className
		)}
		{...props}
	/>
));
TabsContent.displayName = 'TabsContent';
