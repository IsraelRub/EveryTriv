/**
 * HomeTitle component
 * Displays the main title and subtitle of the app
 * @module HomeTitle
 * @used_by client/src/views/home/HomeView.tsx
 */
import { motion } from 'framer-motion';

import type { HomeTitleProps } from '../../types';
import { fadeInDown } from '../animations';

export default function HomeTitle({ className, delay = 0.2 }: HomeTitleProps) {
  return (
    <motion.div
      variants={fadeInDown}
      initial='hidden'
      animate='visible'
      transition={{ delay }}
      className={className}
    >
      <h1 className='text-4xl md:text-5xl font-bold text-white mb-3 gradient-text'>EveryTriv</h1>
      <small className='block text-base mt-2 text-white opacity-75'>
        Smart Trivia Platform with Custom Difficulty Levels
      </small>
    </motion.div>
  );
}
