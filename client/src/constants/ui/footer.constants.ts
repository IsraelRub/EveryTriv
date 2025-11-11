import { CONTACT_INFO, SOCIAL_LINKS } from '@shared/constants';
import { NAVIGATION_LINKS } from './navigation.constants';

export const FOOTER_CLASSNAMES = {
	wrapper: 'mt-16 border-t border-slate-800 bg-slate-950 py-12 text-slate-200',
	titleUnderline: 'absolute bottom-0 left-0 h-px w-12 bg-slate-700',
	description: 'mb-6 text-sm leading-relaxed text-slate-400',
	infoRow: 'mb-6 flex items-center gap-3',
	brandBadge: 'flex h-12 w-12 items-center justify-center rounded-md border border-slate-800 bg-slate-900',
	contactRow: 'group flex items-center text-slate-400 transition-colors duration-150 hover:text-slate-200',
	quickLink: 'flex items-center gap-2 text-sm text-slate-400 transition-colors duration-150 hover:text-white',
	socialButton:
		'flex h-10 w-10 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors duration-150 hover:border-slate-700 hover:text-white',
	divider: 'mt-12 border-t border-slate-800 pt-8 text-center',
	copyright: 'flex flex-col items-center gap-4 text-xs text-slate-500 md:flex-row md:gap-6',
	metaLinks: 'flex items-center gap-4 text-xs text-slate-500',
} as const;

export const FOOTER_GRADIENTS = {
	quick: 'text-slate-200',
	connect: 'text-slate-200',
} as const;

export const FOOTER_LINK_GROUPS = {
	quick: NAVIGATION_LINKS.footer.quick,
	meta: [
		{ label: 'Privacy Policy', path: '/privacy' },
		{ label: 'Terms of Service', path: '/terms' },
	],
} as const;

export const FOOTER_CONTACT = CONTACT_INFO;

export const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS;

