import { FormEvent, memo, useCallback, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { UserRole } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { ValidationStatus } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { setUser } from '@/redux/slices';

import { ButtonVariant, ComponentSize } from '../../constants';
import { authService } from '../../services';
import { fadeInUp, hoverScale } from '../animations';
import { Avatar, Button, ValidatedInput, ValidationMessage } from '../ui';

const CompleteProfile = memo(function CompleteProfile() {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	// Memoize initial form data
	const initialFormData = useMemo(
		() => ({
			firstName: '',
			lastName: '',
			avatar: '',
		}),
		[]
	);

	const [formData, setFormData] = useState(initialFormData);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	// Enhanced validation with form validation hook

	const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
	const [validationErrors, setValidationErrors] = useState<string[]>([]);

	const validateForm = useCallback((): boolean => {
		// Simple validation
		if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
			setValidationErrors(['First name must be at least 2 characters']);
			setValidationStatus('invalid');
			return false;
		}

		if (formData.avatar && !isValidAvatarUrl(formData.avatar)) {
			setValidationErrors([
				'Please enter a valid avatar URL from an allowed domain (HTTPS only, image formats: jpg, jpeg, png, gif, webp, svg)',
			]);
			setValidationStatus('invalid');
			return false;
		}

		setValidationErrors([]);
		setValidationStatus('valid');
		return true;
	}, [formData]);

	const isValidAvatarUrl = useCallback((url: string): boolean => {
		try {
			const urlObj = new URL(url);

			// Must be HTTPS
			if (urlObj.protocol !== 'https:') {
				return false;
			}

			// Check for allowed domains
			const allowedDomains = [
				'googleusercontent.com',
				'gravatar.com',
				'github.com',
				'githubusercontent.com',
				'imgur.com',
				'cloudinary.com',
				'amazonaws.com',
				'googleapis.com',
			];

			const isAllowedDomain = allowedDomains.some(
				domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
			);

			if (!isAllowedDomain) {
				return false;
			}

			// Check file extension
			const validExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
			if (!validExtensions.test(urlObj.pathname)) {
				return false;
			}

			// Check for suspicious patterns
			const suspiciousPatterns = [/\.exe$/i, /\.php$/i, /\.js$/i, /\.html$/i, /\.htm$/i, /script/i, /javascript/i];

			if (suspiciousPatterns.some(pattern => pattern.test(url))) {
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}, []);

	// Form validation is now handled by the useFormValidation hook

	const handleSubmit = useCallback(
		async (e: FormEvent) => {
			e.preventDefault();
			setLoading(true);
			setError('');
			setValidationStatus('validating');

			// Validate form before submission
			if (!validateForm()) {
				setLoading(false);
				return;
			}

			try {
				const profileResponse = await authService.completeProfile({
					firstName: formData.firstName,
					lastName: formData.lastName,
					avatar: formData.avatar,
				});
				// Extract user data from profile response
				const profile = profileResponse.profile;
				const userData = {
					id: profile.id || '',
					username: profile.username || '',
					email: profile.email || '',
					role: profile.role || UserRole.USER,
				};
				dispatch(setUser(userData));
				setValidationStatus('valid');
				navigate('/');
			} catch (error) {
				setError('Failed to update profile. Please try again.');
				setValidationStatus('invalid');
				logger.userError('Profile completion error', {
					error: getErrorMessage(error),
				});
			} finally {
				setLoading(false);
			}
		},
		[formData, dispatch, navigate, validateForm]
	);

	const handleSkip = useCallback(() => {
		navigate('/');
	}, [navigate]);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700 py-16 px-12'>
			<motion.div variants={fadeInUp} initial='hidden' animate='visible' className='max-w-md w-full space-y-8'>
				<div className='glass p-8 rounded-lg'>
					<div className='text-center mb-8'>
						<h2 className='text-3xl font-bold text-white'>Complete Your Profile</h2>
						<p className='text-slate-300 mt-2'>Add some details to personalize your experience</p>
					</div>

					{/* Validation Message */}
					<ValidationMessage status={validationStatus} errors={validationErrors} className='mb-4' />

					{error && (
						<div className='bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4'>{error}</div>
					)}

					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label htmlFor='firstName' className='block text-sm font-medium text-slate-300 mb-2'>
								First Name *
							</label>
							<ValidatedInput
								id='firstName'
								type='text'
								validationType='username'
								value={formData.firstName}
								initialValue={formData.firstName}
								onChange={(value: string) => {
									setFormData(prev => ({ ...prev, firstName: value }));
									// Form validation is handled automatically by the hook
								}}
								placeholder='Enter your first name'
								className='w-full'
							/>
						</div>
						<div>
							<label htmlFor='lastName' className='block text-sm font-medium text-slate-300 mb-2'>
								Last Name
							</label>
							<ValidatedInput
								id='lastName'
								type='text'
								validationType='username'
								value={formData.lastName}
								initialValue={formData.lastName}
								onChange={(value: string) => {
									setFormData(prev => ({ ...prev, lastName: value }));
									// Form validation is handled automatically by the hook
								}}
								placeholder='Enter your last name'
								className='w-full'
							/>
						</div>

						<div>
							<label htmlFor='avatar' className='block text-sm font-medium text-slate-300 mb-2'>
								Avatar URL (optional)
							</label>
							<input
								id='avatar'
								type='url'
								value={formData.avatar}
								onChange={e => {
									const value = e.target.value;
									setFormData(prev => ({ ...prev, avatar: value }));
									// Form validation is handled automatically by the hook
								}}
								placeholder='Enter avatar URL'
								className='w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
							/>
						</div>

						{formData.avatar && (
							<div className='text-center'>
								<Avatar
									src={formData.avatar}
									username={formData.firstName}
									firstName={formData.firstName}
									lastName={formData.lastName}
									size={ComponentSize.LG}
									alt='Avatar preview'
									showLoading={true}
									lazy={false}
								/>
							</div>
						)}

						<div className='flex space-x-4'>
							<motion.div variants={hoverScale} initial='normal' whileHover='hover'>
								<Button
									type='submit'
									variant={ButtonVariant.PRIMARY}
									className='flex-1'
									disabled={loading || validationStatus === 'invalid'}
								>
									{loading ? (
										<div className='flex items-center justify-center'>
											<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
											Saving...
										</div>
									) : (
										'Complete Profile'
									)}
								</Button>
							</motion.div>

							<motion.div variants={hoverScale} initial='normal' whileHover='hover'>
								<Button
									type='button'
									variant={ButtonVariant.GHOST}
									onClick={handleSkip}
									className='flex-1 text-slate-300 hover:text-white'
									disabled={loading}
								>
									Skip
								</Button>
							</motion.div>
						</div>
					</form>

					<div className='mt-6 text-center'>
						<p className='text-xs text-slate-400'>You can always update your profile later in the settings</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
});

export default CompleteProfile;
