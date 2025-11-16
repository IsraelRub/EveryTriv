import { CSSProperties, MouseEvent } from 'react';

import { ComponentSize } from '../../constants';
import { BaseComponentProps } from './base.types';

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
	color?: IconColor;
	animation?: IconAnimation;
	onClick?: (event: MouseEvent<SVGSVGElement>) => void;
	style?: CSSProperties;
}

// Size and Color Types
export type IconColor =
	| 'inherit'
	| 'primary'
	| 'secondary'
	| 'success'
	| 'warning'
	| 'error'
	| 'info'
	| 'muted'
	| 'white'
	| 'black'
	| 'accent';

// Icon Animation
export interface IconAnimation {
	type: 'bounce' | 'pulse' | 'rotate' | 'shake' | 'none';
	duration?: number;
	delay?: number;
	iterationCount?: number | 'infinite';
}
