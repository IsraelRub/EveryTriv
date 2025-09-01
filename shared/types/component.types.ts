/**
 * Component-related types for EveryTriv
 * Client-only types - not used by server
 *
 * @module ComponentTypes
 * @description Component interfaces and props used across the client application
 */
// Import React types for proper compatibility
import type { ErrorInfo as ReactErrorInfo, ReactNode as ReactReactNode } from 'react';

// Re-export React types for consistency
export type ReactNode = ReactReactNode;
export type ErrorInfo = ReactErrorInfo;

/**
 * Error boundary props interface
 * @interface ErrorBoundaryProps
 * @description Props for error boundary component
 * @used_by client/src/components/ui/ErrorBoundary.tsx (ErrorBoundary component)
 */
export interface ErrorBoundaryProps {
	/** Child components to render */
	children: ReactNode;
	/** Optional fallback component to show when error occurs */
	fallback?: ReactNode;
}

/**
 * Error boundary state interface
 * @interface ErrorBoundaryState
 * @description Internal state for error boundary component
 * @used_by client/src/components/ui/ErrorBoundary.tsx (ErrorBoundary component state)
 */
export interface ErrorBoundaryState {
	/** Whether an error has occurred */
	hasError: boolean;
	/** The error that was caught */
	error?: Error;
	/** Additional error information from React */
	errorInfo?: ErrorInfo;
}

/**
 * Validation error structure for UI display
 * @interface ValidationError
 * @description Error details with position information for UI highlighting
 * @used_by client/src/services/triviaValidation.ts (highlightErrors function)
 */
export interface ValidationError {
	/** Error position in text */
	position: { start: number; end: number };
	/** Error message */
	message: string;
}
