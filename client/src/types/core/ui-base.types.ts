import type { ErrorInfo, ReactElement } from 'react';
import { LucideIcon } from 'lucide-react';

export interface BaseComponentProps {
	className?: string;
	id?: string;
	disabled?: boolean;
	children?: ReactElement | ReactElement[] | null;
}

export interface FeatureHighlightItem {
	id: string;
	icon: LucideIcon;
	label: string;
	description?: string;
	accent?: string;
}

export interface ErrorBoundaryProps {
	children: ReactElement | ReactElement[];
	featureName?: string;
	fallback?: ReactElement | null;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

export interface FeatureErrorBoundaryProps {
	children: ReactElement | ReactElement[];
	featureName: string;
	fallback?: ReactElement | null;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorState extends ErrorBoundaryState {
	retryCount: number;
}
