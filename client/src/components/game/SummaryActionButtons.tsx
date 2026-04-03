import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';

import { ButtonSize, CommonKey, VariantBase } from '@/constants';
import type { SummaryActionButtonsProps } from '@/types';
import { HomeButton } from '../navigation/HomeButton';
import { SocialShare } from '../social/SocialShare';
import { Button } from '../ui/button';

export const SummaryActionButtons = memo(function SummaryActionButtons({
	playAgainTo,
	onBeforeNavigate,
	share,
}: SummaryActionButtonsProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const handlePlayAgain = useCallback(() => {
		onBeforeNavigate?.();
		navigate(playAgainTo);
	}, [playAgainTo, onBeforeNavigate, navigate]);

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center justify-center gap-4'>
				<Button variant={VariantBase.DEFAULT} size={ButtonSize.LG} onClick={handlePlayAgain}>
					<RotateCcw className='h-4 w-4 me-2' />
					{t(CommonKey.PLAY_AGAIN)}
				</Button>
				{share != null && <SocialShare {...share} />}
			</div>
			<div className='flex justify-center'>
				<HomeButton onBeforeNavigate={onBeforeNavigate} />
			</div>
		</div>
	);
});
