import type { ErrorInfo, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface BaseComponentProps {
	className?: string;
	id?: string;
	disabled?: boolean;
	children?: ReactNode;
}

export interface FeatureHighlightItem {
	id: string;
	icon: LucideIcon;
	label: string;
	description?: string;
	accent?: string;
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
