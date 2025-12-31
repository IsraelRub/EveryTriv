import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { VALIDATION_COUNT } from '@shared/constants';
import { ButtonVariant, ToastVariant } from '@/constants';
import {
	Avatar,
	AvatarImage,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components';
import { useSetAvatar, useToast } from '@/hooks';
import { clientLogger as logger } from '@/services';
import type { AvatarSelectorProps } from '@/types';
import { cn, getAvatarUrl, isValidAvatarId } from '@/utils';

export function AvatarSelector({ open, onOpenChange, currentAvatarId }: AvatarSelectorProps) {
	const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(currentAvatarId || null);
	const setAvatar = useSetAvatar();
	const { toast } = useToast();

	// Reset selected avatar when dialog opens/closes or currentAvatarId changes
	useEffect(() => {
		if (open) {
			setSelectedAvatarId(currentAvatarId || null);
		}
	}, [open, currentAvatarId]);

	const handleSave = async () => {
		if (!selectedAvatarId || !isValidAvatarId(selectedAvatarId)) {
			toast({
				title: 'Error',
				description: 'Please select an avatar',
				variant: ToastVariant.DESTRUCTIVE,
			});
			return;
		}

		try {
			await setAvatar.mutateAsync(selectedAvatarId);
			toast({
				title: 'Success',
				description: 'Avatar updated successfully',
			});
			onOpenChange(false);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: typeof error === 'object' && error !== null && 'message' in error
						? String(error.message)
						: 'Failed to update avatar';
			logger.userError('Failed to update avatar', { error: errorMessage, avatar: selectedAvatarId });
			toast({
				title: 'Error',
				description: errorMessage,
				variant: ToastVariant.DESTRUCTIVE,
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<DialogTitle>Select Avatar</DialogTitle>
					<DialogDescription>Choose an avatar from the available options</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 py-4'>
					{/* Avatar Grid - 4x4 */}
					<div className='grid grid-cols-4 gap-2'>
						{Array.from({ length: VALIDATION_COUNT.AVATAR_ID.MAX }, (_, i) => i + 1).map((avatarId, index) => {
							const isSelected = selectedAvatarId === avatarId;
							const isCurrent = currentAvatarId === avatarId;

							return (
								<motion.button
									key={avatarId}
									type='button'
									onClick={() => setSelectedAvatarId(avatarId)}
									className={cn(
										'relative h-20 w-20 rounded-full p-0 transition-all overflow-visible',
										// Current avatar always shows gray ring (outer ring)
										isCurrent
											? 'ring-2 ring-muted-foreground ring-offset-2'
											: isSelected
												? 'ring-3 ring-primary ring-offset-2'
												: 'hover:ring-2 hover:ring-muted-foreground/50'
									)}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{
										delay: index * 0.03,
										duration: 0.3,
										type: 'spring',
										stiffness: 200,
										damping: 20,
									}}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Avatar className='h-full w-full'>
										<AvatarImage src={getAvatarUrl(avatarId)} alt={`Avatar ${avatarId}`} />
									</Avatar>
									{/* Blue ring for selected avatar (inner ring when both current and selected) */}
									{isSelected && (
										<div className='absolute inset-[-4px] rounded-full border-2 border-primary pointer-events-none' />
									)}
								</motion.button>
							);
						})}
					</div>
				</div>
				<DialogFooter>
					<Button variant={ButtonVariant.OUTLINE} onClick={() => onOpenChange(false)} disabled={setAvatar.isPending}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={setAvatar.isPending || !selectedAvatarId}>
						{setAvatar.isPending ? 'Saving...' : 'Save'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
