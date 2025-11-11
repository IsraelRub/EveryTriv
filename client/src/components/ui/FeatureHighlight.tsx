import type { FeatureHighlightItem, FeatureHighlightListProps, FeatureHighlightProps } from '../../types';
import { ComponentSize } from '../../constants';
import { Icon } from '../IconLibrary';
import { combineClassNames } from '../../utils';

const ACCENT_CLASSES: Record<
	NonNullable<FeatureHighlightItem['accent']>,
	{ icon: string; label: string }
> = {
	blue: {
		icon: 'text-sky-400',
		label: 'text-sky-200',
	},
	green: {
		icon: 'text-emerald-400',
		label: 'text-emerald-200',
	},
	purple: {
		icon: 'text-violet-400',
		label: 'text-violet-200',
	},
	orange: {
		icon: 'text-amber-400',
		label: 'text-amber-200',
	},
};

export function FeatureHighlight({ icon, label, description, accent = 'blue', className }: FeatureHighlightProps) {
	const accentClasses = ACCENT_CLASSES[accent];

	return (
		<div
			className={combineClassNames(
				'flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-slate-300',
				className
			)}
		>
			<Icon name={icon} size={ComponentSize.SM} className={combineClassNames('text-slate-300', accentClasses.icon)} />
			<div className='text-left'>
				<div className={combineClassNames('text-sm font-medium text-slate-200', accentClasses.label)}>{label}</div>
				{description && <div className='text-xs text-slate-500'>{description}</div>}
			</div>
		</div>
	);
}

export function FeatureHighlightList({ items, className }: FeatureHighlightListProps) {
	return (
		<div className={combineClassNames('grid auto-rows-fr grid-cols-3 gap-6', className)}>
			{items.map(item => (
				<FeatureHighlight
					key={item.id}
					icon={item.icon}
					label={item.label}
					description={item.description}
					accent={item.accent}
				/>
			))}
		</div>
	);
}

