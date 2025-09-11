import { ErrorBoundaryProps, ErrorBoundaryState } from '@shared';
import { formatTime, getCurrentTimestamp } from '@shared';
import { Component, ErrorInfo } from 'react';
import { motion } from 'framer-motion';
import { clientLogger } from '@shared';
import { storageService } from '../../services';
import { fadeInUp, scaleIn } from '../animations';

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Enhanced error logging with advanced details and retry mechanism
		const errorDetails = {
			error: error.message,
			stack: error.stack,
			componentStack: errorInfo.componentStack || '',
			timestamp: getCurrentTimestamp(),
			type: 'component_error',
			userAgent: navigator.userAgent,
			url: window.location.href,
			timeSincePageLoad: formatTime(Math.floor((Date.now() - performance.timing.navigationStart) / 1000)),
			errorType: error.constructor.name,
			errorCode: (error as Error & { code?: string }).code || 'UNKNOWN',
			retryCount: 0,
			lastErrorTime: null,
		};

		clientLogger.navigationComponentError('ErrorBoundary', error.message, errorDetails);

		// Store error in storage for debugging
		try {
			const errorLog = {
				...errorDetails,
				date: new Date().toISOString(),
			};
			await storageService.set('error-log', errorLog);
		} catch (storageError) {
			// Ignore storage errors
		}

		this.setState({
			error,
			errorInfo,
		});
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			const errorContent = (
				<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-red-700'>
					<motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
						<div className='text-center text-white p-8'>
							<motion.div variants={scaleIn} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
								<h1 className='text-4xl font-bold mb-4'>Something went wrong</h1>
							</motion.div>
							<motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
								<p className='text-xl mb-6'>An unexpected error occurred in the application</p>
							</motion.div>
							<motion.div variants={scaleIn} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
								<button
									onClick={() => window.location.reload()}
									className='bg-white text-red-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors'
								>
									Refresh Page
								</button>
							</motion.div>
							{import.meta.env.DEV && this.state.error && (
								<motion.div variants={fadeInUp} initial="hidden" animate="visible" transition={{ delay: 0.5 }}>
									<details className='mt-6 text-left'>
										<summary className='cursor-pointer text-lg font-semibold mb-2'>
											Error Details (Development Only)
										</summary>
										<pre className='bg-black bg-opacity-50 p-4 rounded text-sm overflow-auto max-h-64'>
											{this.state.error.toString()}
											{this.state.errorInfo?.componentStack}
										</pre>
									</details>
								</motion.div>
							)}
						</div>
					</motion.div>
				</div>
			);

			return errorContent;
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
