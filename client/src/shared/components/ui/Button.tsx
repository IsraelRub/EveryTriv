import { forwardRef } from 'react';
import { AudioKey } from '../../constants';
import { cn } from '../../utils/cn';
import { useAudioContext } from '@/shared/hooks';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isGlassy?: boolean;
  withGlow?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    className, 
    variant = 'primary', 
    size = 'md',
    isGlassy = false,
    withGlow = false,
    onClick,
    ...props 
  }, ref) => {
    const { playSound } = useAudioContext();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      playSound(AudioKey.CLICK);
      onClick?.(e);
    };
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          
          // Size variants
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          
          // Color variants
          {
            'bg-[#667eea] hover:bg-[#5a6ed4] text-white': variant === 'primary' && !isGlassy,
            'bg-[#f093fb] hover:bg-[#e083eb] text-white': variant === 'secondary' && !isGlassy,
            'bg-[#4facfe] hover:bg-[#3f9cee] text-white': variant === 'accent' && !isGlassy,
            'hover:bg-white/10 text-white': variant === 'ghost',
          },
          
          // Glass effect
          {
            'glass-morphism': isGlassy,
            'cube-glow': withGlow,
          },
          
          // Custom gradient backgrounds for glassy variants
          {
            'hover:bg-gradient-to-r from-[#667eea]/30 to-[#764ba2]/30': variant === 'primary' && isGlassy,
            'hover:bg-gradient-to-r from-[#f093fb]/30 to-[#f5576c]/30': variant === 'secondary' && isGlassy,
            'hover:bg-gradient-to-r from-[#4facfe]/30 to-[#00f2fe]/30': variant === 'accent' && isGlassy,
          },
          
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  }
);