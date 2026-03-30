export enum ComponentSize {
	SM = 'sm',
	MD = 'md',
	LG = 'lg',
	XL = 'xl',
	FULL = 'full',
}

export enum AlertIconSize {
	SM = 'sm',
	MD = 'md',
	BASE = 'base',
	LG = 'lg',
	XL = 'xl',
	XXL = '2xl',
}

export enum ButtonSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
	ICON_SM = 'icon-sm',
	ICON_MD = 'icon-md',
	ICON_LG = 'icon-lg',
}

export enum AvatarSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
	XL = ComponentSize.XL,
	FULL = ComponentSize.FULL,
	NAV = 'nav',
}

export enum AvatarVariant {
	DEFAULT = 'default',
	ELEVATED = 'elevated',
	RING = 'ring',
	PLACEHOLDER = 'placeholder',
}

export enum SliderSize {
	DEFAULT = 'default',
	SM = 'sm',
}

export enum DialogContentSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
}

/** Question-index pill density in `GameSessionHud` (only layouts we actually use). */
export enum GameSessionHudCounterLayout {
	SINGLE = 'single',
	MULTIPLAYER = 'multiplayer',
}

export const DEFAULT_ITEMS_PER_PAGE = 10;

export const RESULT_ICON_SIZE_CLASSES = {
	SM: 'h-4 w-4',
	MD: 'w-5 h-5 flex-shrink-0 mt-0.5',
} as const;
