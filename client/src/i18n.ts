import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import { DEFAULT_LANGUAGE, Locale } from '@shared/constants';
import { isRecord } from '@shared/utils';
import { isLocale } from '@shared/validation';

import { StorageKeys } from '@/constants';
import type { I18nResources } from '@/types';
import { setDocumentLocaleFromAppLocale } from '@/utils/core/direction.utils';
import enAdmin from './locales/en/admin.json';
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enErrors from './locales/en/errors.json';
import enFooter from './locales/en/footer.json';
import enGame from './locales/en/game.json';
import enHome from './locales/en/home.json';
import enLegal from './locales/en/legal.json';
import enLoading from './locales/en/loading.json';
import enNav from './locales/en/nav.json';
import enPayment from './locales/en/payment.json';
import enSocial from './locales/en/social.json';
import enStatistics from './locales/en/statistics.json';
import enValidation from './locales/en/validation.json';
import heAdmin from './locales/he/admin.json';
import heAuth from './locales/he/auth.json';
import heCommon from './locales/he/common.json';
import heErrors from './locales/he/errors.json';
import heFooter from './locales/he/footer.json';
import heGame from './locales/he/game.json';
import heHome from './locales/he/home.json';
import heLegal from './locales/he/legal.json';
import heLoading from './locales/he/loading.json';
import heNav from './locales/he/nav.json';
import hePayment from './locales/he/payment.json';
import heSocial from './locales/he/social.json';
import heStatistics from './locales/he/statistics.json';
import heValidation from './locales/he/validation.json';

const defaultNs = 'common';

const resources: I18nResources = {
	en: {
		common: enCommon,
		nav: enNav,
		loading: enLoading,
		footer: enFooter,
		validation: enValidation,
		home: enHome,
		auth: enAuth,
		errors: enErrors,
		game: enGame,
		payment: enPayment,
		admin: enAdmin,
		statistics: enStatistics,
		legal: enLegal,
		social: enSocial,
	},
	he: {
		common: heCommon,
		nav: heNav,
		loading: heLoading,
		footer: heFooter,
		validation: heValidation,
		home: heHome,
		auth: heAuth,
		errors: heErrors,
		game: heGame,
		payment: hePayment,
		admin: heAdmin,
		statistics: heStatistics,
		legal: heLegal,
		social: heSocial,
	},
};

function getPersistedLocale(): Locale | null {
	try {
		const raw = localStorage.getItem(StorageKeys.UI_PREFERENCES);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (!isRecord(parsed)) return null;
		const loc = parsed.locale;
		if (isLocale(loc)) return loc;
		return null;
	} catch {
		return null;
	}
}

void i18n.use(initReactI18next).init({
	lng: DEFAULT_LANGUAGE,
	fallbackLng: DEFAULT_LANGUAGE,
	defaultNS: defaultNs,
	ns: [
		'common',
		'nav',
		'loading',
		'footer',
		'validation',
		'home',
		'auth',
		'errors',
		'game',
		'payment',
		'admin',
		'statistics',
		'legal',
		'social',
	],
	resources,
	interpolation: {
		escapeValue: false,
	},
	react: {
		useSuspense: false,
	},
});

const persistedLocale = getPersistedLocale();
if (persistedLocale) {
	void i18n.changeLanguage(persistedLocale);
	setDocumentLocaleFromAppLocale(persistedLocale);
}

export default i18n;
