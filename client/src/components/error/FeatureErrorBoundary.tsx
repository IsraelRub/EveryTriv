import { clientLogger as logger } from '@shared/services';
import { getErrorMessage, getErrorStack, getErrorType } from '@shared/utils/error.utils';
import { motion } from 'framer-motion';
import { Component, ErrorInfo, ReactNode } from 'react';

import { storageService } from '../../services';
import { fadeInUp, scaleIn } from '../animations';

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Feature-specific Error Boundary
 * Provides error handling for specific features with enhanced logging and recovery
 */
class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  private retryCount: number = 0;
  private maxRetries: number = 2;

  constructor(props: FeatureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      feature: this.props.featureName,
      error: getErrorMessage(error),
      stack: getErrorStack(error),
      componentStack: errorInfo.componentStack || '',
      timestamp: new Date().toISOString(),
      type: 'feature_error',
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorType: getErrorType(error),
      retryCount: this.retryCount,
    };

    logger.navigationComponentError(
      `FeatureErrorBoundary-${this.props.featureName}`,
      getErrorMessage(error),
      errorDetails
    );

    // Store error in storage for debugging
    try {
      const errorLog = {
        ...errorDetails,
        date: new Date().toISOString(),
      };
      await storageService.set(`error-log-${this.props.featureName}`, errorLog);
    } catch (storageError) {
      console.warn('Failed to store feature error log:', getErrorMessage(storageError));
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-64 flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-800 to-orange-700 rounded-lg p-6'>
          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.1 }}
            className='text-center text-white'
          >
            <motion.div
              variants={scaleIn}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.2 }}
            >
              <h3 className='text-2xl font-bold mb-2'>{this.props.featureName} Error</h3>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.3 }}
            >
              <p className='text-lg mb-4'>
                Something went wrong in the {this.props.featureName} feature
              </p>
            </motion.div>
            <motion.div
              variants={scaleIn}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.4 }}
            >
              <div className='space-x-3'>
                <button
                  onClick={this.handleRetry}
                  disabled={this.retryCount >= this.maxRetries}
                  className='bg-white text-orange-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {this.retryCount >= this.maxRetries
                    ? 'Max Retries'
                    : `Retry (${this.retryCount}/${this.maxRetries})`}
                </button>
                <button
                  onClick={this.handleReload}
                  className='bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition-colors'
                >
                  Reload Page
                </button>
              </div>
            </motion.div>
            {import.meta.env.DEV && this.state.error && (
              <motion.div
                variants={fadeInUp}
                initial='hidden'
                animate='visible'
                transition={{ delay: 0.5 }}
                className='mt-4'
              >
                <details className='text-left'>
                  <summary className='cursor-pointer text-sm font-semibold mb-2'>
                    Error Details (Development Only)
                  </summary>
                  <pre className='bg-black bg-opacity-50 p-3 rounded text-xs overflow-auto max-h-32'>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </motion.div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FeatureErrorBoundary;
