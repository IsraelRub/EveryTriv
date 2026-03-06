import { ChangeEvent, useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { getErrorMessage } from '@shared/utils';
import { validateName } from '@shared/validation';

import { ComponentSize, LoadingMessages, QUERY_KEYS, ROUTES } from '@/constants';
import { AlertIcon, Button, Card, CloseButton, Input, Label, Spinner } from '@/components';
import { authService, clientLogger as logger, queryClient, queryInvalidationService } from '@/services';
import type { CompleteProfileProps, ProfileFieldErrors, ProfileNameField } from '@/types';
import { profileResponseToBasicUser } from '@/utils';

const PROFILE_NAME_FIELDS: Record<ProfileNameField, { fieldName: string; required: boolean }> = {
	firstName: { fieldName: 'First name', required: true },
	lastName: { fieldName: 'Last name', required: false },
};

function validateProfileNameField(name: ProfileNameField, value: string): string | null {
	const opts = PROFILE_NAME_FIELDS[name];
	const result = validateName(value, opts);
	return result.isValid ? null : (result.errors[0] ?? null);
}

export function CompleteProfile({ onComplete }: CompleteProfileProps) {
	const navigate = useNavigate();

	const [form, setForm] = useState({ firstName: '', lastName: '' });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

	logger.userDebug('CompleteProfile component rendered');

	const isFormValid = useCallback((): boolean => {
		return (
			validateProfileNameField('firstName', form.firstName) === null &&
			validateProfileNameField('lastName', form.lastName) === null
		);
	}, [form.firstName, form.lastName]);

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (name !== 'firstName' && name !== 'lastName') return;
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
				const firstNameError = validateProfileNameField('firstName', form.firstName);
				const lastNameError = validateProfileNameField('lastName', form.lastName);

				const newFieldErrors: ProfileFieldErrors = {};
				if (firstNameError) newFieldErrors.firstName = firstNameError;
				if (lastNameError) newFieldErrors.lastName = lastNameError;

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
					queryClient.setQueryData(QUERY_KEYS.auth.currentUser(), profileResponseToBasicUser(profileResponse));
					queryInvalidationService.invalidateAuthQueries(queryClient);
				}

				// Call optional onComplete callback
				if (onComplete) {
					onComplete({ username: form.firstName, bio: form.lastName });
				}

				// Navigate to home
				logger.userInfo('Redirecting to home after profile completion');
				navigate(ROUTES.HOME, { replace: true });
			} catch (err) {
				const message = getErrorMessage(err);
				logger.userError('Profile completion failed', {
					errorInfo: { message },
				});
				setError(message);
			} finally {
				setLoading(false);
			}
		},
		[form.firstName, form.lastName, navigate, onComplete, isFormValid]
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
					<h2 className='text-2xl font-bold'>Complete Your Profile</h2>
					<p className='text-muted-foreground mt-2'>Add some details to personalize your experience</p>
				</div>

				{error && (
					<div className='bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4'>
						{error}
					</div>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<Label htmlFor='firstName'>
							First Name <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='firstName'
							name='firstName'
							value={form.firstName}
							onChange={handleChange}
							placeholder='Enter your first name'
							disabled={loading}
							error={!!fieldErrors.firstName}
						/>
						{fieldErrors.firstName && (
							<p className='text-sm text-destructive flex items-center gap-1 mt-1'>
								<AlertIcon size='sm' />
								{fieldErrors.firstName}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor='lastName'>Last Name</Label>
						<Input
							id='lastName'
							name='lastName'
							value={form.lastName}
							onChange={handleChange}
							placeholder='Enter your last name'
							disabled={loading}
							error={!!fieldErrors.lastName}
						/>
						{fieldErrors.lastName && (
							<p className='text-sm text-destructive flex items-center gap-1 mt-1'>
								<AlertIcon size='sm' />
								{fieldErrors.lastName}
							</p>
						)}
					</div>

					<div className='flex gap-4'>
						<Button type='submit' className='flex-1' disabled={loading || !isFormValid()}>
							{loading ? (
								<Spinner size={ComponentSize.SM} message={LoadingMessages.SAVING} messageInline />
							) : (
								'Complete Profile'
							)}
						</Button>
					</div>
				</form>

				<p className='text-xs text-muted-foreground text-center mt-4'>
					You can always update your profile later in the settings
				</p>
			</Card>
		</motion.div>
	);
}
