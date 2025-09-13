/**
 * Icon Components Module
 *
 * @module IconComponents
 * @description React components for icons, icon management, and visual elements
 * @author EveryTriv Team
 * @used_by client/components, client/views
 */

/**
 * Icon types
 * @description TypeScript interfaces for icon components and properties
 * @used_by client/components/icons, client/types
 */
export type { IconAnimation, IconColor, IconProps, IconSize } from '../../types';

/**
 * Icon library components and utilities
 * @description Icon components, utility functions, and icon management
 * @used_by client/components, client/views
 */
export {
  Icon, // Backward compatibility
} from './IconLibrary';

/**
 * Individual icon exports
 * @description Direct exports of commonly used icons and visual elements
 * @used_by client/components, client/views
 */
