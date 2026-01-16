import { CSSProperties, MouseEvent } from 'react';

import { ComponentSize, IconAnimationType, TextColor } from '@/constants';
import { BaseComponentProps } from '@/types';

export interface IconProps extends BaseComponentProps {
	name: string;
	size?: ComponentSize;
	color?: TextColor;
	animation?: IconAnimation;
	onClick?: (event: MouseEvent<SVGSVGElement>) => void;
	style?: CSSProperties;
}

export interface IconAnimation {
	type: IconAnimationType;
	duration?: number;
	delay?: number;
	iterationCount?: number | 'infinite';
}
