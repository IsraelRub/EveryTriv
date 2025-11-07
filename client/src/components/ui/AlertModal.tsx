/**
 * Alert Modal Component
 *
 * @module AlertModal
 * @description Reusable alert modal for notifications
 */

import { motion } from 'framer-motion';

import { AlertVariant, ButtonVariant, ModalSize } from '../../constants';
import type { AlertModalProps } from '../../types';
import { Button } from './Button';
import { Modal } from './Modal';

export default function AlertModal({
	open,
	onClose,
	title,
	message,
	variant = AlertVariant.INFO,
	buttonText = 'OK',
}: AlertModalProps) {
	const getVariantStyles = () => {
		switch (variant) {
			case AlertVariant.SUCCESS:
				return {
					titleColor: 'text-green-400',
					icon: '✅',
				};
			case AlertVariant.ERROR:
				return {
					titleColor: 'text-red-400',
					icon: '❌',
				};
			case AlertVariant.WARNING:
				return {
					titleColor: 'text-yellow-400',
					icon: '⚠️',
				};
			case AlertVariant.INFO:
			default:
				return {
					titleColor: 'text-blue-400',
					icon: 'ℹ️',
				};
		}
	};

	const styles = getVariantStyles();

	return (
		<Modal open={open} onClose={onClose} size={ModalSize.SM}>
			<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='p-6'>
				<div className='flex items-center mb-4'>
					<span className='text-2xl mr-3'>{styles.icon}</span>
					<h3 className={`text-xl font-bold ${styles.titleColor}`}>{title}</h3>
				</div>

				<p className='text-slate-300 mb-6 leading-relaxed'>{message}</p>

				<div className='flex justify-end'>
					<Button variant={ButtonVariant.PRIMARY} onClick={onClose} className='px-6 py-2'>
						{buttonText}
					</Button>
				</div>
			</motion.div>
		</Modal>
	);
}
