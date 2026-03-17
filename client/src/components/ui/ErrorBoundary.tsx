import { Component, ErrorInfo } from 'react';
import i18n from 'i18next';

import { getErrorMessage, getErrorStack, getErrorType, isRecord } from '@shared/utils';
import { VALIDATORS } from '@shared/validation';

import { AlertVariant, ButtonSize, ErrorsKey, getErrorLogStorageKey, MAX_RETRIES, VariantBase } from '@/constants';
import type { ErrorBoundaryProps, ErrorState } from '@/types';
import { clientLogger as logger, storageService } from '@/services';
import { Alert, AlertDescription, AlertTitle, Button } from '@/components';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = {
			hasError: false,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<ErrorState> {
		return { hasError: true, error };
	}

	async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		const featureName = this.props.featureName ?? 'Unknown';

		// Extract API trace ID from error object
		let apiTraceId: string | undefined;
		if (isRecord(error)) {
			// Check various possible locations for trace ID
			if ('traceId' in error && VALIDATORS.string(error.traceId)) {
				apiTraceId = error.traceId;
			} else if ('requestId' in error && VALIDATORS.string(error.requestId)) {
				apiTraceId = error.requestId;
			} else if ('response' in error && isRecord(error.response)) {
				const response = error.response;
				// Check response headers
				if ('headers' in response && isRecord(response.headers)) {
					const headers = response.headers;
					if ('x-trace-id' in headers && VALIDATORS.string(headers['x-trace-id'])) {
						apiTraceId = headers['x-trace-id'];
					}
				}
				// Check response data
				if ('data' in response && isRecord(response.data)) {
					const data = response.data;
					if ('traceId' in data && VALIDATORS.string(data.traceId)) {
						apiTraceId = data.traceId;
					}
				}
			}
		}

		// Build detailed error information
		const errorDetails = {
			feature: featureName,
			error: getErrorMessage(error),
			stack: getErrorStack(error),
			componentStack: errorInfo.componentStack ?? '',
			timestamp: new Date().toISOString(),
			type: 'component_error',
			userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
			url: typeof window !== 'undefined' ? window.location.href : 'unknown',
			errorType: getErrorType(error),
			retryCount: this.state.retryCount,
			...(apiTraceId && { apiTraceId }),
		};

		// Log the error with detailed context including trace ID
		logger.navigationComponentError(featureName, getErrorMessage(error), errorDetails);

		// Store error in storage for debugging
		try {
			const errorLogKey = getErrorLogStorageKey(featureName);
			await storageService.set(errorLogKey, errorDetails);
			logger.systemInfo('Error log stored for debugging', {
				feature: featureName,
				key: errorLogKey,
			});
		} catch (storageError) {
			logger.storageWarn('Failed to store error log', {
				errorInfo: { message: getErrorMessage(storageError) },
				component: 'ErrorBoundary',
				feature: featureName,
			});
		}

		// Call optional onError callback if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}

		// Update state with errorInfo (error is already set by getDerivedStateFromError)
		this.setState({
			errorInfo,
		});
	}

	handleRetry = () => {
		const newRetryCount = this.state.retryCount + 1;

		if (newRetryCount <= MAX_RETRIES) {
			logger.userInfo('User attempting retry', {
				feature: this.props.featureName ?? 'Unknown',
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
			feature: this.props.featureName ?? 'Unknown',
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
				<Alert variant={AlertVariant.DESTRUCTIVE} className='my-4'>
					<AlertTitle>
						{this.props.featureName
							? i18n.t(ErrorsKey.FEATURE_ERROR, { feature: this.props.featureName })
							: i18n.t(ErrorsKey.SOMETHING_WENT_WRONG)}
					</AlertTitle>
					<AlertDescription className='space-y-3'>
						<p>{getErrorMessage(this.state.error)}</p>

						<div className='flex gap-2 flex-wrap'>
							{canRetry ? (
								<Button variant={VariantBase.OUTLINE} size={ButtonSize.SM} onClick={this.handleRetry}>
									{i18n.t(ErrorsKey.RETRY_REMAINING, { count: retriesRemaining })}
								</Button>
							) : (
								<Button variant={VariantBase.OUTLINE} size={ButtonSize.SM} disabled>
									{i18n.t(ErrorsKey.MAX_RETRIES_REACHED)}
								</Button>
							)}
							<Button variant={VariantBase.OUTLINE} size={ButtonSize.SM} onClick={this.handleReload}>
								{i18n.t(ErrorsKey.RELOAD_PAGE)}
							</Button>
						</div>

						{/* Show error details */}
						{this.state.error && (
							<details className='mt-2'>
								<summary className='cursor-pointer text-xs font-medium'>{i18n.t(ErrorsKey.ERROR_DETAILS)}</summary>
								<pre className='bg-muted p-2 rounded text-xs overflow-auto max-h-32 mt-2'>
									{getErrorMessage(this.state.error)}
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
