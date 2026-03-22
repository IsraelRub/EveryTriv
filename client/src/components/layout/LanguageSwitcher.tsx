import { memo, useCallback, useMemo } from 'react';

import { Locale } from '@shared/constants';
import { isLocale } from '@shared/validation';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import { useAppDispatch, useAppSelector, useIsAuthenticated, useUpdateUserPreferences } from '@/hooks';
import { selectLocale } from '@/redux/selectors';
import { setLocale } from '@/redux/slices/uiPreferencesSlice';

export const LanguageSwitcher = memo(function LanguageSwitcher() {
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

	const localeNativeLabels = useMemo((): Record<Locale, string> => {
		const result: Record<Locale, string> = {
			[Locale.EN]: Locale.EN,
			[Locale.HE]: Locale.HE,
		};
		for (const code of Object.values(Locale) as Locale[]) {
			let label: string = code;
			try {
				label = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
			} catch {}
			result[code] = label;
		}
		return result;
	}, []);

	return (
		<Select value={locale} onValueChange={handleValueChange}>
			<SelectTrigger className='h-9 w-auto min-w-[4.5rem] gap-1 px-2 text-xs'>
				<SelectValue>
					<span>{localeNativeLabels[locale]}</span>
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{Object.values(Locale).map(value => (
					<SelectItem key={value} value={value}>
						{localeNativeLabels[value]}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
});
