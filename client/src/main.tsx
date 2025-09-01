/**
 * EveryTriv Client Entry Point
 *
 * @module ClientMain
 * @description Main entry point for the React client application
 */

import './index.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { store } from './redux/store';
import { queryClient } from './services/utils/queryClient';

/**
 * Initialize and render the React application
 * Sets up Redux store, React Query client, and routing
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
	<StrictMode>
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter>
					<App />
				</BrowserRouter>
			</QueryClientProvider>
		</Provider>
	</StrictMode>
);
