import type { ReactNode } from 'react';

import type { FooterKeyType, LegalKeyType, NavKeyType, TabsListVariant } from '@/constants';

export interface LegalPageLayoutProps {
	icon: ReactNode;
	titleKey: LegalKeyType;
	children: ReactNode;
}

export interface TabsBarItem {
	value: string;
	label: string;
}

export type TabsBarVariant = TabsListVariant.COMPACT | TabsListVariant.SECONDARY;

export interface TabsBarProps {
	items: ReadonlyArray<TabsBarItem>;
	variant: TabsBarVariant;
	/** Only for variant SECONDARY: grid with this many columns. */
	columns?: 2 | 3;
}

export interface SecondaryTabsBarItem {
	value: string;
	label: string;
}

export interface SecondaryTabsBarProps {
	items: ReadonlyArray<SecondaryTabsBarItem>;
	/** When set, the bar uses a grid with this many columns and centered layout. */
	columns?: 2 | 3;
}

export type FooterSection =
	| { titleKey: FooterKeyType; type: 'social' }
	| { titleKey: FooterKeyType; type: 'links'; links: readonly { labelKey: NavKeyType; path: string }[] }
	| { titleKey: FooterKeyType; type: 'copyright' };
