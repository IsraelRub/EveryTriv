import { motion } from 'framer-motion';

import { ANIMATION_CONFIG, ComponentSize, TRANSITION_DURATIONS } from '@/constants';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components';
import { useModalRoute } from '@/hooks';
import type { ModalRouteProps } from '@/types';
import { cn } from '@/utils';

export function ModalRouteWrapper({ children, modalSize = ComponentSize.LG }: ModalRouteProps): JSX.Element {
	const { isModal, closeModal } = useModalRoute();

	// If modal mode, render as Dialog
	if (isModal) {
		return (
			<Dialog
				open={true}
				onOpenChange={open => {
					if (!open) {
						closeModal();
					}
				}}
			>
				<DialogContent
					className={cn(
						'sm:max-w-lg max-h-[90vh] overflow-y-auto',
						modalSize === ComponentSize.XL && 'sm:max-w-6xl',
						modalSize === ComponentSize.SM && 'sm:max-w-sm',
						modalSize === ComponentSize.MD && 'sm:max-w-md',
						modalSize === ComponentSize.FULL && 'sm:max-w-full'
					)}
				>
					<DialogHeader>
						<DialogTitle>Dialog</DialogTitle>
						<DialogDescription>Modal dialog</DialogDescription>
					</DialogHeader>
					{children}
				</DialogContent>
			</Dialog>
		);
	}

	// If not modal mode, render as full page
	// Use layout prop to prevent unnecessary re-renders
	return (
		<motion.main
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: TRANSITION_DURATIONS.NORMAL, ease: ANIMATION_CONFIG.EASING_NAMES.EASE_OUT }}
			className='min-h-screen flex items-center justify-center px-4 py-12'
			style={{ willChange: 'transform, opacity' }}
		>
			{children}
		</motion.main>
	);
}
