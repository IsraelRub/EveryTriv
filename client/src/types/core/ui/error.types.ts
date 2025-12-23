/**
 * Error Component Types for EveryTriv Client
 *
 * @module ErrorComponentTypes
 * @description Error boundary and error handling component types
 */
import type { ErrorInfo, ReactNode } from 'react';

/**
 * Error boundary props interface
 * @interface ErrorBoundaryProps
 * @description Props for error boundary component that catches React errors
 * @used_by client/src/components/ui/ErrorBoundary.tsx (ErrorBoundary component)
 */
export interface ErrorBoundaryProps {
	children: ReactNode;
	featureName?: string;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
 * Feature-specific error boundary props interface
 * @interface FeatureErrorBoundaryProps
 * @description Props for feature-specific error boundary component
 * @used_by client/src/components/FeatureErrorBoundary.tsx
 */
export interface FeatureErrorBoundaryProps {
	children: ReactNode;
	featureName: string;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Extended error boundary state interface
 * @interface ExtendedErrorBoundaryState
 * @description Extended state for error boundary component with retry count
 * @used_by client/src/components/ErrorBoundary.tsx
 */
export interface ExtendedErrorBoundaryState extends ErrorBoundaryState {
	retryCount: number;
}
