import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ImageOff, Trash2, Upload } from 'lucide-react';

import { AVATAR_ALLOWED_MIME_TYPES_SET, AVATAR_UPLOAD_MAX_BYTES, VALIDATION_COUNT } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import {
	ACCEPT_IMAGE,
	ANIMATION_DELAYS,
	AuthKey,
	AVATAR_ID_CLEAR,
	AvatarSize,
	AvatarVariant,
	ButtonSize,
	CommonKey,
	LoadingKey,
	SPRING_CONFIGS,
	VariantBase,
} from '@/constants';
import type { AvatarSelectorProps } from '@/types';
import { ApiConfig, clientLogger as logger } from '@/services';
import { cn, getAvatarUrl, isAvatarIdOrClear, repeat, toAbsoluteAvatarUrl } from '@/utils';
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components';
import { useSetAvatar, useUploadAvatar } from '@/hooks';

export function AvatarSelector({ open, onOpenChange, currentAvatarId, currentAvatarUrl }: AvatarSelectorProps) {
	const { t } = useTranslation(['auth', 'loading', 'common']);
	const [selectedAvatarId, setSelectedAvatarId] = useState<number>(currentAvatarId ?? AVATAR_ID_CLEAR);
	const setAvatar = useSetAvatar();
	const uploadAvatar = useUploadAvatar();
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (open) {
			setSelectedAvatarId(currentAvatarId ?? AVATAR_ID_CLEAR);
		}
	}, [open, currentAvatarId]);

	const handleSave = async () => {
		if (!isAvatarIdOrClear(selectedAvatarId)) {
			logger.userError('Please select an avatar', { avatar: selectedAvatarId });
			return;
		}

		try {
			await setAvatar.mutateAsync(selectedAvatarId);
			logger.userSuccess('Avatar updated successfully', { avatar: selectedAvatarId });
			onOpenChange(false);
		} catch (error) {
			const errorMessage = getErrorMessage(error) || t(AuthKey.AVATAR_UPDATE_FAILED);
			logger.userError(errorMessage, { errorInfo: { message: errorMessage }, avatar: selectedAvatarId });
		}
	};

	const handleFileChange = useCallback(
		async (e: ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			if (file.size > AVATAR_UPLOAD_MAX_BYTES) {
				logger.userError('Image is too large. Maximum size is 2MB.', {
					errorInfo: { message: 'File size exceeds 2MB limit' },
				});
				return;
			}
			const mime = (file.type ?? '').toLowerCase();
			if (!AVATAR_ALLOWED_MIME_TYPES_SET.has(mime)) {
				logger.userError('Invalid image type. Use JPEG, PNG, or WebP.', {
					errorInfo: { message: 'Invalid MIME type' },
				});
				return;
			}
			try {
				await uploadAvatar.mutateAsync(file);
				logger.userSuccess('Avatar uploaded successfully');
				onOpenChange(false);
			} catch (error) {
				const errorMessage = getErrorMessage(error) || t(AuthKey.AVATAR_UPLOAD_FAILED);
				logger.userError(errorMessage, { errorInfo: { message: errorMessage } });
			}
			e.target.value = '';
		},
		[uploadAvatar, onOpenChange, t]
	);

	const handleRemoveCustom = useCallback(async () => {
		try {
			await setAvatar.mutateAsync(AVATAR_ID_CLEAR);
			logger.userSuccess('Custom avatar removed');
			setSelectedAvatarId(AVATAR_ID_CLEAR);
		} catch (error) {
			const errorMessage = getErrorMessage(error) || t(AuthKey.AVATAR_REMOVE_FAILED);
			logger.userError(errorMessage, { errorInfo: { message: errorMessage } });
		}
	}, [setAvatar, t]);

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
					<DialogTitle>{t(AuthKey.AVATAR)}</DialogTitle>
					<DialogDescription>{t(AuthKey.AVATAR_DESCRIPTION)}</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 py-4 view-scroll-inline'>
					<Card className='bg-muted/30 p-4 space-y-3'>
						<h3 className='text-sm font-semibold text-foreground'>{t(AuthKey.YOUR_PHOTO)}</h3>
						{currentAvatarUrl ? (
							<div className='flex flex-wrap items-center gap-3'>
								<Avatar size={AvatarSize.XL} variant={AvatarVariant.RING}>
									<AvatarImage
										src={toAbsoluteAvatarUrl(currentAvatarUrl, ApiConfig.getBaseUrl()) ?? currentAvatarUrl}
										alt={t(AuthKey.YOUR_PHOTO)}
									/>
								</Avatar>
								<Button
									type='button'
									variant={VariantBase.OUTLINE}
									size={ButtonSize.SM}
									onClick={handleRemoveCustom}
									disabled={setAvatar.isPending}
									className='gap-1'
								>
									<Trash2 className='h-4 w-4' />
									{t(AuthKey.REMOVE_PHOTO)}
								</Button>
							</div>
						) : (
							<>
								<input
									ref={fileInputRef}
									type='file'
									accept={ACCEPT_IMAGE}
									className='sr-only'
									onChange={handleFileChange}
								/>
								<Button
									type='button'
									variant={VariantBase.OUTLINE}
									size={ButtonSize.SM}
									onClick={() => fileInputRef.current?.click()}
									disabled={uploadAvatar.isPending}
									className='gap-2'
								>
									<Upload className='h-4 w-4' />
									{uploadAvatar.isPending ? t(LoadingKey.SAVING) : t(AuthKey.UPLOAD_PHOTO)}
								</Button>
								<p className='text-xs text-muted-foreground'>{t(AuthKey.IMAGE_FORMAT_HINT)}</p>
							</>
						)}
					</Card>
					<section className='space-y-2'>
						<h3 className='text-sm font-semibold text-foreground'>{t(AuthKey.PRESET_AVATARS)}</h3>
						<div className='grid grid-cols-4 gap-2'>
							<motion.button
								key={AVATAR_ID_CLEAR}
								type='button'
								onClick={() => setSelectedAvatarId(AVATAR_ID_CLEAR)}
								className={ringClass(
									currentAvatarId == null || currentAvatarId === AVATAR_ID_CLEAR,
									selectedAvatarId === AVATAR_ID_CLEAR
								)}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{
									delay: 0,
									...SPRING_CONFIGS.ICON_SPRING,
								}}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								title={t(AuthKey.NO_AVATAR)}
							>
								<Avatar size={AvatarSize.FULL}>
									<AvatarFallback>
										<ImageOff className='h-10 w-10 text-muted-foreground' />
									</AvatarFallback>
								</Avatar>
								{selectedAvatarId === AVATAR_ID_CLEAR && (
									<div className='absolute inset-[-4px] rounded-full border-2 border-primary pointer-events-none' />
								)}
							</motion.button>
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
											delay: (index + 1) * ANIMATION_DELAYS.STAGGER_EXTRA_SMALL,
											...SPRING_CONFIGS.ICON_SPRING,
										}}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Avatar size={AvatarSize.FULL}>
											<AvatarImage src={getAvatarUrl(avatarId)} />
										</Avatar>
										{isSelected && (
											<div className='absolute inset-[-4px] rounded-full border-2 border-primary pointer-events-none' />
										)}
									</motion.button>
								);
							})}
						</div>
					</section>
				</div>
				<DialogFooter className='flex-shrink-0'>
					<Button
						variant={VariantBase.OUTLINE}
						onClick={() => onOpenChange(false)}
						disabled={setAvatar.isPending || uploadAvatar.isPending}
					>
						{t(CommonKey.CANCEL)}
					</Button>
					<Button onClick={handleSave} disabled={setAvatar.isPending || uploadAvatar.isPending}>
						{setAvatar.isPending ? t(LoadingKey.SAVING) : t(CommonKey.SAVE)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
