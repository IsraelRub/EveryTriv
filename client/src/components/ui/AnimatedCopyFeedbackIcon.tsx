import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

import { AnimatedCopyFeedbackIconVariant, SEMANTIC_ICON_TEXT, SPRING_CONFIGS } from '@/constants';
import { cn } from '@/utils';

export const AnimatedCopyFeedbackIcon = memo(function AnimatedCopyFeedbackIcon({
	success,
	variant = AnimatedCopyFeedbackIconVariant.DEFAULT,
}: {
	success: boolean;
	variant?: AnimatedCopyFeedbackIconVariant;
}) {
	const onPrimary = variant === AnimatedCopyFeedbackIconVariant.ON_PRIMARY;
	const copyIconClass = cn('h-4 w-4', onPrimary && 'text-primary-foreground');
	const checkIconClass = cn('h-4 w-4', onPrimary ? 'text-primary-foreground' : SEMANTIC_ICON_TEXT.success);

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
