/**
 * Redux Module Index
 * @module ReduxModule
 * @description Central export for all Redux-related functionality
 */

// Store
export type { RootState } from '../types/redux/state.types';
export type { AppDispatch } from './store';
export { store } from './store';

// Features
export * from './slices';

// Selectors
export * from './selectors';

// Services are now exported from client/src/services
