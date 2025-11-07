/**
 * Confirmation Modal Component
 *
 * @module ConfirmModal
 * @description Reusable confirmation modal for user actions
 */

import { motion } from 'framer-motion';

import { AlertVariant, ButtonVariant, ModalSize } from '../../constants';
import type { ConfirmModalProps } from '../../types';
import { Button } from './Button';
import { Modal } from './Modal';

export default function ConfirmModal({
	open,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = AlertVariant.INFO,
	isLoading = false,
}: ConfirmModalProps) {
	const getVariantStyles = () => {
		switch (variant) {
			case AlertVariant.ERROR:
				return {
					titleColor: 'text-red-400',
					confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
					icon: '⚠️',
				};
			case AlertVariant.WARNING:
				return {
					titleColor: 'text-yellow-400',
					confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
					icon: '⚠️',
				};
			case AlertVariant.INFO:
			default:
				return {
					titleColor: 'text-blue-400',
					confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
					icon: 'ℹ️',
				};
		}
	};

	const styles = getVariantStyles();

	return (
		<Modal open={open} onClose={onClose} size={ModalSize.MD}>
			<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='p-6'>
				<div className='flex items-center mb-4'>
					<span className='text-2xl mr-3'>{styles.icon}</span>
					<h3 className={`text-xl font-bold ${styles.titleColor}`}>{title}</h3>
				</div>

				<p className='text-slate-300 mb-6 leading-relaxed'>{message}</p>

				<div className='flex gap-3 justify-end'>
					<Button variant={ButtonVariant.GHOST} onClick={onClose} disabled={isLoading} className='px-6 py-2'>
						{cancelText}
					</Button>
					<Button onClick={onConfirm} disabled={isLoading} className={`px-6 py-2 ${styles.confirmButton}`}>
						{isLoading ? 'Processing...' : confirmText}
					</Button>
				</div>
			</motion.div>
		</Modal>
	);
}
