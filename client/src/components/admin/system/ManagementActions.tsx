import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { AdminKey, LoadingKey, SkeletonVariant, VariantBase } from '@/constants';
import type { ClearOperation, ManagementActionsProps } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Skeleton } from '@/components';
import { ConfirmClearDialog } from './ConfirmClearDialog';

export function ManagementActions({ operations, splitIntoTwoColumns = false }: ManagementActionsProps) {
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

	const renderOperationsAccordion = (ops: ClearOperation[]) => (
		<Accordion type='multiple' defaultValue={ops.map(op => op.id)} className='w-full rounded-lg border bg-card'>
			{ops.map(operation => {
				const Icon = operation.icon;
				return (
					<AccordionItem key={operation.id} value={operation.id}>
						<AccordionTrigger className='px-4'>
							<span className='flex items-center gap-2'>
								<Icon className='h-4 w-4 shrink-0 text-primary' />
								{operation.title}
							</span>
						</AccordionTrigger>
						<AccordionContent className='space-y-4 px-4'>
							<p className='text-sm text-muted-foreground'>{operation.description}</p>
							{operation.currentCount !== undefined && (
								<div>
									<p className='mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
										{t(AdminKey.RECORDS)}
									</p>
									<div className='text-2xl font-bold'>
										{!operation.isLoading ? (
											operation.currentCount.toLocaleString()
										) : (
											<Skeleton variant={SkeletonVariant.IconNarrow} />
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
								{!operation.isLoading ? t(AdminKey.CLEAR_ALL) : t(LoadingKey.CLEARING)}
							</Button>
						</AccordionContent>
					</AccordionItem>
				);
			})}
		</Accordion>
	);

	const useSplitLayout = splitIntoTwoColumns && operations.length > 1;
	const splitMid = Math.ceil(operations.length / 2);
	const leftColumnOps = useSplitLayout ? operations.slice(0, splitMid) : operations;
	const rightColumnOps = useSplitLayout ? operations.slice(splitMid) : [];

	return (
		<>
			{useSplitLayout ? (
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					{renderOperationsAccordion(leftColumnOps)}
					{renderOperationsAccordion(rightColumnOps)}
				</div>
			) : (
				renderOperationsAccordion(operations)
			)}

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
