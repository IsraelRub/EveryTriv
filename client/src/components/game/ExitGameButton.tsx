import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Grid2x2X, LogOut } from 'lucide-react';

import { ButtonSize, ExitGameButtonVariant, GameKey, VariantBase } from '@/constants';
import type { ExitGameButtonProps } from '@/types';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
} from '@/components';

export function ExitGameButton({
	onConfirm,
	variant = ExitGameButtonVariant.GAME,
	size = ButtonSize.SM,
	disabled = false,
}: ExitGameButtonProps) {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const isRoom = variant === ExitGameButtonVariant.ROOM;
	const actionKey = isRoom ? GameKey.LEAVE_LOBBY : GameKey.EXIT_GAME;
	const IconButton = isRoom ? Grid2x2X : LogOut;

	return (
		<>
			<Button onClick={() => setOpen(true)} variant={VariantBase.OUTLINE} size={size} disabled={disabled}>
				<IconButton className='h-4 w-4 me-2' />
				{t(actionKey)}
			</Button>
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(actionKey)}</AlertDialogTitle>
						<AlertDialogDescription>{t(GameKey.EXIT_GAME_CONFIRM_DESCRIPTION)}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t(GameKey.CONTINUE_PLAYING)}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								onConfirm();
								setOpen(false);
							}}
						>
							{t(actionKey)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
