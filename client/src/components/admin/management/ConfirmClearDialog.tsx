import { LoadingMessages, VariantBase } from '@/constants';
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

export function ConfirmClearDialog({
	open,
	onOpenChange,
	title,
	description,
	itemName,
	onConfirm,
	isLoading,
}: ConfirmClearDialogProps) {
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
						variant={VariantBase.DESTRUCTIVE}
						onClick={() => {
							onConfirm();
							onOpenChange(false);
						}}
						disabled={isLoading}
					>
						{isLoading ? LoadingMessages.CLEARING : `Clear All ${itemName}`}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
