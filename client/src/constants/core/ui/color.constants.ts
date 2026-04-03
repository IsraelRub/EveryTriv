/**
 * Raw Tailwind palette slices — use only when you need a fixed spectrum color
 * (e.g. third-place bronze `bg-orange-500`). For branded UI, prefer {@link SEMANTIC_ICON_TEXT}.
 */
export const Colors = {
	BLUE_500: { text: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500' },
	GREEN_500: { text: 'text-green-500', bg: 'bg-green-500', border: 'border-green-500' },
	YELLOW_500: { text: 'text-yellow-500', bg: 'bg-yellow-500', border: 'border-yellow-500' },
	PURPLE_500: { text: 'text-purple-500', bg: 'bg-purple-500', border: 'border-purple-500' },
	RED_500: { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500' },
	ORANGE_500: { text: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500' },
	CYAN_500: { text: 'text-cyan-500', bg: 'bg-cyan-500', border: 'border-cyan-500' },
	GRAY_400: { text: 'text-gray-400', bg: 'bg-gray-400', border: 'border-gray-400' },
	AMBER_600: { text: 'text-amber-600', bg: 'bg-amber-600', border: 'border-amber-600' },
} as const;

/**
 * Tailwind classes aligned with `client/src/global.css` + `tailwind.config.ts` theme tokens.
 */
export const SEMANTIC_ICON_TEXT = {
	primary: 'text-primary',
	secondary: 'text-secondary',
	success: 'text-success',
	warning: 'text-warning',
	destructive: 'text-destructive',
	muted: 'text-muted-foreground',
	accent: 'text-accent',
	/** Extra dashboard metrics (Tailwind default orange — not a theme semantic). */
	orange: 'text-orange-500',
	/** Extra dashboard metrics (Tailwind default cyan). */
	cyan: 'text-cyan-500',
} as const;

/** Countdown timer phases — text + solid background utilities. */
export const TIMER_PHASE_CLASS = {
	safeText: 'text-success',
	safeBg: 'bg-success',
	warnText: 'text-warning',
	warnBg: 'bg-warning',
	criticalText: 'text-destructive',
	criticalBg: 'bg-destructive',
} as const;

export const SEMANTIC_SURFACE = {
	resultPositiveCard: 'bg-success/25 border-success/50',
	resultNegativeCard: 'bg-destructive/25 border-destructive/50',
	trendPositiveCard: 'bg-success/10 border-success/30',
	trendNegativeCard: 'bg-destructive/10 border-destructive/30',
} as const;

export enum CssColor {
	PRIMARY = 'hsl(var(--primary))',
	MUTED_FOREGROUND = 'hsl(var(--muted-foreground))',
	CARD = 'hsl(var(--card))',
	BORDER = 'hsl(var(--border))',
	FOREGROUND = 'hsl(var(--foreground))',
	SUCCESS_500 = 'hsl(var(--color-success-500))',
	WARNING_500 = 'hsl(var(--color-warning-500))',
	DESTRUCTIVE = 'hsl(var(--destructive))',
	ACCENT = 'hsl(var(--accent))',
	CHART_1 = 'hsl(var(--chart-1))',
	CHART_2 = 'hsl(var(--chart-2))',
	CHART_3 = 'hsl(var(--chart-3))',
	CHART_4 = 'hsl(var(--chart-4))',
	CHART_5 = 'hsl(var(--chart-5))',
	MUTED_FOREGROUND_20 = 'hsl(var(--muted-foreground) / 0.2)',
	MUTED_20 = 'hsl(var(--muted) / 0.2)',
	MUTED = 'hsl(var(--muted))',
}

export const CHART_COLORS = [
	CssColor.PRIMARY,
	CssColor.SUCCESS_500,
	CssColor.WARNING_500,
	CssColor.DESTRUCTIVE,
	CssColor.MUTED_FOREGROUND,
	CssColor.ACCENT,
	CssColor.CHART_1,
	CssColor.CHART_2,
	CssColor.CHART_3,
	CssColor.CHART_4,
	CssColor.CHART_5,
];
