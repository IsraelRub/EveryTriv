import { LoadingMessages } from '@/constants';
import { FullPageSpinner } from '@/components';
import { useSingleSession } from '@/hooks';
import { SingleSessionCreditsExit } from './SingleSessionCreditsExit';
import { SingleSessionDialogs } from './SingleSessionDialogs';
import { SingleSessionLoading } from './SingleSessionLoading';
import { SingleSessionPlayArea } from './SingleSessionPlayArea';

export function SingleSessionView() {
	const session = useSingleSession();

	if (session.loading && !session.isFetchingMoreQuestions) {
		return <SingleSessionLoading message={session.loadingStep} onBeforeNavigate={session.onBeforeNavigateReset} />;
	}

	if (session.showSummaryLoading || session.isFinalizing) {
		if (session.exitReason === 'credits_exhausted') {
			return (
				<SingleSessionCreditsExit
					isFinalizing={session.isFinalizing}
					onGetCredits={session.navigateToPayment}
					onGoHome={session.handleClose}
				/>
			);
		}
		return <FullPageSpinner message={LoadingMessages.PREPARING_SUMMARY} showHomeButton={false} />;
	}

	if (!session.questions || session.questions.length === 0 || !session.currentQuestion) {
		return (
			<SingleSessionLoading
				message={session.questions?.length ? LoadingMessages.LOADING_QUESTION : LoadingMessages.NO_QUESTIONS_AVAILABLE}
				showSpinner={!!session.questions?.length}
				onBeforeNavigate={session.onBeforeNavigateReset}
			/>
		);
	}

	return (
		<>
			<SingleSessionPlayArea {...session} />
			<SingleSessionDialogs
				showExitDialog={session.showExitDialog}
				setShowExitDialog={session.setShowExitDialog}
				showErrorDialog={session.showErrorDialog}
				setShowErrorDialog={session.setShowErrorDialog}
				errorMessage={session.errorMessage}
				showCreditsWarning={session.showCreditsWarning}
				setShowCreditsWarning={session.setShowCreditsWarning}
				onExitGame={session.handleExitGame}
				onSafeExitFromLoading={session.handleSafeExitFromLoading}
			/>
		</>
	);
}
