import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import { ButtonVariant } from '@/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';
import type { ClearOperation } from '@/types';
import { ConfirmClearDialog } from './ConfirmClearDialog';

export function ManagementActions({ operations }: { operations: ClearOperation[] }) {
	const [openDialog, setOpenDialog] = useState<string | null>(null);
	const [selectedOperation, setSelectedOperation] = useState<ClearOperation | null>(null);

	const handleConfirm = () => {
		if (selectedOperation) {
			selectedOperation.onClear();
			setOpenDialog(null);
			setSelectedOperation(null);
		}
	};

	return (
		<>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{operations.map(operation => {
					const Icon = operation.icon;
					return (
						<Card key={operation.id}>
							<CardHeader>
								<CardTitle className='flex items-center gap-2'>
									<Icon className='h-5 w-5' />
									{operation.title}
								</CardTitle>
								<CardDescription>{operation.description}</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4'>
								{operation.currentCount !== undefined && (
									<div className='text-2xl font-bold'>
										{operation.isLoading ? <Skeleton className='h-8 w-20' /> : operation.currentCount.toLocaleString()}
									</div>
								)}
								<Button
									variant={ButtonVariant.DESTRUCTIVE}
									onClick={() => {
										setSelectedOperation(operation);
										setOpenDialog(operation.id);
									}}
									disabled={
										operation.isLoading ?? (operation.currentCount !== undefined && operation.currentCount === 0)
									}
									className='w-full'
								>
									<Trash2 className='h-4 w-4 mr-2' />
									{operation.isLoading ? 'Clearing...' : 'Clear All'}
								</Button>
							</CardContent>
						</Card>
					);
				})}
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
					isLoading={selectedOperation.isLoading}
				/>
			)}
		</>
	);
}
