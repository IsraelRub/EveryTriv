export enum ComponentSize {
	SM = 'sm',
	MD = 'md',
	LG = 'lg',
	XL = 'xl',
}

export enum ModalSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
	XL = ComponentSize.XL,
	FULL = 'full',
}

export type InteractiveSize = ComponentSize.SM | ComponentSize.MD | ComponentSize.LG;

export enum ButtonSize {
	DEFAULT = 'default',
	SM = ComponentSize.SM,
	LG = ComponentSize.LG,
	ICON = 'icon',
}

export enum SpinnerSize {
	SM = ComponentSize.SM,
	MD = ComponentSize.MD,
	LG = ComponentSize.LG,
	XL = ComponentSize.XL,
	FULL = 'full',
}

export const DEFAULT_ITEMS_PER_PAGE = 10;
