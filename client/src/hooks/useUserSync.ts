import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { RootState } from '@/types';
import { setUser } from '@/redux/slices';
import { authService, clientLogger as logger } from '@/services';
import { useCurrentUser } from './useAuth';
import { hasMissingProfileFields } from '@/utils';

/**
 * Hook for synchronizing user state between Redux and server
 * Handles token verification and user data synchronization
 */
export const useUserSync = () => {
	const dispatch = useDispatch();
	const { isAuthenticated, currentUser: reduxUser, isLoading } = useSelector((state: RootState) => state.user);
	const { data: currentUser } = useCurrentUser();

	// Verify token matches Redux user state on mount and when token might have changed
	// This ensures that if another tab changed the user, this tab will detect the mismatch
	// Don't verify if authentication is still loading to avoid race conditions
	useEffect(() => {
		const verifyTokenMatch = async () => {
			if (reduxUser && isAuthenticated && !isLoading) {
				const tokenMatches = await authService.verifyStoredTokenForUser(reduxUser.id);
				if (!tokenMatches) {
					logger.authInfo('Token mismatch detected - token changed in another tab, clearing Redux state', {
						userId: reduxUser.id,
					});
					// Token doesn't match user - clear Redux state
					// The token will be used to fetch the correct user on next API call
					// setUser(null) already sets isAuthenticated = false
					dispatch(setUser(null));
				}
			}
		};

		verifyTokenMatch();
	}, [reduxUser, isAuthenticated, isLoading, dispatch]);

	// Sync Redux with current user from server
	// Only update if user ID changed to prevent overwriting user data from registration/login
	// Don't update if authentication is still loading to avoid race conditions with fetchUserData
	useEffect(() => {
		if (currentUser && isAuthenticated && !isLoading) {
			const shouldUpdateUser =
				!reduxUser || reduxUser.id !== currentUser.id || hasMissingProfileFields(reduxUser, currentUser);

			if (shouldUpdateUser) {
				logger.authInfo('Updating Redux user from server query', {
					fromUserId: reduxUser?.id,
					toUserId: currentUser.id,
					fromEmail: reduxUser?.email,
					toEmail: currentUser.email,
					reason: !reduxUser
						? 'redux_user_missing'
						: reduxUser.id !== currentUser.id
							? 'different_user_ids'
							: 'profile_fields_missing',
				});
				dispatch(setUser(currentUser));
				logger.authInfo('User data synced with Redux', { userId: currentUser.id });
			} else {
				logger.authInfo('Skipping Redux update - user ID unchanged and profile complete', {
					userId: currentUser.id,
					email: currentUser.email,
				});
			}
		}
	}, [currentUser, isAuthenticated, isLoading, dispatch, reduxUser]);
};

