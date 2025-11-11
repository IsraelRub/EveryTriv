import type { FeatureHighlightItem } from '../../types';

export const AUTH_VIEW_CLASSNAMES = {
	container: 'min-h-screen w-full bg-slate-950 px-12 py-24 flex items-center justify-center',
	card: 'w-full max-w-screen-2xl grid grid-cols-[420px_minmax(0,1fr)] gap-12 rounded-2xl border border-slate-800 bg-slate-950/85 p-14 shadow-2xl shadow-black/30',
	formColumn: 'flex w-full max-w-[520px] flex-col gap-10',
	formSection: 'flex flex-col gap-8',
	header: 'space-y-3 text-left',
	title: 'text-4xl font-semibold text-white',
	subtitle: 'text-base text-slate-300',
	formWrapper: 'flex flex-col gap-6 rounded-xl border border-slate-800 bg-slate-950/80 p-10',
	dividerWrapper: 'relative my-6',
	dividerLine: 'w-full border-t border-slate-800',
	divider: '',
	dividerLabel: 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 px-3 text-xs font-medium text-slate-500',
	inputLabel: 'block text-sm font-medium text-slate-200',
	inputField:
		'w-full rounded-md border border-slate-800 bg-slate-950/75 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500',
	primaryButton:
		'w-full rounded-lg bg-slate-100 py-3 text-base font-semibold text-slate-900 transition-colors duration-150 hover:bg-white',
	socialButton:
		'w-full rounded-lg border border-slate-800 bg-slate-950/80 px-5 py-3 text-base font-medium text-slate-100 transition-colors duration-150 hover:bg-slate-900',
	linkContainer: 'space-y-2 text-left',
	linkPrimary: 'text-sm text-slate-300 underline-offset-4 transition-colors duration-150 hover:text-slate-100',
	linkSecondary: 'text-sm text-slate-400',
	linkSecondaryHighlight: 'text-sm text-slate-200 underline transition-colors duration-150 hover:text-white',
	featuresColumn: 'flex h-full flex-col justify-between gap-10',
	featuresHeader: 'space-y-3 text-left',
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

