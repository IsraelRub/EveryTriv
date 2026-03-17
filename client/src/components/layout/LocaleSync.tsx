import { useEffect } from 'react';

import { Locale } from '@shared/constants';

import { useAppSelector } from '@/hooks';
import { selectLocale } from '@/redux/selectors';
import i18n from '@/i18n';

export function LocaleSync() {
	const locale = useAppSelector(selectLocale);

	useEffect(() => {
		void i18n.changeLanguage(locale);
		document.documentElement.dir = locale === Locale.HE ? 'rtl' : 'ltr';
		document.documentElement.lang = locale === Locale.HE ? Locale.HE : Locale.EN;
	}, [locale]);

	return null;
}
