/**
 * Utility function for combining class names conditionally
 * Compatible with Tailwind CSS and clsx
 * Uses twMerge for proper Tailwind class merging
 *
 * @module combineClassNames
 * @description CSS class name combination utility with Tailwind support
 * @used_by client/src/components/ui, client/src/styles
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditionally join class names together with Tailwind merging
 * @param {...ClassValue[]} inputs - Class names to combine
 * @returns {string} Combined class string with proper Tailwind merging
 */
export function combineClassNames(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
