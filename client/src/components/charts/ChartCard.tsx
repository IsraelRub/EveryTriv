import { motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import type { ChartCardProps } from '@/types';

/**
 * Wrapper component for charts with consistent styling and loading/empty states
 */
export function ChartCard({
	title,
	description,
	isLoading,
	isEmpty,
	emptyMessage = 'No data available',
	children,
	className,
}: ChartCardProps) {
	if (isLoading) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<Skeleton className='h-[300px] w-full' />
				</CardContent>
			</Card>
		);
	}

	if (isEmpty) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>
					<div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
						<p>{emptyMessage}</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className={className}
		>
			<Card>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					{description && <CardDescription>{description}</CardDescription>}
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</motion.div>
	);
}
