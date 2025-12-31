import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

import { StatCardVariant, VariantBase } from '@/constants';
import { Badge, Card, CardContent, Skeleton } from '@/components';
import { useCountUp } from '@/hooks';
import type { StatCardProps } from '@/types';
import { cn } from '@/utils';

export function StatCard({
	icon: Icon,
	label,
	value,
	subtext,
	color,
	suffix,
	trend,
	trendUp,
	isLoading,
	variant = StatCardVariant.HORIZONTAL,
	animate = false,
	countUp = false,
	countUpDuration = 2000,
}: StatCardProps) {
	// Determine if value is numeric and should use count-up animation
	const isNumeric = typeof value === 'number';
	const numericValue = isNumeric ? value : 0;
	const countUpEnabled = countUp && isNumeric;
	const animatedValue = useCountUp(numericValue, {
		...(countUpDuration !== 2000 && { duration: countUpDuration }),
		...(!countUpEnabled && { enabled: false }),
	});

	// Use animated value if count-up is enabled and value is numeric, otherwise use original value
	const displayValue = countUp && isNumeric ? animatedValue : value;

	if (isLoading) {
		return (
			<Card className='p-6'>
				<div className='flex items-center justify-between mb-4'>
					<Skeleton className='h-8 w-8 rounded' />
				</div>
				<Skeleton className='h-8 w-24 mb-1' />
				<Skeleton className='h-4 w-20' />
			</Card>
		);
	}

	const content = (
		<>
			{variant === StatCardVariant.HORIZONTAL && (
				<Card>
					<CardContent className='pt-6'>
						<div className='flex items-center gap-4'>
							<div className={cn('p-3 rounded-lg', color)}>
								<Icon className='h-6 w-6 text-white' />
							</div>
							<div>
								<p className='text-2xl font-bold'>
									{typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
									{suffix}
								</p>
								<p className='text-sm text-muted-foreground'>{label}</p>
								{subtext && <p className='text-xs text-muted-foreground'>{subtext}</p>}
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{variant === StatCardVariant.VERTICAL && (
				<Card className='p-6'>
					<div className='flex items-center justify-between mb-4'>
						<Icon className={cn('w-8 h-8', color)} />
						{trend && (
							<Badge variant={trendUp ? VariantBase.DEFAULT : VariantBase.SECONDARY} className='text-xs'>
								<TrendingUp className={cn('h-3 w-3 mr-1', !trendUp && 'rotate-180')} />
								{trend}
							</Badge>
						)}
					</div>
					<div className='text-3xl font-bold mb-1'>
						{typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
						{suffix}
					</div>
					<div className='text-sm text-muted-foreground'>{label}</div>
				</Card>
			)}

			{variant === StatCardVariant.CENTERED && (
				<div className='text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors'>
					<Icon className={cn('h-6 w-6 mx-auto mb-2', color)} />
					<p className='text-3xl font-bold'>
						{typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
						{suffix}
					</p>
					<p className='text-sm text-muted-foreground'>{label}</p>
				</div>
			)}
		</>
	);

	if (animate && variant === StatCardVariant.CENTERED) {
		return (
			<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
				{content}
			</motion.div>
		);
	}

	return content;
}
