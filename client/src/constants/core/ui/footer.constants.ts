import type { FooterSection } from '@/types';
import { NAVIGATION_LINKS } from './navigation.constants';

export const FOOTER_SECTIONS: FooterSection[] = [
	{ title: 'Follow Us:', type: 'social' },
	{ title: 'Quick Links', type: 'links', links: NAVIGATION_LINKS.footer.quick },
	{ title: 'Legal', type: 'links', links: NAVIGATION_LINKS.footer.legal },
	{ title: 'Company', type: 'copyright' },
];
