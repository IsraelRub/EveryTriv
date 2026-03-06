import { ButtonSize, ComponentSize, CREDITS_EXIT_MESSAGES, LoadingMessages, VariantBase } from '@/constants';
import { Button, Card, Spinner } from '@/components';
import type { SingleSessionCreditsExitProps } from '@/types';

export function SingleSessionCreditsExit({ isFinalizing, onGetCredits, onGoHome }: SingleSessionCreditsExitProps) {
	return (
		<main className='view-main flex flex-col items-center justify-center animate-fade-in-only'>
			<div className='text-center flex flex-col items-center gap-6 max-w-md mx-auto px-4'>
				<Card className='p-6 w-full'>
					<h2 className='text-xl font-semibold text-foreground mb-2'>{CREDITS_EXIT_MESSAGES.TITLE}</h2>
					<p className='text-muted-foreground mb-6'>{CREDITS_EXIT_MESSAGES.DESCRIPTION}</p>
					{isFinalizing && (
						<div className='flex flex-col items-center gap-2 mb-6'>
							<Spinner size={ComponentSize.SM} message={LoadingMessages.PREPARING_SUMMARY} />
						</div>
					)}
					<div className='flex flex-col sm:flex-row gap-3 justify-center'>
						<Button variant={VariantBase.DEFAULT} size={ButtonSize.LG} onClick={onGetCredits}>
							{CREDITS_EXIT_MESSAGES.GET_CREDITS}
						</Button>
						<Button variant={VariantBase.OUTLINE} size={ButtonSize.LG} onClick={onGoHome}>
							{CREDITS_EXIT_MESSAGES.GO_HOME}
						</Button>
					</div>
				</Card>
			</div>
		</main>
	);
}
