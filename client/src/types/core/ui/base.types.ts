/**
 * Base UI Component Types
 * @module BaseComponentTypes
 * @description Fundamental UI component prop types and interfaces used across the application
 */
import { ReactNode } from 'react';

import { FeatureHighlightAccent } from '@/constants';

// Base Component Props
export interface BaseComponentProps {
	className?: string;
	id?: string;
	disabled?: boolean;
	children?: ReactNode;
}

export interface FeatureHighlightItem {
	id: string;
	icon: string;
	label: string;
	description?: string;
	accent?: FeatureHighlightAccent;
}
