import { ChangeEvent, useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

import { VALIDATION_LENGTH } from '@shared/constants';
import { getErrorMessage, isNonEmptyString } from '@shared/utils';
import { ButtonVariant, ROUTES, SpinnerSize, SpinnerVariant, VALIDATION_MESSAGES } from '@/constants';
import { Button, Card, CloseButton, Input, Label, Spinner } from '@/components';
import { useAppDispatch } from '@/hooks';
import { authService, clientLogger as logger } from '@/services';
import type { CompleteProfileProps } from '@/types';
import { setUser } from '@/redux/slices';
import { cn } from '@/utils';

export function CompleteProfile({ onComplete }: CompleteProfileProps) {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{
		firstName?: string;
		lastName?: string;
	}>({});

	logger.userDebug('CompleteProfile component rendered');

	const isFormValid = (): boolean => {
		if (!isNonEmptyString(firstName)) {
			return false;
		}
		if (
			firstName.trim().length < VALIDATION_LENGTH.FIRST_NAME.MIN ||
			firstName.trim().length > VALIDATION_LENGTH.FIRST_NAME.MAX
		) {
			return false;
		}
		if (isNonEmptyString(lastName) && lastName.trim().length > VALIDATION_LENGTH.LAST_NAME.MAX) {
			return false;
		}
		return true;
	};

	const validateField = (name: string, value: string): string | null => {
		switch (name) {
			case 'firstName':
				if (!value.trim()) return VALIDATION_MESSAGES.FIRST_NAME_REQUIRED;
				if (value.trim().length < VALIDATION_LENGTH.FIRST_NAME.MIN) {
					return VALIDATION_MESSAGES.FIRST_NAME_MIN_LENGTH(VALIDATION_LENGTH.FIRST_NAME.MIN);
				}
				if (value.trim().length > VALIDATION_LENGTH.FIRST_NAME.MAX) {
					return VALIDATION_MESSAGES.FIRST_NAME_MAX_LENGTH(VALIDATION_LENGTH.FIRST_NAME.MAX);
				}
				break;

			case 'lastName':
				if (!value.trim()) return null;
				if (value.trim().length > VALIDATION_LENGTH.LAST_NAME.MAX) {
					return VALIDATION_MESSAGES.LAST_NAME_MAX_LENGTH(VALIDATION_LENGTH.LAST_NAME.MAX);
				}
				break;
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
			[name]: fieldError || undefined,
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

				// Update Redux state with new user data
				if (profileResponse.profile) {
					dispatch(setUser(profileResponse.profile));
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
					error: message,
				});
				setError(message);
			} finally {
				setLoading(false);
			}
		},
		[firstName, lastName, dispatch, navigate, onComplete]
	);

	const handleSkip = useCallback(() => {
		logger.userInfo('User skipped profile completion');
		navigate(ROUTES.HOME, { replace: true });
	}, [navigate]);

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
									<Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.SM} className='mr-2' />
									Saving...
								</>
							) : (
								'Complete Profile'
							)}
						</Button>
						<Button type='button' variant={ButtonVariant.OUTLINE} onClick={handleSkip} disabled={loading}>
							Skip
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
