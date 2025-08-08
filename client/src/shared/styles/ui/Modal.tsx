import { Modal as BaseModal } from '@mui/base/Modal';
import { type ModalProps as BaseModalProps } from '@mui/base/Modal';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ModalProps extends BaseModalProps {
  isGlassy?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ children, className, isGlassy = true, size = 'md', ...props }, ref) => {
    return (
      <BaseModal
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center',
          'bg-black/50 backdrop-blur-sm'
        )}
        {...props}
      >
        <div
          className={cn(
            // Base styles
            'relative rounded-lg bg-white/10 text-white',
            'animate-fade-in',
            
            // Size variants
            {
              'w-full max-w-sm': size === 'sm',
              'w-full max-w-md': size === 'md',
              'w-full max-w-lg': size === 'lg',
            },
            
            // Glass effect
            {
              'glass-morphism': isGlassy,
            },
            
            className
          )}
        >
          {children}
        </div>
      </BaseModal>
    );
  }
);