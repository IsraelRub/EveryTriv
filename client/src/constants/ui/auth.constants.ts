import type { FeatureHighlightItem } from '../../types';

export const AUTH_VIEW_CLASSNAMES = {
	container: 'auth-view-layout bg-slate-950 px-6 py-12 lg:px-10 lg:py-20 2xl:px-24',
	card: 'w-full max-w-screen-2xl grid gap-8 rounded-2xl border border-slate-900/60 bg-slate-950/85 p-8 shadow-2xl shadow-black/25 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-12 lg:p-12 xl:grid-cols-[420px_minmax(0,1fr)] xl:p-14 2xl:grid-cols-[460px_minmax(0,1fr)] 2xl:gap-16 2xl:p-16',
	formColumn: 'flex w-full max-w-[480px] flex-col gap-8 xl:max-w-[520px] xl:gap-10',
	formSection: 'flex flex-col gap-7 xl:gap-8',
	header: 'space-y-3 xl:space-y-4 text-left',
	title: 'text-4xl xl:text-5xl font-semibold text-white',
	subtitle: 'text-base xl:text-lg text-slate-300',
	formWrapper:
		'flex flex-col gap-5 rounded-xl border border-slate-900/50 bg-slate-950/75 p-6 lg:p-8 xl:gap-6 xl:p-9 shadow-inner shadow-black/20',
	dividerWrapper: 'relative my-5 xl:my-6',
	dividerLine: 'w-full border-t border-slate-900/60',
	dividerLabel:
		'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-3 xl:px-4 text-xs xl:text-sm font-medium text-slate-500',
	inputLabel: 'block text-sm font-medium text-slate-200',
	inputField:
		'w-full rounded-md border border-slate-900/60 bg-slate-950/70 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500',
	primaryButton:
		'w-full rounded-lg bg-slate-100 py-3 xl:py-3.5 text-base xl:text-lg font-semibold text-slate-900 transition-colors duration-150 hover:bg-white',
	socialButton:
		'w-full rounded-lg border border-slate-900/60 bg-slate-950/70 px-5 py-3 xl:py-3.5 text-base font-medium text-slate-100 transition-colors duration-150 hover:bg-slate-900/80',
	linkContainer: 'space-y-2 xl:space-y-3 text-left',
	linkPrimary: 'text-sm text-slate-300 underline-offset-4 transition-colors duration-150 hover:text-slate-100',
	linkSecondary: 'text-sm xl:text-base text-slate-400',
	linkSecondaryHighlight:
		'text-sm xl:text-base text-slate-200 underline transition-colors duration-150 hover:text-white',
	featuresColumn: 'flex h-full flex-col justify-between gap-8 xl:gap-10 2xl:gap-12',
	featuresHeader: 'space-y-2 xl:space-y-3 text-left',
} as const;

export const LOGIN_FEATURE_HIGHLIGHTS: FeatureHighlightItem[] = [
	{
		id: 'auth-secure',
		icon: 'checkcircle',
		label: 'Secure Login',
		accent: 'green',
	},
	{
		id: 'auth-track',
		icon: 'list',
		label: 'Track Progress',
		accent: 'blue',
	},
	{
		id: 'auth-sync',
		icon: 'refreshcw',
		label: 'Sync Data',
		accent: 'purple',
	},
];

/**
 * OAuth error types for specific handling
 */
export const OAUTH_ERROR_TYPES = {
	INVALID_CLIENT: 'invalid_client',
	OAUTH_FAILED: 'oauth_failed',
	NO_TOKEN: 'no_token',
	UNEXPECTED_ERROR: 'unexpected_error',
} as const;
