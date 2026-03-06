import { CSSProperties, MouseEvent } from 'react';

import { ComponentSize } from '@/constants';
import { BaseComponentProps } from '@/types';

export interface IconProps extends BaseComponentProps {
	name: string;
	size?: ComponentSize;
	color?: string;
	onClick?: (event: MouseEvent<SVGSVGElement>) => void;
	style?: CSSProperties;
}
