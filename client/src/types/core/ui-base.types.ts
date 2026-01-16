import type { ErrorInfo, ReactNode } from 'react';

import { FeatureHighlightAccent } from '@/constants';

export interface BaseComponentProps {
	className?: string;
	id?: string;
	disabled?: boolean;
	children?: ReactNode;
}

export interface FeatureHighlightItem {
	id: string;
	icon: string;
	label: string;
	description?: string;
	accent?: FeatureHighlightAccent;
}

export interface ErrorBoundaryProps {
	children: ReactNode;
	featureName?: string;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

export interface FeatureErrorBoundaryProps {
	children: ReactNode;
	featureName: string;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorState extends ErrorBoundaryState {
	retryCount: number;
}
