import { ChangeEvent, useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

import { getErrorMessage } from '@shared/utils';
import { validateFirstName, validateLastName } from '@shared/validation';

import { QUERY_KEYS, ROUTES, SpinnerSize } from '@/constants';
import { Button, Card, CloseButton, Input, Label, Spinner } from '@/components';
import { authService, clientLogger as logger, queryClient } from '@/services';
import type { CompleteProfileProps, ProfileFieldErrors } from '@/types';
import { cn } from '@/utils';

export function CompleteProfile({ onComplete }: CompleteProfileProps) {
	const navigate = useNavigate();

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({});

	logger.userDebug('CompleteProfile component rendered');

	const isFormValid = useCallback((): boolean => {
		const firstNameValidation = validateFirstName(firstName);
		if (!firstNameValidation.isValid) {
			return false;
		}
		const lastNameValidation = validateLastName(lastName, false);
		if (!lastNameValidation.isValid) {
			return false;
		}
		return true;
	}, [firstName, lastName]);

	const validateField = (name: string, value: string): string | null => {
		switch (name) {
			case 'firstName': {
				const validation = validateFirstName(value);
				return validation.isValid ? null : (validation.errors[0] ?? null);
			}

			case 'lastName': {
				const validation = validateLastName(value, false);
				return validation.isValid ? null : (validation.errors[0] ?? null);
			}
		}
		return null;
	};

	const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		switch (name) {
			case 'firstName':
				setFirstName(value);
				break;
			case 'lastName':
				setLastName(value);
				break;
		}
		setError(null);

		const fieldError = validateField(name, value);
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
				const firstNameError = validateField('firstName', firstName);
				const lastNameError = validateField('lastName', lastName);

				const newFieldErrors: typeof fieldErrors = {};
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
					firstName: firstName.trim(),
					lastName: lastName.trim(),
				});

				logger.authProfileUpdate('Profile completed successfully', {
					userId: profileResponse.profile?.id,
				});

				// Update React Query cache with new user data
				if (profileResponse.profile) {
					queryClient.setQueryData(QUERY_KEYS.auth.currentUser(), profileResponse.profile);
					queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.all });
				}

				// Call optional onComplete callback
				if (onComplete) {
					onComplete({ username: firstName, bio: lastName });
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
		[firstName, lastName, navigate, onComplete, isFormValid]
	);

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className='min-h-screen flex items-center justify-center px-4'
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
							value={firstName}
							onChange={handleChange}
							placeholder='Enter your first name'
							disabled={loading}
							className={cn(fieldErrors.firstName && 'border-destructive')}
						/>
						{fieldErrors.firstName && (
							<p className='text-sm text-destructive flex items-center gap-1 mt-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.firstName}
							</p>
						)}
					</div>
					<div>
						<Label htmlFor='lastName'>Last Name</Label>
						<Input
							id='lastName'
							name='lastName'
							value={lastName}
							onChange={handleChange}
							placeholder='Enter your last name'
							disabled={loading}
							className={cn(fieldErrors.lastName && 'border-destructive')}
						/>
						{fieldErrors.lastName && (
							<p className='text-sm text-destructive flex items-center gap-1 mt-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.lastName}
							</p>
						)}
					</div>

					<div className='flex gap-4'>
						<Button type='submit' className='flex-1' disabled={loading || !isFormValid()}>
							{loading ? (
								<>
									<Spinner size={SpinnerSize.SM} variant='loader' className='mr-2' />
									Saving...
								</>
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
