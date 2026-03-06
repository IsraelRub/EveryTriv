export enum VariantBase {
	DEFAULT = 'default',
	DESTRUCTIVE = 'destructive',
	MINIMAL = 'minimal',
	OUTLINE = 'outline',
	SECONDARY = 'secondary',
	STATIC = 'static',
}

export type ButtonVariant = Exclude<VariantBase, VariantBase.STATIC>;

export enum StatCardVariant {
	HORIZONTAL = 'horizontal',
	CENTERED = 'centered',
}

export enum ToastVariant {
	DEFAULT = VariantBase.DEFAULT,
	DESTRUCTIVE = VariantBase.DESTRUCTIVE,
	SUCCESS = 'success',
	WARNING = 'warning',
	INFO = 'info',
}

export enum TabsListVariant {
	DEFAULT = 'default',
	COMPACT = 'compact',
}

export enum AlertVariant {
	DEFAULT = 'default',
	DESTRUCTIVE = 'destructive',
}
