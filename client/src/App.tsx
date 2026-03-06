import { PersistGate } from 'redux-persist/integration/react';

import { LoadingMessages } from '@/constants';
import { BackgroundAnimation, ErrorBoundary, FullPageSpinner } from '@/components';
import { useAppInitialization, useAuthLogoutHandler } from '@/hooks';
import { persistor } from '@/redux/store';
import AppRoutes from './AppRoutes';

export default function App() {
	useAppInitialization();
	useAuthLogoutHandler();

	return (
		<ErrorBoundary>
			<PersistGate
				loading={
					<div className='app-shell'>
						<BackgroundAnimation />
						<FullPageSpinner message={LoadingMessages.LOADING_APP} layout='appShell' showHomeButton={false} />
					</div>
				}
				persistor={persistor}
			>
				<AppRoutes />
			</PersistGate>
		</ErrorBoundary>
	);
}
