// Import at the end to avoid circular dependency
import { toHslColor } from '@/utils';

export enum TextColor {
	BLUE_500 = 'text-blue-500',
	YELLOW_500 = 'text-yellow-500',
	GREEN_500 = 'text-green-500',
	PURPLE_500 = 'text-purple-500',
	ORANGE_500 = 'text-orange-500',
	CYAN_500 = 'text-cyan-500',
	RED_500 = 'text-red-500',
}

export enum BgColor {
	BLUE_500 = 'bg-blue-500',
	GREEN_500 = 'bg-green-500',
	YELLOW_500 = 'bg-yellow-500',
	PURPLE_500 = 'bg-purple-500',
}

export enum NamedColor {
	YELLOW = 'yellow',
	BLUE = 'blue',
	GREEN = 'green',
	PURPLE = 'purple',
	RED = 'red',
	ORANGE = 'orange',
}

export enum TrendDirection {
	UP = 'up',
	DOWN = 'down',
	NEUTRAL = 'neutral',
}

export enum CssColor {
	PRIMARY = '--primary',
	MUTED_FOREGROUND = '--muted-foreground',
	CARD = '--card',
	BORDER = '--border',
	FOREGROUND = '--foreground',
	MUTED = '--muted',
	SUCCESS_500 = '--color-success-500',
	WARNING_500 = '--color-warning-500',
	DESTRUCTIVE = '--destructive',
	ACCENT = '--accent',
	CHART_1 = '--chart-1',
	CHART_2 = '--chart-2',
	CHART_3 = '--chart-3',
	CHART_4 = '--chart-4',
	CHART_5 = '--chart-5',
}

export const CHART_COLORS = [
	toHslColor(CssColor.PRIMARY),
	toHslColor(CssColor.SUCCESS_500),
	toHslColor(CssColor.WARNING_500),
	toHslColor(CssColor.DESTRUCTIVE),
	toHslColor(CssColor.MUTED_FOREGROUND),
	toHslColor(CssColor.ACCENT),
	toHslColor(CssColor.CHART_1),
	toHslColor(CssColor.CHART_2),
	toHslColor(CssColor.CHART_3),
	toHslColor(CssColor.CHART_4),
	toHslColor(CssColor.CHART_5),
];
