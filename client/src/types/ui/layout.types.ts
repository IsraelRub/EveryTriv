import type { FooterKey, NavKey, TabsListVariant } from '@/constants';

export interface TabsBarProps {
	items: ReadonlyArray<TabsBarItem>;
	variant: TabsBarVariant;

	columns?: 2 | 3;
}

export interface SecondaryTabsBarProps {
	items: ReadonlyArray<SecondaryTabsBarItem>;

	columns?: 2 | 3;
}

export type FooterSection =
	| { titleKey: FooterKey; type: 'social' }
	| { titleKey: FooterKey; type: 'links'; links: readonly { labelKey: NavKey; path: string }[] }
	| { titleKey: FooterKey; type: 'copyright' };
export interface TabsBarItem {
	value: string;
	label: string;
}

export type TabsBarVariant = TabsListVariant.COMPACT | TabsListVariant.SECONDARY;

export interface SecondaryTabsBarItem {
	value: string;
	label: string;
}
