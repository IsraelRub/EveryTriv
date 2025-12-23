import { Component, ErrorInfo } from 'react';

import { AlertCircle } from 'lucide-react';

import { getErrorMessage, getErrorStack, getErrorType } from '@shared/utils';

import { ButtonSize, ButtonVariant, VariantBase } from '@/constants';

import { Alert, AlertDescription, AlertTitle, Button } from '@/components';

import { clientLogger as logger, storageService } from '@/services';

import type { ErrorBoundaryProps, ExtendedErrorBoundaryState } from '@/types';

const MAX_RETRIES = 2;
const ERROR_LOG_KEY_PREFIX = 'error-log-';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ExtendedErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ExtendedErrorBoundaryState> {
		return { hasError: true, error };
	}

	async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const featureName = this.props.featureName || 'Unknown';

		// Build detailed error information
		const errorDetails = {
			feature: featureName,
			error: getErrorMessage(error),
			stack: getErrorStack(error),
			componentStack: errorInfo.componentStack || '',
			timestamp: new Date().toISOString(),
			type: 'component_error',
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
			url: typeof window !== 'undefined' ? window.location.href : 'unknown',
			errorType: getErrorType(error),
			retryCount: this.state.retryCount,
			errorName: error.name,
		};

		// Log the error with detailed context
		logger.navigationComponentError(featureName, getErrorMessage(error), errorDetails);

		// Store error in storage for debugging
		try {
			const errorLog = {
				...errorDetails,
				date: new Date().toISOString(),
			};
			await storageService.set(`${ERROR_LOG_KEY_PREFIX}${featureName}`, errorLog);
			logger.systemInfo('Error log stored for debugging', {
				feature: featureName,
				key: `${ERROR_LOG_KEY_PREFIX}${featureName}`,
			});
		} catch (storageError) {
			logger.storageWarn('Failed to store error log', {
				error: getErrorMessage(storageError),
				component: 'ErrorBoundary',
				feature: featureName,
			});
		}

		// Call optional onError callback if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Update state with error info
		this.setState({
			error,
			errorInfo,
		});
	}

	handleRetry = () => {
		const newRetryCount = this.state.retryCount + 1;

		if (newRetryCount <= MAX_RETRIES) {
			logger.userInfo('User attempting retry', {
				feature: this.props.featureName || 'Unknown',
				retryCount: newRetryCount,
				maxRetries: MAX_RETRIES,
			});

			this.setState({
				hasError: false,
				error: undefined,
				errorInfo: undefined,
				retryCount: newRetryCount,
			});
		}
	};

	handleReload = () => {
		logger.userInfo('User reloading page after error', {
			feature: this.props.featureName || 'Unknown',
			retryCount: this.state.retryCount,
		});
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			// Use custom fallback if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const canRetry = this.state.retryCount < MAX_RETRIES;
			const retriesRemaining = MAX_RETRIES - this.state.retryCount;

			return (
				<Alert variant={VariantBase.DESTRUCTIVE} className='my-4'>
					<AlertCircle className='h-4 w-4' />
					<AlertTitle>{this.props.featureName ? `${this.props.featureName} Error` : 'Something went wrong'}</AlertTitle>
					<AlertDescription className='space-y-3'>
						<p>{this.state.error?.message || 'An unexpected error occurred'}</p>

						<div className='flex gap-2 flex-wrap'>
							{canRetry ? (
								<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM} onClick={this.handleRetry}>
									Retry ({retriesRemaining} remaining)
								</Button>
							) : (
								<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM} disabled>
									Max Retries Reached
								</Button>
							)}
							<Button variant={ButtonVariant.OUTLINE} size={ButtonSize.SM} onClick={this.handleReload}>
								Reload Page
							</Button>
						</div>

						{/* Show error details */}
						{this.state.error && (
							<details className='mt-2'>
								<summary className='cursor-pointer text-xs font-medium'>Error Details</summary>
								<pre className='bg-muted p-2 rounded text-xs overflow-auto max-h-32 mt-2'>
									{this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</pre>
							</details>
						)}
					</AlertDescription>
				</Alert>
			);
		}

		return this.props.children;
	}
}
