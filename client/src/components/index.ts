/**
 * Client Components Index
 *
 * @module ClientComponents
 * @description Central export point for all client-side React components and UI elements
 * @used_by client/views, client/App, client/main
 */

export * from './animations';
export * from './game';
export * from './home';
export * from './layout';
export * from './multiplayer';
export * from './payment';
export * from './stats';
export * from './ui';
export * from './user';

export { default as AudioControls } from './AudioControls';
export { ProtectedRoute, PublicRoute } from './ProtectedRoute';
export { default as FeatureErrorBoundary } from './FeatureErrorBoundary';
export { default as Leaderboard } from './Leaderboard';
export { default as Navigation } from './navigation/Navigation';
