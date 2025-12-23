import { CSSProperties, MouseEvent } from 'react';

import { ComponentSize, IconAnimationType, TextColor } from '@/constants';

import { BaseComponentProps } from '@/types';

/**
 * Icon Types
 * @module IconTypes
 * @description Types for the Icon component
 * @used_by client/src/components/IconLibrary.tsx
 */

// Icon Props
export interface IconProps extends BaseComponentProps {
	name: string;
	size?: ComponentSize;
	color?: TextColor;
	animation?: IconAnimation;
	onClick?: (event: MouseEvent<SVGSVGElement>) => void;
	style?: CSSProperties;
}

// Icon Animation
export interface IconAnimation {
	type: IconAnimationType;
	duration?: number;
	delay?: number;
	iterationCount?: number | 'infinite';
}
