/**
 * EveryTriv Client Entry Point
 *
 * @module ClientMain
 * @description Main entry point for the React client application
 */

import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/services';

import { store } from '@/redux/store';

import App from './App';

/**
 * Initialize and render the React application
 * Sets up Redux store, React Query client, and routing
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error('Root element not found');
}

createRoot(rootElement).render(
	<StrictMode>
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<BrowserRouter
					future={{
						v7_startTransition: true,
						v7_relativeSplatPath: true,
					}}
				>
					<App />
				</BrowserRouter>
			</QueryClientProvider>
		</Provider>
	</StrictMode>
);
