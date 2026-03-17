import { cva } from 'class-variance-authority';

import { Colors } from './color.constants';
import { RESULT_ICON_SIZE_CLASSES } from './size.constants';

export enum StatusDirection {
	POSITIVE = 'positive',
	NEGATIVE = 'negative',
}

export enum ResultTarget {
	CARD = 'card',
	ICON_SM = 'iconSm',
	ICON_MD = 'iconMd',
}

export enum TrendTarget {
	CARD = 'card',
	ICON = 'icon',
	TEXT = 'text',
}

export const resultVariants = cva('', {
	variants: {
		direction: { [StatusDirection.POSITIVE]: '', [StatusDirection.NEGATIVE]: '' },
		target: {
			[ResultTarget.CARD]: 'p-3 rounded-lg border-2',
			[ResultTarget.ICON_SM]: RESULT_ICON_SIZE_CLASSES.SM,
			[ResultTarget.ICON_MD]: RESULT_ICON_SIZE_CLASSES.MD,
		},
	},
	compoundVariants: [
		{ direction: StatusDirection.POSITIVE, target: ResultTarget.CARD, class: 'bg-green-500/25 border-green-500/50' },
		{ direction: StatusDirection.NEGATIVE, target: ResultTarget.CARD, class: 'bg-red-500/25 border-red-500/50' },
		{ direction: StatusDirection.POSITIVE, target: ResultTarget.ICON_SM, class: Colors.GREEN_500.text },
		{ direction: StatusDirection.NEGATIVE, target: ResultTarget.ICON_SM, class: Colors.RED_500.text },
		{ direction: StatusDirection.POSITIVE, target: ResultTarget.ICON_MD, class: Colors.GREEN_500.text },
		{ direction: StatusDirection.NEGATIVE, target: ResultTarget.ICON_MD, class: Colors.RED_500.text },
	],
	defaultVariants: { direction: StatusDirection.NEGATIVE, target: ResultTarget.CARD },
});

export const trendVariants = cva('', {
	variants: {
		direction: { [StatusDirection.POSITIVE]: '', [StatusDirection.NEGATIVE]: '' },
		target: {
			[TrendTarget.CARD]: 'flex justify-between items-center p-3 rounded-lg border',
			[TrendTarget.ICON]: RESULT_ICON_SIZE_CLASSES.SM,
			[TrendTarget.TEXT]: 'font-bold',
		},
	},
	compoundVariants: [
		{
			direction: StatusDirection.POSITIVE,
			target: TrendTarget.CARD,
			class: `${Colors.GREEN_500.bg}/10 ${Colors.GREEN_500.border}/30`,
		},
		{
			direction: StatusDirection.NEGATIVE,
			target: TrendTarget.CARD,
			class: `${Colors.RED_500.bg}/10 ${Colors.RED_500.border}/30`,
		},
		{ direction: StatusDirection.POSITIVE, target: TrendTarget.ICON, class: Colors.GREEN_500.text },
		{ direction: StatusDirection.NEGATIVE, target: TrendTarget.ICON, class: Colors.RED_500.text },
		{ direction: StatusDirection.POSITIVE, target: TrendTarget.TEXT, class: Colors.GREEN_500.text },
		{ direction: StatusDirection.NEGATIVE, target: TrendTarget.TEXT, class: Colors.RED_500.text },
	],
	defaultVariants: { direction: StatusDirection.NEGATIVE, target: TrendTarget.CARD },
});
