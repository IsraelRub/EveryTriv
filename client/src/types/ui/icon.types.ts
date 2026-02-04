import { CSSProperties, MouseEvent } from 'react';

import { ComponentSize, TextColor } from '@/constants';
import { BaseComponentProps } from '@/types';

export interface IconProps extends BaseComponentProps {
	name: string;
	size?: ComponentSize;
	color?: TextColor;
	onClick?: (event: MouseEvent<SVGSVGElement>) => void;
	style?: CSSProperties;
}
