import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { LengthKey } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';
import { validateStringLength } from '@shared/validation';

import { AlertIconSize, AuthKey, ComponentSize, LoadingKey, ProfileNameField, Routes, StorageKeys } from '@/constants';
import type { CompleteProfileProps, ProfileFieldErrors } from '@/types';
import { authService, clientLogger as logger, queryClient, queryInvalidationService } from '@/services';
import {
	getTranslatedErrorMessage,
	safeSessionStorageGet,
	safeSessionStorageRemove,
	safeSessionStorageSet,
	translateValidationMessage,
} from '@/utils';
import { AlertIcon, Button, Card, CloseButton, Input, Label, Spinner } from '@/components';

function validateProfileNameField(name: ProfileNameField, value: string): string | null {
	const lengthKey = name === ProfileNameField.FIRST_NAME ? LengthKey.FIRST_NAME : LengthKey.LAST_NAME;
	const result = validateStringLength(value, lengthKey);
	return result.isValid ? null : (result.errors[0] ?? null);
}

export function CompleteProfile({ onComplete }: CompleteProfileProps) {
	const { t } = useTranslation(['auth', 'loading', 'common', 'errors']);
	const navigate = useNavigate();

	const [form, setForm] = useState({ firstName: '', lastName: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

	logger.userDebug('CompleteProfile component rendered');

	const isFormValid = useCallback((): boolean => {
		return (
			validateProfileNameField(ProfileNameField.FIRST_NAME, form.firstName) === null &&
			validateProfileNameField(ProfileNameField.LAST_NAME, form.lastName) === null
		);
	}, [form.firstName, form.lastName]);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (name !== ProfileNameField.FIRST_NAME && name !== ProfileNameField.LAST_NAME) return;
		setForm(prev => ({ ...prev, [name]: value }));
		setError(null);
		const fieldError = validateProfileNameField(name, value);
		setFieldErrors(prev => ({
			...prev,
			[name]: fieldError ?? undefined,
		}));
	}, []);

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			setLoading(true);
			setError(null);

			logger.userInfo('Profile completion started');

			try {
				const firstNameError = validateProfileNameField(ProfileNameField.FIRST_NAME, form.firstName);
				const lastNameError = validateProfileNameField(ProfileNameField.LAST_NAME, form.lastName);

				const newFieldErrors: ProfileFieldErrors = {};
				if (firstNameError) newFieldErrors.firstName = translateValidationMessage(firstNameError, t);
				if (lastNameError) newFieldErrors.lastName = translateValidationMessage(lastNameError, t);

				setFieldErrors(newFieldErrors);

				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				if (firstNameError || lastNameError) {
					setLoading(false);
					return;
				}

				if (!isFormValid()) {
					setLoading(false);
					return;
				}

				logger.userDebug('Submitting profile to server');

				const profileResponse = await authService.completeProfile({
					firstName: form.firstName.trim(),
					lastName: form.lastName.trim(),
				});

				logger.authProfileUpdate('Profile completed successfully', {
					userId: profileResponse.profile?.id,
				});

				if (profileResponse.profile) {
					try {
						await queryInvalidationService.syncUserProfileResponseFromMutation(queryClient, profileResponse);
					} catch (syncError) {
						logger.userDebug('Complete profile: cache sync failed (ignored)', {
							errorInfo: { message: getErrorMessage(syncError) },
						});
					}
				}

				// Call optional onComplete callback
				if (onComplete) {
					onComplete({ username: form.firstName, bio: form.lastName });
				}

				const pendingOptionalAvatar = safeSessionStorageGet(StorageKeys.PENDING_OPTIONAL_AVATAR_AFTER_PROFILE) === '1';
				safeSessionStorageRemove(StorageKeys.PENDING_OPTIONAL_AVATAR_AFTER_PROFILE);

				if (pendingOptionalAvatar) {
					logger.userInfo('Redirecting home with optional avatar welcome after profile completion');
					safeSessionStorageSet(StorageKeys.SHOW_OPTIONAL_AVATAR_ON_HOME, '1');
					navigate(Routes.HOME, { replace: true });
				} else {
					logger.userInfo('Redirecting to home after profile completion');
					navigate(Routes.HOME, { replace: true });
				}
			} catch (err) {
				const message = getErrorMessage(err);
				logger.userError('Profile completion failed', {
					errorInfo: { message },
				});
				setError(getTranslatedErrorMessage(t, err));
			} finally {
				setLoading(false);
			}
		},
		[form.firstName, form.lastName, navigate, onComplete, isFormValid, t]
	);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className='view-main flex flex-col items-center justify-center'
		>
			<Card className='p-6 max-w-md w-full relative'>
				<CloseButton className='absolute top-4 right-4' />
				<div className='text-center mb-6'>
					<h2 className='text-2xl font-bold'>{t(AuthKey.COMPLETE_YOUR_PROFILE)}</h2>
					<p className='text-muted-foreground mt-2'>{t(AuthKey.ADD_DETAILS_TO_PERSONALIZE)}</p>
				</div>

				{error && (
					<div className='bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4'>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<Label>
							{t(AuthKey.FIRST_NAME)} <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='firstName'
							name='firstName'
							value={form.firstName}
							onChange={handleChange}
							placeholder={t(AuthKey.ENTER_FIRST_NAME)}
							disabled={loading}
							error={!!fieldErrors.firstName}
						/>
						{fieldErrors.firstName && (
							<p className='text-sm text-destructive flex items-center gap-1 mt-1'>
								<AlertIcon size={AlertIconSize.SM} />
								{fieldErrors.firstName}
							</p>
						)}
					</div>
					<div>
						<Label>{t(AuthKey.LAST_NAME)}</Label>
						<Input
							id='lastName'
							name='lastName'
							value={form.lastName}
							onChange={handleChange}
							placeholder={t(AuthKey.ENTER_LAST_NAME)}
							disabled={loading}
							error={!!fieldErrors.lastName}
						/>
						{fieldErrors.lastName && (
							<p className='text-sm text-destructive flex items-center gap-1 mt-1'>
								<AlertIcon size={AlertIconSize.SM} />
								{fieldErrors.lastName}
							</p>
						)}
					</div>

					<div className='flex gap-4'>
						<Button type='submit' className='flex-1' disabled={loading || !isFormValid()}>
							{!loading ? (
								t(AuthKey.COMPLETE_PROFILE_BUTTON)
							) : (
								<Spinner size={ComponentSize.SM} message={t(LoadingKey.SAVING)} messageInline />
							)}
						</Button>
					</div>
				</form>

				<p className='text-xs text-muted-foreground text-center mt-4'>{t(AuthKey.UPDATE_PROFILE_LATER)}</p>
			</Card>
		</motion.div>
	);
}
