/**
 * Confirm Clear Dialog Component
 *
 * @module ConfirmClearDialog
 * @description Reusable confirmation dialog for destructive clear operations
 */
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components';

import type { ConfirmClearDialogProps } from '@/types';

/**
 * Reusable confirmation dialog for destructive clear operations
 * @param props Component props
 * @returns Confirmation dialog component
 */
export function ConfirmClearDialog({
	open,
	onOpenChange,
	title,
	description,
	itemName,
	onConfirm,
	isLoading = false,
}: ConfirmClearDialogProps) {
	const handleConfirm = () => {
		onConfirm();
		onOpenChange(false);
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className='text-destructive'>{title}</AlertDialogTitle>
					<AlertDialogDescription>
						{description}
						<br />
						<br />
						<strong className='text-destructive'>This action cannot be undone.</strong>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						disabled={isLoading}
						className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
					>
						{isLoading ? 'Clearing...' : `Clear All ${itemName}`}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
