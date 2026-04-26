import { useTranslation } from 'react-i18next';

import { GameKey, VariantBase } from '@/constants';
import type { SingleSessionDialogsProps } from '@/types';
import { getTranslatedErrorMessage } from '@/utils';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
} from '@/components';

export function SingleSessionDialogs({
	showErrorDialog,
	setShowErrorDialog,
	sessionError,
	showCreditsWarning,
	setShowCreditsWarning,
	onSafeExitFromLoading,
	showBackToGameSettings = false,
	onBackToGameSettings,
}: SingleSessionDialogsProps) {
	const { t } = useTranslation();
	return (
		<>
			<AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(GameKey.ERROR)}</AlertDialogTitle>
						<AlertDialogDescription>
							{sessionError != null ? getTranslatedErrorMessage(t, sessionError) : ''}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className='flex-col gap-2 sm:flex-row sm:justify-end'>
						{showBackToGameSettings && onBackToGameSettings != null && (
							<Button
								type='button'
								variant={VariantBase.OUTLINE}
								className='w-full sm:w-auto'
								onClick={onBackToGameSettings}
							>
								{t(GameKey.BACK_TO_GAME_SETTINGS)}
							</Button>
						)}
						<AlertDialogAction className='w-full sm:w-auto' onClick={onSafeExitFromLoading}>
							{t(GameKey.OK)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showCreditsWarning} onOpenChange={setShowCreditsWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t(GameKey.LAST_QUESTION_WARNING)}</AlertDialogTitle>
						<AlertDialogDescription>{t(GameKey.ONE_CREDIT_LEFT)}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowCreditsWarning(false)}>{t(GameKey.CONTINUE)}</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
