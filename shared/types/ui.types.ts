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
 * @description Props for error boundary component that catches React errors
 * @used_by client/src/components/ui/ErrorBoundary.tsx (ErrorBoundary component)
 */
export interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * Error boundary state interface
 * @interface ErrorBoundaryState
 * @description Internal state for error boundary component management
 * @used_by client/src/components/ui/ErrorBoundary.tsx (ErrorBoundary component state)
 */
export interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

/**
 * Validation error structure for UI display
 * @interface ValidationError
 * @description Error details with position information for UI highlighting and user feedback
 * @used_by client/src/services/triviaValidation.ts (highlightErrors function)
 */
export interface ValidationError {
	position: { start: number; end: number };
	message: string;
}

/**
 * Social link item interface
 * @interface SocialLinkItem
 * @description Social media link configuration for sharing and navigation
 * @used_by client/src/components/layout/Footer.tsx (Footer component)
 */
export interface SocialLinkItem {
	name: string;
	url: string;
	hoverColor: string;
	shareColor: string;
}
