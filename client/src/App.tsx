import { PersistGate } from 'redux-persist/integration/react';

import { ErrorBoundary } from '@/components';
import { AudioProvider, useAppInitialization, useUserSync } from '@/hooks';
import { persistor } from '@/redux/store';
import AppRoutes from './AppRoutes';

/**
 * Main application component
 *
 * @component App
 * @description Root application component with providers, error boundaries, and initialization logic
 * @returns JSX.Element The rendered application with all necessary providers and components
 */
export default function App() {
	useAppInitialization();
	useUserSync();

	return (
		<ErrorBoundary>
			<PersistGate loading={null} persistor={persistor}>
				<AudioProvider>
					<AppRoutes />
				</AudioProvider>
			</PersistGate>
		</ErrorBoundary>
	);
}
