import type { CSSProperties, MouseEvent } from 'react';

import { ComponentSize } from '@/constants';
import type { BaseComponentProps } from '../core';

export interface IconProps extends BaseComponentProps {
	name: string;
	size?: ComponentSize;
	color?: string;
	onClick?: (event: MouseEvent<SVGSVGElement>) => void;
	style?: CSSProperties;
}
