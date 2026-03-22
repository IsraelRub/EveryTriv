import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

import { Colors, SPRING_CONFIGS } from '@/constants';
import { cn } from '@/utils';

export type AnimatedCopyFeedbackIconVariant = 'default' | 'onPrimary';

export const AnimatedCopyFeedbackIcon = memo(function AnimatedCopyFeedbackIcon({
	success,
	variant = 'default',
}: {
	success: boolean;
	variant?: AnimatedCopyFeedbackIconVariant;
}) {
	const onPrimary = variant === 'onPrimary';
	const copyIconClass = cn('h-4 w-4', onPrimary && 'text-primary-foreground');
	const checkIconClass = cn('h-4 w-4', onPrimary ? 'text-primary-foreground' : Colors.GREEN_500.text);

	return (
		<span className='relative inline-flex h-4 w-4 shrink-0 items-center justify-center'>
			<AnimatePresence mode='wait' initial={false}>
				{success ? (
					<motion.span
						key='copy-success'
						initial={{ opacity: 0, scale: 0.82 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.82 }}
						transition={SPRING_CONFIGS.ICON_SPRING}
						className='absolute inline-flex'
					>
						<Check className={checkIconClass} />
					</motion.span>
				) : (
					<motion.span
						key='copy-idle'
						initial={{ opacity: 0, scale: 0.82 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.82 }}
						transition={SPRING_CONFIGS.ICON_SPRING}
						className='absolute inline-flex'
					>
						<Copy className={copyIconClass} />
					</motion.span>
				)}
			</AnimatePresence>
		</span>
	);
});
