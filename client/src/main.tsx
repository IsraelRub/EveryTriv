import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { ERROR_MESSAGES } from '@shared/constants';

import { queryClient } from '@/services';
import { store } from '@/redux/store';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
	throw new Error(ERROR_MESSAGES.general.ROOT_ELEMENT_NOT_FOUND);
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
