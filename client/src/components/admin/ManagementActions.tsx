/**
 * Management Actions Component
 *
 * @module ManagementActions
 * @description Unified component for all management clear operations
 */
import { useState } from 'react';

import { AlertTriangle, Trash2 } from 'lucide-react';

import { ButtonVariant } from '@/constants';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@/components';

import { ConfirmClearDialog } from './ConfirmClearDialog';

interface ClearOperation {
	id: string;
	title: string;
	description: string;
	itemName: string;
	currentCount?: number;
	onClear: () => void;
	isLoading?: boolean;
	icon: typeof AlertTriangle;
}

interface ManagementActionsProps {
	operations: ClearOperation[];
}

/**
 * Unified component for all management actions
 * @param props Component props
 * @returns Management actions component
 */
export function ManagementActions({ operations }: ManagementActionsProps) {
	const [openDialog, setOpenDialog] = useState<string | null>(null);
	const [selectedOperation, setSelectedOperation] = useState<ClearOperation | null>(null);

	const handleOpenDialog = (operation: ClearOperation) => {
		setSelectedOperation(operation);
		setOpenDialog(operation.id);
	};

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
									onClick={() => handleOpenDialog(operation)}
									disabled={
										operation.isLoading || (operation.currentCount !== undefined && operation.currentCount === 0)
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
