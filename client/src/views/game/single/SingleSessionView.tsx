import { ExitReason, LoadingMessages } from '@/constants';
import { FullPageSpinner } from '@/components';
import { useSingleSession } from '@/hooks';
import { SingleSessionCreditsExit } from './SingleSessionCreditsExit';
import { SingleSessionDialogs } from './SingleSessionDialogs';
import { SingleSessionPlayArea } from './SingleSessionPlayArea';

export function SingleSessionView() {
	const session = useSingleSession();

	const sessionDialogs = (
		<SingleSessionDialogs
			showErrorDialog={session.showErrorDialog}
			setShowErrorDialog={session.setShowErrorDialog}
			sessionError={session.sessionError}
			showCreditsWarning={session.showCreditsWarning}
			setShowCreditsWarning={session.setShowCreditsWarning}
			onSafeExitFromLoading={session.handleSafeExitFromLoading}
			showBackToGameSettings={session.questions.length === 0}
			onBackToGameSettings={session.navigateToGameSettings}
		/>
	);

	if (session.loading && !session.isFetchingMoreQuestions) {
		return (
			<>
				<FullPageSpinner message={session.loadingStep} onBeforeNavigate={session.onBeforeNavigateReset} />
				{sessionDialogs}
			</>
		);
	}

	if (session.showSummaryLoading || session.isFinalizing) {
		if (session.exitReason === ExitReason.CREDITS_EXHAUSTED) {
			return (
				<>
					<SingleSessionCreditsExit
						isFinalizing={session.isFinalizing}
						onGetCredits={session.navigateToPayment}
						onGoHome={session.handleClose}
					/>
					{sessionDialogs}
				</>
			);
		}
		return (
			<>
				<FullPageSpinner message={LoadingMessages.PREPARING_SUMMARY} showHomeButton={false} />
				{sessionDialogs}
			</>
		);
	}

	if (!session.questions || session.questions.length === 0 || !session.currentQuestion) {
		return (
			<>
				<FullPageSpinner
					message={
						session.questions?.length ? LoadingMessages.LOADING_QUESTION : LoadingMessages.NO_QUESTIONS_AVAILABLE
					}
					showSpinner={!!session.questions?.length}
					onBeforeNavigate={session.onBeforeNavigateReset}
				/>
				{sessionDialogs}
			</>
		);
	}

	return (
		<>
			<SingleSessionPlayArea {...session} />
			{sessionDialogs}
		</>
	);
}
