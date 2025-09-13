/**
 * Layout Components Module
 *
 * @module LayoutComponents
 * @description React components for page layout, structure, and container organization
 * @author EveryTriv Team
 * @used_by client/views, client/App
 */

/**
 * Footer component
 * @description Application footer with navigation, links, and branding
 * @used_by client/views, client/App
 */
export { default as Footer } from './Footer';

/**
 * Grid layout components
 * @description Responsive grid, layout components, and container organization
 * @used_by client/views, client/components
 */
export {
  CardGrid,
  LayoutContainer as Container,
  GridLayout,
  ResponsiveGrid,
  LayoutSection as Section,
} from './GridLayout';

/**
 * Not found component
 * @description 404 error page component with navigation options
 * @used_by client/views, client/App
 */
export { NotFound } from './NotFound';

/**
 * Social share component
 * @description Social media sharing functionality and integration
 * @used_by client/views, client/components
 */
export { default as SocialShare } from './SocialShare';
