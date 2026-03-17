import { TabsListVariant } from '@/constants';
import type { SecondaryTabsBarProps } from '@/types';
import { TabsBar } from './TabsBar';

/** Use for sub-tabs only when there is already a primary TabsList (e.g. inside a dashboard tab). */
export function SecondaryTabsBar({ items, columns }: SecondaryTabsBarProps) {
	return <TabsBar items={items} variant={TabsListVariant.SECONDARY} columns={columns} />;
}
