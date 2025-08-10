import { HTMLAttributes } from 'react';
import { forwardRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  isGlassy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  hideBackdrop?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ 
    children, 
    className, 
    open,
    onClose,
    isGlassy = true, 
    size = 'md', 
    hideBackdrop = false,
    disableEscapeKeyDown = false,
    disableBackdropClick = false,
    ...props 
  }, ref) => {
    
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && !disableEscapeKeyDown && onClose) {
          onClose();
        }
      };

      if (open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [open, disableEscapeKeyDown, onClose]);

    if (!open) return null;

    const handleBackdropClick = (event: React.MouseEvent) => {
      if (event.target === event.currentTarget && !disableBackdropClick && onClose) {
        onClose();
      }
    };

    return createPortal(
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div
          ref={ref}
          className={cn(
            // Base styles
            'relative rounded-lg bg-white/10 text-white animate-fade-in',
            
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
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);