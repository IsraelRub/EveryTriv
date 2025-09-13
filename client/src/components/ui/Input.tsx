import { motion } from 'framer-motion';
import { forwardRef } from 'react';

import { UIInputProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';
import { fadeInUp, hoverScale } from '../animations';

export const Input = forwardRef<HTMLInputElement, UIInputProps>(
  ({ className, size = 'md', isGlassy = false, error, withAnimation = true, ...props }, ref) => {
    const inputElement = (
      <input
        ref={ref}
        className={combineClassNames(
          // Base styles
          'w-full bg-white/10 text-white border-0',
          'placeholder:text-white/60',
          'focus:outline-none focus:ring-2 focus:ring-white/20',

          // Size variants
          {
            'px-3 py-1 text-sm': size === 'sm',
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
        style={{
          borderRadius: '0.375rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: '400',
          transitionDuration: '0.2s',
          transitionTimingFunction: 'ease',
          boxShadow: error ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
        }}
        {...props}
      />
    );

    return withAnimation ? (
      <motion.div
        variants={fadeInUp}
        initial='hidden'
        animate='visible'
        transition={{ delay: 0.1 }}
      >
        <motion.div variants={hoverScale} initial='initial' whileHover='hover'>
          {inputElement}
        </motion.div>
      </motion.div>
    ) : (
      inputElement
    );
  }
);

Input.displayName = 'Input';
