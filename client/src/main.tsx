import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import App from './App';
import './index.css';
import logger from './shared/services/logger.service';

// Initialize logger and log application start
logger.info('EveryTriv Client Application Starting', {
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
  sessionStart: true
});

// Force immediate sync to server
logger.flushToServer().then((success) => {
  logger.info('Initial log sync to server completed', { syncSuccess: success });
}).catch((error) => {
  logger.error('Failed to sync logs to server on startup', { error });
});

// Filter out harmless Chrome extension errors in development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Filter out known harmless extension errors
    if (
      message.includes('runtime.lastError') ||
      message.includes('message port closed') ||
      message.includes('Extension context invalidated') ||
      message.includes('Could not establish connection')
    ) {
      // Suppress these harmless extension errors
      return;
    }
    
    // Allow all other errors through
    originalError.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
