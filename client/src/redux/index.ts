/**
 * Redux Module Index
 * @module ReduxModule
 * @description Central export for all Redux-related functionality
 */

// Store
export { store } from './store';
export type { AppDispatch } from './store';
export type { RootState } from '../types/redux/state.types';

// Features
export * from './slices';

// Selectors
export * from './selectors';

// Services are now exported from client/src/services

