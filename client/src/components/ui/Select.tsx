import { forwardRef } from 'react';

import { SelectOption, UISelectProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';

export const Select = forwardRef<HTMLSelectElement, UISelectProps>(
	({ className, options, size = 'md', isGlassy = false, error, ...props }, ref) => {
		return (
			<select
				ref={ref}
				className={combineClassNames(
					// Base styles
					'w-full rounded-md bg-white/10 text-white border-0',
					'transition-colors duration-200',
					'focus:outline-none focus:ring-2 focus:ring-white/20',

					// Size variants
					{
						'px-3 py-1.5 text-sm': size === 'sm',
						'px-4 py-2 text-base': size === 'md',
						'px-6 py-3 text-lg': size === 'lg',
					},

					// Glass effect
					{
						glass: isGlassy,
					},

					// Error state
					{
						'border border-red-500 focus:ring-red-500/20': error,
					},

					className
				)}
				{...props}
			>
				{options.map((option: SelectOption) => (
					<option key={option.value} value={option.value} className='bg-gray-900 text-white'>
						{option.label}
					</option>
				))}
			</select>
		);
	}
);

Select.displayName = 'Select';
