import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { Button, Card, CloseButton, Input, Label } from '@/components';
import { useAppDispatch } from '@/hooks';
import { setUser } from '@/redux/slices';
import { authService } from '@/services';
import type { CompleteProfileProps } from '@/types';

export function CompleteProfile({ onComplete }: CompleteProfileProps) {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	logger.userDebug('CompleteProfile component rendered');

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			setLoading(true);
			setError(null);

			logger.userInfo('Profile completion started');

			try {
				// Basic validation
				if (!firstName.trim() || firstName.trim().length < 2) {
					logger.userWarn('Profile validation failed - first name too short');
					setError('First name must be at least 2 characters');
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
				navigate('/', { replace: true });
			} catch (err) {
				const message = getErrorMessage(err);
				logger.userError('Profile completion failed', {
					error: message,
				});
				setError(message || 'Failed to update profile. Please try again.');
			} finally {
				setLoading(false);
			}
		},
		[firstName, lastName, dispatch, navigate, onComplete]
	);

	const handleSkip = useCallback(() => {
		logger.userInfo('User skipped profile completion');
		navigate('/', { replace: true });
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
							value={firstName}
							onChange={e => setFirstName(e.target.value)}
							placeholder='Enter your first name'
							required
							disabled={loading}
						/>
					</div>
					<div>
						<Label htmlFor='lastName'>Last Name</Label>
						<Input
							id='lastName'
							value={lastName}
							onChange={e => setLastName(e.target.value)}
							placeholder='Enter your last name'
							disabled={loading}
						/>
					</div>

					<div className='flex gap-4'>
						<Button type='submit' className='flex-1' disabled={loading}>
							{loading ? (
								<span className='flex items-center justify-center'>
									<span className='animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white border-r-white mr-2' />
									Saving...
								</span>
							) : (
								'Complete Profile'
							)}
						</Button>
						<Button type='button' variant='outline' onClick={handleSkip} disabled={loading}>
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
