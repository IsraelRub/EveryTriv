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
export * from './stats';
export * from './ui';
export * from './user';

// Direct component exports (moved from subdirectories)
export { default as AudioControls } from './AudioControls';
export { ProtectedRoute, PublicRoute } from './ProtectedRoute';
export { default as FeatureErrorBoundary } from './FeatureErrorBoundary';
export { ValidatedForm } from './ValidatedForm';
export { default as GameMode } from './GameMode';
export { Icon } from './IconLibrary';
export { default as Leaderboard } from './Leaderboard';
export { default as SubscriptionPlans } from './SubscriptionPlans';
export { default as Navigation } from './navigation/Navigation';
