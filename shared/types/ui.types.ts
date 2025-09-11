/**
 * UI types for EveryTriv
 * Shared between client and server
 *
 * @module UITypes
 * @description User interface related type definitions
 */
// Import React types for proper compatibility
import type { ErrorInfo, ReactNode } from 'react';



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

/**
 * Social link item interface
 * @interface SocialLinkItem
 * @description Social media link structure
 * @used_by client/src/components/layout/Footer.tsx (Footer component)
 */
export interface SocialLinkItem {
	/** Social platform name */
	name: string;
	/** Social platform URL */
	url: string;
	/** Hover color class */
	hoverColor: string;
	/** Share button color class */
	shareColor: string;
}
