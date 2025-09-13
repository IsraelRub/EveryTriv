import { forwardRef, MouseEvent, useEffect } from 'react';
import { createPortal } from 'react-dom';

//
import { ModalProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      children,
      className,
      open,
      onClose,
      isGlassy = true,
      size = 'md',
      disableEscapeKeyDown = false,
      disableBackdropClick = false,
      ...props
    },
    ref
  ) => {
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

    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !disableBackdropClick && onClose) {
        onClose();
      }
    };

    return createPortal(
      <div
        className='fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm'
        style={{
          zIndex: 9999,
        }}
        onClick={handleBackdropClick}
      >
        <div
          ref={ref}
          className={combineClassNames(
            // Base styles
            'relative bg-white/10 text-white animate-fade-in',

            // Size variants
            {
              'w-full max-w-sm': size === 'sm',
              'w-full max-w-md': size === 'md',
              'w-full max-w-lg': size === 'lg',
            },

            // Glass effect
            {
              glass: isGlassy,
            },

            className
          )}
          style={{
            borderRadius: '0.5rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            transitionDuration: '0.2s',
            transitionTimingFunction: 'ease',
            zIndex: 10000,
          }}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);

Modal.displayName = 'Modal';
