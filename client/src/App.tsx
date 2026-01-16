import { PersistGate } from 'redux-persist/integration/react';

import { ErrorBoundary } from '@/components';
import { useAppInitialization, useAuthLogoutHandler } from '@/hooks';
import { persistor } from '@/redux/store';
import AppRoutes from './AppRoutes';

export default function App() {
	useAppInitialization();
	useAuthLogoutHandler();

	return (
		<ErrorBoundary>
			<PersistGate loading={null} persistor={persistor}>
				<AppRoutes />
			</PersistGate>
		</ErrorBoundary>
	);
}
