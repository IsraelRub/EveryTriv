import { Facebook, Instagram, Linkedin, Send, Twitter, Youtube } from 'lucide-react';

import { CONTACT_INFO, SOCIAL_LINKS } from '@shared/constants';

import { NAVIGATION_LINKS, ROUTES } from '@/constants';

export const FOOTER_CLASSNAMES = {
	wrapper: 'mt-16 border-t border-slate-800 bg-slate-950 py-10 text-slate-200',
	titleUnderline: 'absolute bottom-0 left-0 h-px w-12 bg-slate-700',
	description: 'mb-6 text-sm leading-relaxed text-slate-400',
	infoRow: 'mb-6 flex items-center gap-3',
	brandBadge: 'flex h-11 w-11 items-center justify-center rounded-md border border-slate-800 bg-slate-900',
	contactRow: 'group flex items-center text-slate-400 transition-colors duration-150 hover:text-slate-200',
	quickLink: 'flex items-center gap-2 text-sm text-slate-400 transition-colors duration-150 hover:text-white',
	socialButton:
		'flex h-10 w-10 items-center justify-center rounded-md border border-slate-800 text-slate-400 transition-colors duration-150 hover:border-slate-700 hover:text-white',
	divider: 'mt-10 border-t border-slate-800 pt-6 text-center',
	copyright: 'flex flex-col items-center gap-3 text-xs text-slate-500 md:flex-row md:gap-5',
	metaLinks: 'flex items-center gap-3 text-xs text-slate-500',
} as const;

export const FOOTER_GRADIENTS = {
	quick: 'text-slate-200',
	connect: 'text-slate-200',
} as const;

export const FOOTER_LINK_GROUPS = {
	quick: NAVIGATION_LINKS.footer.quick,
	meta: [
		{ label: 'Privacy Policy', path: ROUTES.PRIVACY },
		{ label: 'Terms of Service', path: ROUTES.TERMS },
	],
} as const;

export const FOOTER_CONTACT = CONTACT_INFO;

export const FOOTER_SOCIAL_LINKS = SOCIAL_LINKS;

export const FOOTER_SOCIAL_HEADING = 'text-sm font-semibold text-muted-foreground mb-4';

export const FOOTER_SOCIAL_ICON_WRAPPER = 'flex flex-wrap gap-4';

export const FOOTER_SOCIAL_ICON_BASE = 'text-muted-foreground transition-colors duration-200';

export const FOOTER_SOCIAL_ROW = 'flex gap-4';

export const FOOTER_SOCIAL_ROW_FIRST = 'flex gap-4 mb-2';

export const FOOTER_SOCIAL_ROW_SECOND = 'flex gap-4 mb-4';

export const FOOTER_COPYRIGHT_TEXT = 'text-xs text-muted-foreground mt-4';

export const FOOTER_SOCIAL_ICON_MAP: Record<string, typeof Facebook> = {
	Facebook,
	Twitter,
	YouTube: Youtube,
	LinkedIn: Linkedin,
	Instagram,
	Telegram: Send,
} as const;

export const FOOTER_SOCIAL_ORDER = {
	firstRow: ['Facebook', 'Twitter', 'YouTube'],
	secondRow: ['LinkedIn', 'Instagram', 'Telegram'],
} as const;
