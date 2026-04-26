import type { NavigateFunction } from 'react-router-dom';

import type { BasicUser } from '@shared/types';

import { Routes, StorageKeys } from '@/constants';
import type { ApplyPostLoginNavigationOptions } from '@/types';
import {
	safeSessionStorageGet,
	safeSessionStorageRemove,
	safeSessionStorageSet,
} from '../infrastructure/safeSessionStorage.utils';

export function applyPostLoginNavigation(
	navigate: NavigateFunction,
	user: BasicUser,
	options?: ApplyPostLoginNavigationOptions
): void {
	const goHome = (): void => {
		if (options?.navigateHomeInstead) {
			options.navigateHomeInstead();
		} else {
			navigate(Routes.HOME, { replace: true });
		}
	};

	if (user.needsLegalAcceptance) {
		navigate(Routes.LEGAL_ACCEPTANCE, { replace: true });
		return;
	}

	const oauthFromRegistration = safeSessionStorageGet(StorageKeys.OAUTH_INITIATED_FROM_REGISTRATION) === '1';
	const emailRegisterPendingAvatar =
		safeSessionStorageGet(StorageKeys.REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR) === '1';
	const registrationFlowOptionalAvatar = oauthFromRegistration || emailRegisterPendingAvatar;
	safeSessionStorageRemove(StorageKeys.OAUTH_INITIATED_FROM_REGISTRATION);
	safeSessionStorageRemove(StorageKeys.REGISTRATION_EMAIL_PENDING_OPTIONAL_AVATAR);

	const needsProfile = !user.firstName;

	if (registrationFlowOptionalAvatar) {
		if (needsProfile) {
			safeSessionStorageSet(StorageKeys.PENDING_OPTIONAL_AVATAR_AFTER_PROFILE, '1');
			navigate(Routes.COMPLETE_PROFILE, { replace: true });
		} else {
			safeSessionStorageSet(StorageKeys.SHOW_OPTIONAL_AVATAR_ON_HOME, '1');
			goHome();
		}
	} else if (needsProfile) {
		navigate(Routes.COMPLETE_PROFILE, { replace: true });
	} else {
		goHome();
	}
}
