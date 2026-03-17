import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { AdminKey, LoadingKey, SkeletonVariant, VariantBase } from '@/constants';
import type { ClearOperation, ManagementActionsProps } from '@/types';
import { Button, SectionCard, Skeleton } from '@/components';
import { ConfirmClearDialog } from './ConfirmClearDialog';

export function ManagementActions({ operations }: ManagementActionsProps) {
	const { t } = useTranslation(['admin', 'loading']);
	const [openDialog, setOpenDialog] = useState<string | null>(null);
	const [selectedOperation, setSelectedOperation] = useState<ClearOperation | null>(null);

	const handleConfirm = async () => {
		if (!selectedOperation) return;
		const result = selectedOperation.onClear();
		if (result instanceof Promise) {
			await result;
		}
		setOpenDialog(null);
		setSelectedOperation(null);
	};

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{operations.map(operation => (
					<SectionCard
						key={operation.id}
						title={operation.title}
						icon={operation.icon}
						description={operation.description}
						contentClassName='space-y-4'
					>
						{operation.currentCount !== undefined && (
							<div>
								<p className='text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1'>
									{t(AdminKey.RECORDS)}
								</p>
								<div className='text-2xl font-bold'>
									{operation.isLoading ? (
										<Skeleton variant={SkeletonVariant.IconNarrow} />
									) : (
										operation.currentCount.toLocaleString()
									)}
								</div>
							</div>
						)}
						<Button
							variant={VariantBase.DESTRUCTIVE}
							onClick={() => {
								setSelectedOperation(operation);
								setOpenDialog(operation.id);
							}}
							disabled={operation.isLoading ?? (operation.currentCount !== undefined && operation.currentCount === 0)}
							className='w-full'
						>
							<Trash2 className='h-4 w-4 me-2 shrink-0' />
							{operation.isLoading ? t(LoadingKey.CLEARING) : t(AdminKey.CLEAR_ALL)}
						</Button>
					</SectionCard>
				))}
			</div>

			{selectedOperation && (
				<ConfirmClearDialog
					open={openDialog === selectedOperation.id}
					onOpenChange={open => {
						if (!open) {
							setOpenDialog(null);
							setSelectedOperation(null);
						}
					}}
					title={selectedOperation.title}
					description={selectedOperation.description}
					itemName={selectedOperation.itemName}
					onConfirm={handleConfirm}
					isLoading={selectedOperation.isLoading ?? false}
				/>
			)}
		</>
	);
}
