import type { FooterKey, NavKey, TabsListVariant } from '@/constants';



export interface TabsBarProps {
	items: ReadonlyArray<TabsBarItem>;
	variant: TabsBarVariant;
	/** Only for variant SECONDARY: grid with this many columns. */
	columns?: 2 | 3;
}


export interface SecondaryTabsBarProps {
	items: ReadonlyArray<SecondaryTabsBarItem>;
	/** When set, the bar uses a grid with this many columns and centered layout. */
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

