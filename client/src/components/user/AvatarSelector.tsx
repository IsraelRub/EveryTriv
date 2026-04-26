import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ImageOff, Trash2, Upload } from 'lucide-react';

import { AVATAR_ALLOWED_MIME_TYPES_SET, AVATAR_UPLOAD_MAX_BYTES, VALIDATION_COUNT } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import {
	ACCEPT_IMAGE,
	AnimationDelays,
	AuthKey,
	AVATAR_ID_CLEAR,
	AvatarSize,
	AvatarVariant,
	ButtonSize,
	CommonKey,
	DialogContentSize,
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
import { toast, useSetAvatar, useUploadAvatar } from '@/hooks';

function revokePreview(url: string | null): void {
	if (url?.startsWith('blob:')) {
		URL.revokeObjectURL(url);
	}
}

export function AvatarSelector({
	open,
	onOpenChange,
	currentAvatarId,
	currentAvatarUrl,
	onAvatarSaved,
}: AvatarSelectorProps) {
	const { t } = useTranslation(['auth', 'loading', 'common']);
	const [selectedAvatarId, setSelectedAvatarId] = useState<number>(currentAvatarId ?? AVATAR_ID_CLEAR);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
	const setAvatar = useSetAvatar();
	const uploadAvatar = useUploadAvatar();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const wasOpenRef = useRef(false);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			setSelectedAvatarId(currentAvatarId ?? AVATAR_ID_CLEAR);
			setPendingFile(null);
			setPreviewObjectUrl(prev => {
				revokePreview(prev);
				return null;
			});
		}
		if (!open && wasOpenRef.current) {
			setPendingFile(null);
			setPreviewObjectUrl(prev => {
				revokePreview(prev);
				return null;
			});
		}
		wasOpenRef.current = open;
	}, [open, currentAvatarId, currentAvatarUrl]);

	useEffect(() => {
		return () => {
			revokePreview(previewObjectUrl);
		};
	}, [previewObjectUrl]);

	const clearPendingUpload = useCallback(() => {
		setPendingFile(null);
		setPreviewObjectUrl(prev => {
			revokePreview(prev);
			return null;
		});
	}, []);

	const selectPreset = useCallback(
		(avatarId: number) => {
			clearPendingUpload();
			setSelectedAvatarId(avatarId);
		},
		[clearPendingUpload]
	);

	const showYourPhotoStrip =
		previewObjectUrl != null ||
		pendingFile != null ||
		(selectedAvatarId === AVATAR_ID_CLEAR && currentAvatarUrl != null && currentAvatarUrl !== '');

	const displayPhotoSrc = previewObjectUrl ?? (selectedAvatarId === AVATAR_ID_CLEAR ? currentAvatarUrl : undefined);
	const resolvedPhotoSrc =
		displayPhotoSrc != null && displayPhotoSrc !== ''
			? (toAbsoluteAvatarUrl(displayPhotoSrc, ApiConfig.baseUrl) ?? displayPhotoSrc)
			: undefined;

	const handleSave = async () => {
		if (pendingFile != null) {
			try {
				await uploadAvatar.mutateAsync(pendingFile);
				logger.userSuccess('Avatar uploaded successfully');
				onAvatarSaved?.();
				queueMicrotask(() => onOpenChange(false));
			} catch (error) {
				const errorMessage = getErrorMessage(error) || t(AuthKey.AVATAR_UPLOAD_FAILED);
				logger.userError(errorMessage, { errorInfo: { message: errorMessage } });
				toast.error({ title: errorMessage });
			}
			return;
		}

		if (!isAvatarIdOrClear(selectedAvatarId)) {
			logger.userError('Please select an avatar', { avatar: selectedAvatarId });
			toast.error({ title: t(AuthKey.AVATAR_SELECTION_REQUIRED) });
			return;
		}

		try {
			await setAvatar.mutateAsync(selectedAvatarId);
			logger.userSuccess('Avatar updated successfully', { avatar: selectedAvatarId });
			onAvatarSaved?.();
			queueMicrotask(() => onOpenChange(false));
		} catch (error) {
			const errorMessage = getErrorMessage(error) || t(AuthKey.AVATAR_UPDATE_FAILED);
			logger.userError(errorMessage, { errorInfo: { message: errorMessage }, avatar: selectedAvatarId });
			toast.error({ title: errorMessage });
		}
	};

	const handleFileChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;
			if (file.size > AVATAR_UPLOAD_MAX_BYTES) {
				const message = t(AuthKey.AVATAR_FILE_TOO_LARGE);
				logger.userError(message, {
					errorInfo: { message: 'File size exceeds 2MB limit' },
				});
				toast.error({ title: message });
				return;
			}
			const mime = (file.type ?? '').toLowerCase();
			if (!AVATAR_ALLOWED_MIME_TYPES_SET.has(mime)) {
				const message = t(AuthKey.AVATAR_INVALID_IMAGE_TYPE);
				logger.userError(message, {
					errorInfo: { message: 'Invalid MIME type' },
				});
				toast.error({ title: message });
				return;
			}
			setSelectedAvatarId(AVATAR_ID_CLEAR);
			setPendingFile(file);
			setPreviewObjectUrl(prev => {
				revokePreview(prev);
				return URL.createObjectURL(file);
			});
			e.target.value = '';
		},
		[t]
	);

	const handleRemoveCustom = useCallback(async () => {
		if (pendingFile != null) {
			clearPendingUpload();
			return;
		}
		try {
			await setAvatar.mutateAsync(AVATAR_ID_CLEAR);
			logger.userSuccess('Custom avatar removed');
			setSelectedAvatarId(AVATAR_ID_CLEAR);
		} catch (error) {
			const errorMessage = getErrorMessage(error) || t(AuthKey.AVATAR_REMOVE_FAILED);
			logger.userError(errorMessage, { errorInfo: { message: errorMessage } });
			toast.error({ title: errorMessage });
		}
	}, [pendingFile, clearPendingUpload, setAvatar, t]);

	const ringClass = (isCurrent: boolean, isSelected: boolean) =>
		cn(
			'relative h-20 w-20 rounded-full p-0 transition-all overflow-visible',
			isCurrent
				? 'ring-2 ring-muted-foreground ring-offset-2'
				: isSelected
					? 'ring-2 ring-primary ring-offset-2'
					: 'hover:ring-2 hover:ring-muted-foreground/50'
		);

	const isBusy = setAvatar.isPending || uploadAvatar.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent size={DialogContentSize.LG} className='max-h-[90vh] flex flex-col'>
				<DialogHeader className='flex-shrink-0'>
					<DialogTitle>{t(AuthKey.AVATAR)}</DialogTitle>
					<DialogDescription>{t(AuthKey.AVATAR_DESCRIPTION)}</DialogDescription>
				</DialogHeader>
				<div className='space-y-4 py-4 view-scroll-inline'>
					<Card className='bg-muted/30 p-4 space-y-3'>
						<h3 className='text-sm font-semibold text-foreground'>{t(AuthKey.YOUR_PHOTO)}</h3>
						{showYourPhotoStrip ? (
							<div className='flex flex-wrap items-center gap-3'>
								<Avatar size={AvatarSize.XL} variant={AvatarVariant.RING}>
									<AvatarImage src={resolvedPhotoSrc} alt={t(AuthKey.YOUR_PHOTO)} />
								</Avatar>
								<Button
									type='button'
									variant={VariantBase.OUTLINE}
									size={ButtonSize.SM}
									onClick={handleRemoveCustom}
									disabled={isBusy}
									className='gap-1'
								>
									<Trash2 className='h-4 w-4' />
									{pendingFile != null ? t(CommonKey.CANCEL) : t(AuthKey.REMOVE_PHOTO)}
								</Button>
							</div>
						) : (
							<>
								<input
									ref={fileInputRef}
									type='file'
									accept={ACCEPT_IMAGE}
									className='hidden'
									onChange={handleFileChange}
								/>
								<Button
									type='button'
									variant={VariantBase.OUTLINE}
									size={ButtonSize.SM}
									onClick={() => fileInputRef.current?.click()}
									disabled={isBusy}
									className='gap-2'
								>
									<Upload className='h-4 w-4' />
									{t(AuthKey.UPLOAD_PHOTO)}
								</Button>
								<p className='text-xs text-muted-foreground'>{t(AuthKey.IMAGE_FORMAT_HINT)}</p>
							</>
						)}
					</Card>
					<section className='space-y-2'>
						<h3 className='text-sm font-semibold text-foreground'>{t(AuthKey.PRESET_AVATARS)}</h3>
						<div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
							<motion.button
								key={AVATAR_ID_CLEAR}
								type='button'
								onClick={() => selectPreset(AVATAR_ID_CLEAR)}
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
										onClick={() => selectPreset(avatarId)}
										className={ringClass(isCurrent, isSelected)}
										initial={{ opacity: 0, scale: 0.8 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{
											delay: (index + 1) * AnimationDelays.STAGGER_EXTRA_SMALL,
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
					<Button variant={VariantBase.OUTLINE} onClick={() => onOpenChange(false)} disabled={isBusy}>
						{t(CommonKey.CANCEL)}
					</Button>
					<Button onClick={() => void handleSave()} disabled={isBusy}>
						{isBusy ? t(LoadingKey.SAVING) : t(CommonKey.SAVE)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
