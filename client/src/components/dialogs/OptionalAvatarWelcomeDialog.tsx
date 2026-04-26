import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AuthKey, ButtonSize, DialogContentSize, VariantBase } from '@/constants';
import type { OptionalAvatarWelcomeDialogProps } from '@/types';
import { useCurrentUserData } from '@/hooks';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { AvatarSelector } from '../user/AvatarSelector';

export function OptionalAvatarWelcomeDialog({ open, onDismiss }: OptionalAvatarWelcomeDialogProps) {
	const { t } = useTranslation(['auth']);
	const currentUser = useCurrentUserData();
	const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

	useEffect(() => {
		if (!open) {
			setAvatarSelectorOpen(false);
		}
	}, [open]);

	const handleDialogOpenChange = useCallback(
		(next: boolean) => {
			if (!next) {
				onDismiss();
			}
		},
		[onDismiss]
	);

	const finish = useCallback(() => {
		setAvatarSelectorOpen(false);
		onDismiss();
	}, [onDismiss]);

	return (
		<Dialog open={open} onOpenChange={handleDialogOpenChange}>
			<DialogContent size={DialogContentSize.MD} className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='text-center text-2xl'>{t(AuthKey.ACCOUNT_READY)}</DialogTitle>
					<DialogDescription className='text-center'>{t(AuthKey.OPTIONAL_AVATAR_PROMPT)}</DialogDescription>
				</DialogHeader>
				<div className='space-y-6 pt-1'>
					<p className='text-sm text-muted-foreground text-center'>{t(AuthKey.OPTIONAL_AVATAR_HINT)}</p>
					<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
						<Button
							type='button'
							size={ButtonSize.LG}
							className='w-full sm:w-auto'
							onClick={() => setAvatarSelectorOpen(true)}
						>
							{t(AuthKey.CHOOSE_AVATAR_BUTTON)}
						</Button>
						<Button
							type='button'
							variant={VariantBase.OUTLINE}
							size={ButtonSize.LG}
							className='w-full sm:w-auto'
							onClick={finish}
						>
							{t(AuthKey.SKIP_FOR_NOW)}
						</Button>
					</div>
					<AvatarSelector
						open={avatarSelectorOpen}
						onOpenChange={setAvatarSelectorOpen}
						currentAvatarId={currentUser?.avatar}
						currentAvatarUrl={currentUser?.avatarUrl}
						onAvatarSaved={finish}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
