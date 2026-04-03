import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { ensureErrorObject } from '@shared/utils';

import { FullPageSpinnerLayout, LoadingMessages, ROUTES } from '@/constants';
import { authService, clientLogger as logger, prefetchAuthenticatedQueries } from '@/services';
import { getAuthCurrentUserQueryKey, isProtectedAppPath, readAuthTokenSnapshotForQueryKey } from '@/utils';
import { BackgroundAnimation } from '@/components/ui/BackgroundAnimation';
import { FullPageSpinner } from '@/components/ui/spinner';

interface AppAuthBootstrapProps {
	children: ReactNode;
}

export function AppAuthBootstrap({ children }: AppAuthBootstrapProps): JSX.Element {
	const queryClient = useQueryClient();
	const [isReady, setIsReady] = useState(false);
	const [spinnerMessage, setSpinnerMessage] = useState<LoadingMessages>(LoadingMessages.LOADING_APP);

	useEffect(() => {
		let cancelled = false;

		const bootstrap = async (): Promise<void> => {
			setSpinnerMessage(LoadingMessages.LOADING_APP);
			try {
				let { isAuthenticated } = await authService.getAuthState();
				if (!isAuthenticated) {
					const restored = await authService.tryRestoreSession();
					if (cancelled) {
						return;
					}
					if (restored) {
						const state = await authService.getAuthState();
						isAuthenticated = state.isAuthenticated;
					}
				}

				if (cancelled) {
					return;
				}

				if (!isAuthenticated) {
					return;
				}

				setSpinnerMessage(LoadingMessages.AUTHENTICATING);
				try {
					await queryClient.fetchQuery({
						queryKey: getAuthCurrentUserQueryKey(readAuthTokenSnapshotForQueryKey()),
						queryFn: () => authService.getCurrentUser(),
					});
				} catch {
					await authService.logout();
					queryClient.clear();
					const path = window.location.pathname;
					const isAuthPage = path === ROUTES.LOGIN || path === ROUTES.REGISTER;
					const isProtectedPath = isProtectedAppPath(path);
					if (!isAuthPage && isProtectedPath) {
						window.location.href = ROUTES.HOME;
						return;
					}
				}

				if (cancelled) {
					return;
				}

				try {
					await prefetchAuthenticatedQueries();
				} catch {
					// Same as AppRoutes: optional prefetch; failures are non-fatal
				}
			} catch (error) {
				logger.systemError(ensureErrorObject(error), {
					contextMessage: 'Auth bootstrap failed',
				});
			} finally {
				if (!cancelled) {
					setIsReady(true);
				}
			}
		};

		void bootstrap();

		return () => {
			cancelled = true;
		};
	}, [queryClient]);

	if (!isReady) {
		return (
			<div className='app-shell'>
				<BackgroundAnimation />
				<FullPageSpinner message={spinnerMessage} layout={FullPageSpinnerLayout.APP_SHELL} showHomeButton={false} />
			</div>
		);
	}

	return <>{children}</>;
}
