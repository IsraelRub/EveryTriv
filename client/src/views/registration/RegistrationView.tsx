import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { getErrorMessage } from '@shared/utils';
import { AudioKey, ButtonSize, ButtonVariant, ROUTES, SpinnerSize, SpinnerVariant, VALIDATION_MESSAGES, VariantBase } from '@/constants';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Separator,
	Spinner,
} from '@/components';
import { useAudio, useModalRoute, useRegister } from '@/hooks';
import { authService } from '@/services';
import { cn } from '@/utils';
import {
	validateEmailFormat,
	validatePasswordForm,
	validatePasswordLength,
	validatePasswordMatch,
} from '@/utils/validation';

/**
 * Registration View
 * @description User registration page with form validation and Google OAuth
 */
export function RegistrationView() {
	const navigate = useNavigate();
	const registerMutation = useRegister();
	const audioService = useAudio();
	const { isModal, closeModal, returnUrl } = useModalRoute();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
	});
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
		password?: string;
		confirmPassword?: string;
	}>({});

	const isLoading = registerMutation.isPending;

	const isFormValid = (): boolean => {
		const emailValidation = validateEmailFormat(formData.email);
		const passwordValidation = validatePasswordForm({
			newPassword: formData.password,
			confirmPassword: formData.confirmPassword,
		});
		return emailValidation.isValid && passwordValidation.isValid;
	};

	const validateField = (name: string, value: string): string | null => {
		if (name === 'email') {
			const validation = validateEmailFormat(value);
			if (!validation.isValid) {
				return validation.errors[0] || VALIDATION_MESSAGES.EMAIL_INVALID;
			}
		}
		if (name === 'password') {
			const validation = validatePasswordLength(value);
			if (!validation.isValid) {
				return validation.errors[0] || VALIDATION_MESSAGES.PASSWORD_INVALID;
			}
		}
		if (name === 'confirmPassword') {
			const validation = validatePasswordMatch(formData.password, value);
			if (!validation.isValid) {
				return validation.errors[0] || VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_INVALID;
			}
		}
		return null;
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
		setError(null);

		// Validate field in real-time
		const fieldError = validateField(name, value);
		setFieldErrors(prev => ({
			...prev,
			[name]: fieldError || undefined,
		}));

		// Also validate confirmPassword when password changes
		if (name === 'password' && formData.confirmPassword) {
			const confirmError = validateField('confirmPassword', formData.confirmPassword);
			setFieldErrors(prev => ({
				...prev,
				confirmPassword: confirmError || undefined,
			}));
		}
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		// Validate all fields on submit
		const emailError = validateField('email', formData.email);
		const passwordError = validateField('password', formData.password);
		const confirmPasswordError = validateField('confirmPassword', formData.confirmPassword);

		const newFieldErrors: typeof fieldErrors = {};
		if (emailError) newFieldErrors.email = emailError;
		if (passwordError) newFieldErrors.password = passwordError;
		if (confirmPasswordError) newFieldErrors.confirmPassword = confirmPasswordError;

		setFieldErrors(newFieldErrors);

		if (emailError || passwordError || confirmPasswordError) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		if (!isFormValid()) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		try {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/b690d1e6-594a-4c2e-ab83-a0a7238f9eda', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					location: 'RegistrationView.tsx:92',
					message: 'calling registerMutation.mutateAsync',
					data: { email: formData.email, hasPassword: !!formData.password },
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run1',
					hypothesisId: 'C',
				}),
			}).catch(() => {});
			// #endregion
			await registerMutation.mutateAsync({
				email: formData.email,
				password: formData.password,
				confirmPassword: formData.confirmPassword,
				firstName: formData.firstName || undefined,
				lastName: formData.lastName || undefined,
			});
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/b690d1e6-594a-4c2e-ab83-a0a7238f9eda', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					location: 'RegistrationView.tsx:100',
					message: 'registerMutation.mutateAsync completed successfully',
					data: { isModal, returnUrl },
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run1',
					hypothesisId: 'C',
				}),
			}).catch(() => {});
			// #endregion
			audioService.play(AudioKey.SUCCESS);
			if (isModal) {
				closeModal();
			} else {
				navigate(returnUrl || '/');
			}
		} catch (err) {
			// #region agent log
			fetch('http://127.0.0.1:7242/ingest/b690d1e6-594a-4c2e-ab83-a0a7238f9eda', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					location: 'RegistrationView.tsx:106',
					message: 'registerMutation.mutateAsync failed',
					data: { error: getErrorMessage(err), errorType: err?.constructor?.name },
					timestamp: Date.now(),
					sessionId: 'debug-session',
					runId: 'run1',
					hypothesisId: 'D',
				}),
			}).catch(() => {});
			// #endregion
			const errorMessage = getErrorMessage(err);
			setError(errorMessage);
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleGoogleSignup = async () => {
		setError(null);
		try {
			await authService.initiateGoogleLogin();
		} catch (err) {
			const errorMessage = getErrorMessage(err);
			setError(errorMessage);
		}
	};

	return (
		<Card className='w-full max-w-md'>
			<CardHeader className='text-center space-y-2'>
				<CardTitle className='text-3xl font-bold'>Create Account</CardTitle>
				<CardDescription>Join EveryTriv and start playing trivia</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{error && (
					<Alert variant={VariantBase.DESTRUCTIVE}>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='firstName'>First Name</Label>
							<Input
								id='firstName'
								name='firstName'
								type='text'
								placeholder='John'
								value={formData.firstName}
								onChange={handleChange}
								disabled={isLoading}
								autoComplete='given-name'
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='lastName'>Last Name</Label>
							<Input
								id='lastName'
								name='lastName'
								type='text'
								placeholder='Doe'
								value={formData.lastName}
								onChange={handleChange}
								disabled={isLoading}
								autoComplete='family-name'
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='email'>
							Email <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='email'
							name='email'
							type='email'
							placeholder='your@email.com'
							value={formData.email}
							onChange={handleChange}
							disabled={isLoading}
							autoComplete='email'
							className={cn(fieldErrors.email && 'border-destructive')}
						/>
						{fieldErrors.email && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.email}
							</p>
						)}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='password'>
							Password <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='password'
							name='password'
							type='password'
							placeholder='Enter your password'
							value={formData.password}
							onChange={handleChange}
							disabled={isLoading}
							autoComplete='new-password'
							className={cn(fieldErrors.password && 'border-destructive')}
						/>
						{fieldErrors.password && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.password}
							</p>
						)}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='confirmPassword'>
							Confirm Password <span className='text-destructive'>*</span>
						</Label>
						<div className='relative'>
							<Input
								id='confirmPassword'
								name='confirmPassword'
								type='password'
								placeholder='Confirm your password'
								value={formData.confirmPassword}
								onChange={handleChange}
								disabled={isLoading}
								autoComplete='new-password'
								className={cn(fieldErrors.confirmPassword && 'border-destructive')}
							/>
							{formData.confirmPassword &&
								formData.password === formData.confirmPassword &&
								!fieldErrors.confirmPassword && (
									<CheckCircle2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500' />
								)}
						</div>
						{fieldErrors.confirmPassword && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.confirmPassword}
							</p>
						)}
					</div>

					<Button type='submit' className='w-full' size={ButtonSize.LG} disabled={isLoading || !isFormValid()}>
						{isLoading ? (
							<>
								<Spinner variant={SpinnerVariant.BUTTON} size={SpinnerSize.SM} className='mr-2' />
								Creating account...
							</>
						) : (
							'Create Account'
						)}
					</Button>
				</form>

				<div className='relative'>
					<div className='absolute inset-0 flex items-center'>
						<Separator className='w-full' />
					</div>
					<div className='relative flex justify-center text-xs uppercase'>
						<span className='bg-card px-2 text-muted-foreground'>Or continue with</span>
					</div>
				</div>

				<Button
					type='button'
					variant={ButtonVariant.OUTLINE}
					className='w-full'
					size={ButtonSize.LG}
					onClick={handleGoogleSignup}
					disabled={isLoading}
				>
					<svg className='mr-2 h-4 w-4' viewBox='0 0 24 24'>
						<path
							d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
							fill='#4285F4'
						/>
						<path
							d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
							fill='#34A853'
						/>
						<path
							d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
							fill='#FBBC05'
						/>
						<path
							d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
							fill='#EA4335'
						/>
					</svg>
					Continue with Google
				</Button>

				<div className='text-center text-sm'>
					<span className='text-muted-foreground'>Already have an account? </span>
					<button
						type='button'
						onClick={() => navigate(ROUTES.LOGIN, { state: { modal: isModal } })}
						className='text-primary font-medium hover:underline'
					>
						Sign in
					</button>
				</div>
			</CardContent>
		</Card>
	);
}
