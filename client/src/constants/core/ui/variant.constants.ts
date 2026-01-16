export enum VariantBase {
	DEFAULT = 'default',
	DESTRUCTIVE = 'destructive',
	OUTLINE = 'outline',
	SECONDARY = 'secondary',
}

export enum ButtonVariant {
	DEFAULT = VariantBase.DEFAULT,
	DESTRUCTIVE = VariantBase.DESTRUCTIVE,
	OUTLINE = VariantBase.OUTLINE,
	SECONDARY = VariantBase.SECONDARY,
	GHOST = 'ghost',
}

export enum StatCardVariant {
	HORIZONTAL = 'horizontal',
	VERTICAL = 'vertical',
	CENTERED = 'centered',
}

export enum ToastVariant {
	DEFAULT = VariantBase.DEFAULT,
	DESTRUCTIVE = VariantBase.DESTRUCTIVE,
	SUCCESS = 'success',
	WARNING = 'warning',
	INFO = 'info',
}

export enum SpinnerVariant {
	FULL_SCREEN = 'fullScreen',
	BUTTON = 'button',
	REFRESH = 'refresh',
}
