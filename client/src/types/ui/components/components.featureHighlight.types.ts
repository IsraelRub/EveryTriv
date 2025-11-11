import type { FeatureHighlightItem } from './components.base.types';

export interface FeatureHighlightProps extends Omit<FeatureHighlightItem, 'id'> {
	className?: string;
}

export interface FeatureHighlightListProps {
	items: FeatureHighlightItem[];
	className?: string;
}

