import { TabsListVariant } from '@/constants';
import type { SecondaryTabsBarProps } from '@/types';
import { TabsBar } from './TabsBar';

export function SecondaryTabsBar({ items, columns }: SecondaryTabsBarProps) {
	return <TabsBar items={items} variant={TabsListVariant.SECONDARY} columns={columns} />;
}
