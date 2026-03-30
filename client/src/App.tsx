import { Fragment } from 'react';
import { PersistGate } from 'redux-persist/integration/react';

import { FullPageSpinnerLayout, LoadingMessages } from '@/constants';
import { AppAuthBootstrap, BackgroundAnimation, ErrorBoundary, FullPageSpinner, LocaleSync } from '@/components';
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
						<FullPageSpinner message={LoadingMessages.LOADING_APP} layout={FullPageSpinnerLayout.APP_SHELL} showHomeButton={false} />
					</div>
				}
				persistor={persistor}
			>
				<Fragment>
					<LocaleSync />
					<AppAuthBootstrap>
						<AppRoutes />
					</AppAuthBootstrap>
				</Fragment>
			</PersistGate>
		</ErrorBoundary>
	);
}
