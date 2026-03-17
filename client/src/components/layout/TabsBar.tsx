import { TabsListVariant } from '@/constants';
import type { TabsBarProps } from '@/types';
import { cn } from '@/utils';
import { TabsList, TabsTrigger } from '@/components';

const COLUMNS_CLASS: Record<2 | 3, string> = {
	2: 'grid grid-cols-2 w-full max-w-md items-center',
	3: 'grid grid-cols-3 w-full max-w-md items-center',
};

export function TabsBar({ items, variant, columns }: TabsBarProps) {
	const listClassName =
		variant === TabsListVariant.SECONDARY
			? cn(columns != null && COLUMNS_CLASS[columns], 'mb-6 flex-shrink-0')
			: 'flex-shrink-0';
	return (
		<div className='flex justify-center w-full'>
			<TabsList variant={variant} className={listClassName}>
				{items.map(({ value, label }) => (
					<TabsTrigger key={value} value={value}>
						{label}
					</TabsTrigger>
				))}
			</TabsList>
		</div>
	);
}
