import { Input as BaseInput } from '@mui/base/Input';
import { type InputProps as BaseInputProps } from '@mui/base/Input';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends BaseInputProps {
  isGlassy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'md', isGlassy = false, error, ...props }, ref) => {
    return (
      <BaseInput
        ref={ref}
        className={cn(
          // Base styles
          'w-full rounded-md bg-white/10 text-white',
          'transition-colors duration-200',
          'placeholder:text-white/60',
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
        slotProps={{
          input: {
            className: cn(
              'bg-transparent w-full border-none p-0 focus:outline-none',
              'placeholder:text-white/60',
              {
                'text-sm': size === 'sm',
                'text-base': size === 'md',
                'text-lg': size === 'lg',
              }
            ),
          },
        }}
        {...props}
      />
    );
  }
);