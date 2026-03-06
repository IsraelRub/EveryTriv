import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { VALIDATION_COUNT } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { ANIMATION_DELAYS, LoadingMessages, SPRING_CONFIGS, VariantBase } from '@/constants';
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
import { useSetAvatar } from '@/hooks';
import { clientLogger as logger } from '@/services';
import type { AvatarSelectorProps } from '@/types';
import { cn, getAvatarUrl, isValidAvatarId, repeat } from '@/utils';

export function AvatarSelector({ open, onOpenChange, currentAvatarId }: AvatarSelectorProps) {
	const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(currentAvatarId ?? null);
	const setAvatar = useSetAvatar();

	useEffect(() => {
		if (open) {
			setSelectedAvatarId(currentAvatarId ?? null);
		}
	}, [open, currentAvatarId]);

	const handleSave = async () => {
		if (!selectedAvatarId || !isValidAvatarId(selectedAvatarId)) {
			logger.userError('Please select an avatar', { avatar: selectedAvatarId ?? undefined });
			return;
		}

		try {
			await setAvatar.mutateAsync(selectedAvatarId);
			logger.userSuccess('Avatar updated successfully', { avatar: selectedAvatarId });
			onOpenChange(false);
		} catch (error) {
			const errorMessage = getErrorMessage(error) || 'Failed to update avatar';
			logger.userError('Failed to update avatar', { errorInfo: { message: errorMessage }, avatar: selectedAvatarId });
		}
	};

	const ringClass = (isCurrent: boolean, isSelected: boolean) =>
		cn(
			'relative h-20 w-20 rounded-full p-0 transition-all overflow-visible',
			isCurrent
				? 'ring-2 ring-muted-foreground ring-offset-2'
				: isSelected
					? 'ring-2 ring-primary ring-offset-2'
					: 'hover:ring-2 hover:ring-muted-foreground/50'
		);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-2xl max-h-[90vh] flex flex-col'>
				<DialogHeader className='flex-shrink-0'>
					<DialogTitle>Select Avatar</DialogTitle>
					<DialogDescription>Choose an avatar from the available options</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 py-4 view-scroll-inline'>
					<div className='grid grid-cols-4 gap-2'>
						{repeat(VALIDATION_COUNT.AVATAR_ID.MAX, i => i + 1).map((avatarId, index) => {
							const isSelected = selectedAvatarId === avatarId;
							const isCurrent = currentAvatarId === avatarId;

							return (
								<motion.button
									key={avatarId}
									type='button'
									onClick={() => setSelectedAvatarId(avatarId)}
									className={ringClass(isCurrent, isSelected)}
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{
										delay: index * ANIMATION_DELAYS.STAGGER_EXTRA_SMALL,
										...SPRING_CONFIGS.ICON_SPRING,
									}}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<Avatar className='h-full w-full'>
										<AvatarImage src={getAvatarUrl(avatarId)} />
									</Avatar>
									{isSelected && (
										<div className='absolute inset-[-4px] rounded-full border-2 border-primary pointer-events-none' />
									)}
								</motion.button>
							);
						})}
					</div>
				</div>
				<DialogFooter className='flex-shrink-0'>
					<Button variant={VariantBase.OUTLINE} onClick={() => onOpenChange(false)} disabled={setAvatar.isPending}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={setAvatar.isPending || !selectedAvatarId}>
						{setAvatar.isPending ? LoadingMessages.SAVING : 'Save'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
