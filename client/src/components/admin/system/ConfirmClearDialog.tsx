import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { AdminKey, CommonKey, LoadingKey, VariantBase } from '@/constants';
import type { ConfirmClearDialogProps } from '@/types';
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

export function ConfirmClearDialog({
	open,
	onOpenChange,
	title,
	description,
	itemName,
	onConfirm,
	isLoading,
}: ConfirmClearDialogProps) {
	const { t } = useTranslation(['admin', 'common', 'loading']);
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className='flex items-center gap-2 text-destructive'>
						<Trash2 className='h-5 w-5 shrink-0' />
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{description}
						<br />
						<br />
						<strong className='text-destructive'>{t(AdminKey.ACTION_CANNOT_BE_UNDONE)}</strong>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>{t(CommonKey.CANCEL)}</AlertDialogCancel>
					<AlertDialogAction
						variant={VariantBase.DESTRUCTIVE}
						onClick={async () => {
							const result = onConfirm();
							if (result instanceof Promise) {
								await result;
							}
							onOpenChange(false);
						}}
						disabled={isLoading}
					>
						{isLoading ? t(LoadingKey.CLEARING) : t(AdminKey.CLEAR_ALL_ITEM, { itemName })}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
