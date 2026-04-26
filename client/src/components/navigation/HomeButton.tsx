import { forwardRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

import { ButtonSize, CommonKey, Routes, VariantBase } from '@/constants';
import type { HomeButtonProps } from '@/types';
import { Button } from '../ui/button';

export const HomeButton = forwardRef<HTMLButtonElement, HomeButtonProps>(({ onBeforeNavigate, className }, ref) => {
	const { t } = useTranslation();
	const navigate = useNavigate();

	const handleClick = useCallback(() => {
		onBeforeNavigate?.();
		navigate(Routes.HOME, { replace: true });
	}, [navigate, onBeforeNavigate]);

	return (
		<Button ref={ref} variant={VariantBase.OUTLINE} size={ButtonSize.LG} onClick={handleClick} className={className}>
			<Home className='h-4 w-4 mr-2' />
			{t(CommonKey.BACK_TO_HOME)}
		</Button>
	);
});
HomeButton.displayName = 'HomeButton';
