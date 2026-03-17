import type { FooterSection } from '@/types';
import { FooterKey } from './localeKeys.constants';
import { NAVIGATION_LINKS } from './navigation.constants';

export enum FooterSectionType {
	SOCIAL = 'social',
	LINKS = 'links',
	COPYRIGHT = 'copyright',
}

export const FOOTER_SECTIONS: FooterSection[] = [
	{ titleKey: FooterKey.FOLLOW_US, type: FooterSectionType.SOCIAL },
	{ titleKey: FooterKey.QUICK_LINKS, type: FooterSectionType.LINKS, links: NAVIGATION_LINKS.footer.quick },
	{ titleKey: FooterKey.LEGAL, type: FooterSectionType.LINKS, links: NAVIGATION_LINKS.footer.legal },
	{ titleKey: FooterKey.COMPANY, type: FooterSectionType.COPYRIGHT },
];
