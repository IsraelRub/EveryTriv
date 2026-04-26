export enum VariantBase {
	DEFAULT = 'default',
	DESTRUCTIVE = 'destructive',
	MINIMAL = 'minimal',
	OUTLINE = 'outline',
	SECONDARY = 'secondary',
}

export enum StatCardVariant {
	HORIZONTAL = 'horizontal',
	CENTERED = 'centered',
	PROSE = 'prose',
}

export enum ToastVariant {
	DEFAULT = VariantBase.DEFAULT,
	DESTRUCTIVE = VariantBase.DESTRUCTIVE,
	SUCCESS = 'success',
	WARNING = 'warning',
	INFO = 'info',
}

export enum UiDensity {
	DEFAULT = 'default',
	COMPACT = 'compact',
}

export enum TabsListVariant {
	DEFAULT = UiDensity.DEFAULT,
	COMPACT = UiDensity.COMPACT,
	SECONDARY = 'secondary',
}

export enum AlertVariant {
	DEFAULT = 'default',
	DESTRUCTIVE = 'destructive',
}
