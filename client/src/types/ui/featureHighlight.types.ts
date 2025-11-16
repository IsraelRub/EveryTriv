import type { FeatureHighlightItem } from './base.types';

export interface FeatureHighlightProps extends Omit<FeatureHighlightItem, 'id'> {
	className?: string;
}

export interface FeatureHighlightListProps {
	items: FeatureHighlightItem[];
	className?: string;
}
