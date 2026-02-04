import { CssColor } from '@/constants';

export function toHslColor(cssColor: CssColor, opacity?: number): string {
	if (opacity !== undefined) {
		return `hsl(var(${cssColor}) / ${opacity})`;
	}
	return `hsl(var(${cssColor}))`;
}
