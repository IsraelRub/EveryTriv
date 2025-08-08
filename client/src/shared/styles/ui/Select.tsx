import { Select as BaseSelect, SelectProps as BaseSelectProps } from '@mui/base/Select';
import { Option as BaseOption } from '@mui/base/Option';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<BaseSelectProps<string, false>, 'slots' | 'slotProps'> {
  options: SelectOption[];
  isGlassy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

// Create a forwarded component for the listbox
const ListboxComponent = forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ children, ...props }, ref) => {
    // Filter out ownerState and other MUI-specific props
    const { ownerState, ...htmlProps } = props as any;
    
    return (
      <ul
        ref={ref}
        {...htmlProps}
        className={cn(
          'min-w-[200px] p-1.5 rounded-md mt-1',
          'bg-white/10 backdrop-blur-lg border border-white/20',
          'z-50 outline-none'
        )}
      >
        {children}
      </ul>
    );
  }
);

ListboxComponent.displayName = 'ListboxComponent';

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ className, options, size = 'md', isGlassy = false, error, ...props }, ref) => {
    return (
      <BaseSelect
        ref={ref}
        {...props}
        className={cn(
          // Base styles
          'w-full rounded-md bg-white/10 text-white',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20',
          
          // Size variants
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          
          // Glass effect
          {
            'glass-morphism': isGlassy,
          },
          
          // Error state
          {
            'border-red-500 focus-visible:ring-red-500/20': error,
          },
          
          className
        )}
        slots={{
          listbox: ListboxComponent,
        }}
      >
        {options.map((option: SelectOption) => (
          <BaseOption
            key={option.value}
            value={option.value}
            className={cn(
              'relative flex items-center px-3 py-2 rounded-md text-white',
              'cursor-pointer select-none',
              'hover:bg-white/10',
              'data-[selected=true]:bg-white/20',
              'focus-visible:outline-none focus-visible:bg-white/15'
            )}
          >
            {option.label}
          </BaseOption>
        ))}
      </BaseSelect>
    );
  }
);