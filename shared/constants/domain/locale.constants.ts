export enum Locale {
	EN = 'en',
	HE = 'he',
}

export const OUTPUT_LANGUAGE_LABELS: Record<Locale, string> = {
	[Locale.EN]: 'English',
	[Locale.HE]: 'Hebrew',
};

export const DEFAULT_LANGUAGE: Locale = Locale.EN;
