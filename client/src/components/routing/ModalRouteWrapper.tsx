import { motion } from 'framer-motion';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ModalSize } from '@/constants/ui/size.constants';
import { useModalRoute } from '@/hooks';
import type { ModalRouteProps } from '@/types/routing/modal.types';
import { cn } from '@/utils';

/**
 * Modal Route Wrapper Component
 * @description Wraps views to display them either as modals or full pages based on location.state
 * @param {ModalRouteProps} props - Component props
 * @returns {JSX.Element} Rendered component
 */
export function ModalRouteWrapper({ children, modalSize = ModalSize.LG }: ModalRouteProps): JSX.Element {
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
						modalSize === ModalSize.XL && 'sm:max-w-6xl',
						modalSize === ModalSize.SM && 'sm:max-w-sm',
						modalSize === ModalSize.MD && 'sm:max-w-md',
						modalSize === ModalSize.FULL && 'sm:max-w-full'
					)}
				>
					{children}
				</DialogContent>
			</Dialog>
		);
	}

	// If not modal mode, render as full page
	return (
		<motion.main
			role='main'
			aria-label='Page content'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className='min-h-screen flex items-center justify-center px-4 py-12'
		>
			{children}
		</motion.main>
	);
}
