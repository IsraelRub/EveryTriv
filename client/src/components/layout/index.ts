/**
 * Layout Components Module
 *
 * @module LayoutComponents
 * @description React components for page layout, structure, and container organization
 */

/**
 * Footer component
 * @description Application footer with navigation, links, and branding
 */
export { default as Footer } from './Footer';

/**
 * Grid layout components
 * @description Responsive grid, layout components, and container organization
 */
export { CardGrid, LayoutContainer as Container, GridLayout, ResponsiveGrid } from './GridLayout';

/**
 * Not found component
 * @description 404 error page component with navigation options
 */
export { NotFound } from './NotFound';

/**
 * Social share component
 * @description Social media sharing functionality and integration
 * @used_by client/src/views, client/src/components
 */
export { default as SocialShare } from './SocialShare';
