import { useTranslation } from 'react-i18next';

import { ButtonSize, ComponentSize, GameKey, LoadingKey, VariantBase } from '@/constants';
import type { SingleSessionCreditsExitProps } from '@/types';
import { Button, Card, Spinner } from '@/components';

export function SingleSessionCreditsExit({ isFinalizing, onGetCredits, onGoHome }: SingleSessionCreditsExitProps) {
	const { t } = useTranslation();
	return (
		<main className='view-main flex flex-col items-center justify-center animate-fade-in-only'>
			<div className='text-center flex flex-col items-center gap-6 max-w-md mx-auto px-4'>
				<Card className='p-6 w-full'>
					<h2 className='text-xl font-semibold text-foreground mb-2'>{t(GameKey.RUN_OUT_OF_CREDITS)}</h2>
					<p className='text-muted-foreground mb-6'>{t(GameKey.CREDITS_EXIT_DESCRIPTION)}</p>
					{isFinalizing && (
						<div className='flex flex-col items-center gap-2 mb-6'>
							<Spinner size={ComponentSize.SM} message={t(LoadingKey.PREPARING_SUMMARY)} />
						</div>
					)}
					<div className='flex flex-col sm:flex-row gap-3 justify-center'>
						<Button variant={VariantBase.DEFAULT} size={ButtonSize.LG} onClick={onGetCredits}>
							{t(GameKey.GET_CREDITS)}
						</Button>
						<Button variant={VariantBase.OUTLINE} size={ButtonSize.LG} onClick={onGoHome}>
							{t(GameKey.GO_TO_HOME)}
						</Button>
					</div>
				</Card>
			</div>
		</main>
	);
}
