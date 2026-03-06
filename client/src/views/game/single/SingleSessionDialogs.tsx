import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components';
import type { SingleSessionDialogsProps } from '@/types';

export function SingleSessionDialogs({
	showExitDialog,
	setShowExitDialog,
	showErrorDialog,
	setShowErrorDialog,
	errorMessage,
	showCreditsWarning,
	setShowCreditsWarning,
	onExitGame,
	onSafeExitFromLoading,
}: SingleSessionDialogsProps) {
	return (
		<>
			<AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Exit Game</AlertDialogTitle>
						<AlertDialogDescription>Are you sure you want to quit? Your progress will be lost.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Continue Playing</AlertDialogCancel>
						<AlertDialogAction onClick={onExitGame}>Exit Game</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Error</AlertDialogTitle>
						<AlertDialogDescription>{errorMessage}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={onSafeExitFromLoading}>OK</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showCreditsWarning} onOpenChange={setShowCreditsWarning}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Last Question Warning</AlertDialogTitle>
						<AlertDialogDescription>You have one credit left. This will be your last question.</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowCreditsWarning(false)}>Continue</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
