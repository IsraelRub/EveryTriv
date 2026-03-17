import { useEffect } from 'react';
import { cva } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { ANIMATION_CONFIG, ComponentSize, KEY_ESCAPE, TRANSITION_DURATIONS } from '@/constants';
import type { ModalRouteProps } from '@/types';
import { useModalRoute } from '@/hooks';

const modalContentVariants = cva('w-full max-h-[90vh] overflow-y-auto', {
	variants: {
		size: {
			[ComponentSize.SM]: 'sm:max-w-sm',
			[ComponentSize.MD]: 'sm:max-w-md',
			[ComponentSize.LG]: 'sm:max-w-lg',
			[ComponentSize.XL]: 'sm:max-w-6xl',
			[ComponentSize.FULL]: 'sm:max-w-full',
		},
	},
	defaultVariants: {
		size: ComponentSize.LG,
	},
});

export function ModalRouteWrapper({ children, modalSize = ComponentSize.LG }: ModalRouteProps): JSX.Element {
	const { isModal, closeModal } = useModalRoute();

	useEffect(() => {
		if (!isModal) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === KEY_ESCAPE) closeModal();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isModal, closeModal]);

	if (isModal) {
		return (
			<div
				className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50'
				onClick={closeModal}
				role='presentation'
			>
				<div
					className={modalContentVariants({ size: modalSize })}
					onClick={e => e.stopPropagation()}
					role='dialog'
					aria-modal='true'
				>
					{children}
				</div>
			</div>
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
