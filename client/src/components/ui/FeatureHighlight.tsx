import { ComponentSize } from '../../constants';
import type { FeatureHighlightItem, FeatureHighlightListProps, FeatureHighlightProps } from '../../types';
import { combineClassNames } from '../../utils';
import { Icon } from './IconLibrary';

const ACCENT_CLASSES: Record<NonNullable<FeatureHighlightItem['accent']>, { icon: string; label: string }> = {
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
				'flex h-full items-center gap-3 xl:gap-4 rounded-lg border border-slate-900/60 bg-slate-950/75 px-3 py-2 xl:px-5 xl:py-3 2xl:px-6 2xl:py-4 text-slate-300 shadow-inner shadow-black/10',
				className
			)}
		>
			<Icon name={icon} size={ComponentSize.MD} className={combineClassNames('text-slate-300', accentClasses.icon)} />
			<div className='text-left'>
				<div className={combineClassNames('text-sm xl:text-base font-medium text-slate-200', accentClasses.label)}>
					{label}
				</div>
				{description && <div className='text-xs xl:text-sm text-slate-500'>{description}</div>}
			</div>
		</div>
	);
}

export function FeatureHighlightList({ items, className }: FeatureHighlightListProps) {
	return (
		<div
			className={combineClassNames(
				'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6 2xl:gap-8',
				className
			)}
		>
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
