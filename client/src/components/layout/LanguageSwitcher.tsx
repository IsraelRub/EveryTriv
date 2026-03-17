import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Locale } from '@shared/constants';
import { isLocale } from '@shared/validation';

import { LOCALE_KEYS } from '@/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import { useAppDispatch, useAppSelector, useIsAuthenticated, useUpdateUserPreferences } from '@/hooks';
import { selectLocale } from '@/redux/selectors';
import { setLocale } from '@/redux/slices/uiPreferencesSlice';

export const LanguageSwitcher = memo(function LanguageSwitcher() {
	const { t } = useTranslation('common');
	const locale = useAppSelector(selectLocale);
	const dispatch = useAppDispatch();
	const isAuthenticated = useIsAuthenticated();
	const updatePreferences = useUpdateUserPreferences();

	const handleValueChange = useCallback(
		(value: string) => {
			if (!isLocale(value) || value === locale) return;
			dispatch(setLocale(value));
			if (isAuthenticated) {
				updatePreferences.mutate({ locale: value });
			}
		},
		[dispatch, locale, isAuthenticated, updatePreferences]
	);

	return (
		<Select value={locale} onValueChange={handleValueChange}>
			<SelectTrigger className='h-9 w-auto min-w-[4.5rem] gap-1 px-2 text-xs'>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{Object.values(Locale).map(value => (
					<SelectItem key={value} value={value}>
						{t(LOCALE_KEYS[value])}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
});
