import { cva } from 'class-variance-authority';

import { SEMANTIC_ICON_TEXT, SEMANTIC_SURFACE } from './color.constants';
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
		{
			direction: StatusDirection.POSITIVE,
			target: ResultTarget.CARD,
			class: SEMANTIC_SURFACE.resultPositiveCard,
		},
		{
			direction: StatusDirection.NEGATIVE,
			target: ResultTarget.CARD,
			class: SEMANTIC_SURFACE.resultNegativeCard,
		},
		{
			direction: StatusDirection.POSITIVE,
			target: [ResultTarget.ICON_SM, ResultTarget.ICON_MD],
			class: SEMANTIC_ICON_TEXT.success,
		},
		{
			direction: StatusDirection.NEGATIVE,
			target: [ResultTarget.ICON_SM, ResultTarget.ICON_MD],
			class: SEMANTIC_ICON_TEXT.destructive,
		},
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
			class: SEMANTIC_SURFACE.trendPositiveCard,
		},
		{
			direction: StatusDirection.NEGATIVE,
			target: TrendTarget.CARD,
			class: SEMANTIC_SURFACE.trendNegativeCard,
		},
		{
			direction: StatusDirection.POSITIVE,
			target: [TrendTarget.ICON, TrendTarget.TEXT],
			class: SEMANTIC_ICON_TEXT.success,
		},
		{
			direction: StatusDirection.NEGATIVE,
			target: [TrendTarget.ICON, TrendTarget.TEXT],
			class: SEMANTIC_ICON_TEXT.destructive,
		},
	],
	defaultVariants: { direction: StatusDirection.NEGATIVE, target: TrendTarget.CARD },
});
