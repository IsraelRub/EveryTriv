import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import { getErrorMessage } from '@shared/utils';
import { validateEmail, validatePassword, validatePasswordMatch } from '@shared/validation';

import {
	AudioKey,
	ButtonSize,
	ButtonVariant,
	ROUTES,
	SpinnerSize,
	VALIDATION_MESSAGES,
	VariantBase,
} from '@/constants';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	CloseButton,
	GoogleAuthButton,
	Input,
	Label,
	Separator,
	Spinner,
} from '@/components';
import { useModalRoute, useRegister } from '@/hooks';
import { audioService, authService } from '@/services';
import type { RegistrationFieldErrors } from '@/types';
import { cn } from '@/utils';

export function RegistrationView() {
	const navigate = useNavigate();
	const registerMutation = useRegister();
	const { isModal, closeModal, returnUrl } = useModalRoute();

	const [formData, setFormData] = useState({
		email: '',
		password: '',
		confirmPassword: '',
		firstName: '',
		lastName: '',
	});
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<RegistrationFieldErrors>({});

	const isLoading = registerMutation.isPending;

	const isFormValid = (): boolean => {
		const emailValidation = validateEmail(formData.email);
		const passwordValidation = validatePassword(formData.password);
		const passwordMatchValidation =
			formData.confirmPassword !== undefined
				? validatePasswordMatch(formData.password, formData.confirmPassword)
				: { isValid: true, errors: [] };
		return emailValidation.isValid && passwordValidation.isValid && passwordMatchValidation.isValid;
	};

	const validateField = (name: string, value: string): string | null => {
		if (name === 'email') {
			const validation = validateEmail(value);
			return validation.isValid ? null : (validation.errors[0] ?? VALIDATION_MESSAGES.EMAIL_INVALID);
		}
		if (name === 'password') {
			const validation = validatePassword(value);
			return validation.isValid ? null : (validation.errors[0] ?? VALIDATION_MESSAGES.PASSWORD_INVALID);
		}
		if (name === 'confirmPassword') {
			const validation = validatePasswordMatch(formData.password, value);
			return validation.isValid ? null : (validation.errors[0] ?? VALIDATION_MESSAGES.PASSWORD_CONFIRMATION_INVALID);
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
			[name]: fieldError ?? undefined,
		}));

		// Also validate confirmPassword when password changes
		if (name === 'password' && formData.confirmPassword) {
			const confirmError = validateField('confirmPassword', formData.confirmPassword);
			setFieldErrors(prev => ({
				...prev,
				confirmPassword: confirmError ?? undefined,
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

		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if (emailError || passwordError || confirmPasswordError) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		if (!isFormValid()) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		try {
			await registerMutation.mutateAsync({
				email: formData.email,
				password: formData.password,
				firstName: formData.firstName ?? undefined,
				lastName: formData.lastName ?? undefined,
			});
			audioService.play(AudioKey.SUCCESS);
			if (isModal) {
				closeModal();
			} else {
				navigate(returnUrl ?? '/');
			}
		} catch (err) {
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
		<Card className='w-full max-w-md relative'>
			{!isModal && <CloseButton className='absolute top-4 left-4' />}
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
								<Spinner size={SpinnerSize.SM} variant='loader' className='mr-2' />
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

				<GoogleAuthButton onClick={handleGoogleSignup} disabled={isLoading} />

				<div className='text-center text-sm'>
					<span className='text-muted-foreground'>Already have an account? </span>
					<Button
						type='button'
						variant={ButtonVariant.GHOST}
						size={ButtonSize.SM}
						onClick={() => navigate(ROUTES.LOGIN, { state: { modal: isModal } })}
						className='h-auto p-0 text-primary font-medium hover:underline'
					>
						Sign in
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
