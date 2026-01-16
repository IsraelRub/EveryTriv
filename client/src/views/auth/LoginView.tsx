import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import { getErrorMessage, isNonEmptyString } from '@shared/utils';
import { validateEmail } from '@shared/validation';

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
	LinkButton,
	Separator,
	Spinner,
} from '@/components';
import { useLogin, useModalRoute } from '@/hooks';
import { audioService, authService } from '@/services';
import type { LoginFieldErrors } from '@/types';
import { cn } from '@/utils';

export function LoginView() {
	const navigate = useNavigate();
	const loginMutation = useLogin();
	const { isModal, closeModal, returnUrl } = useModalRoute();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

	const isLoading = loginMutation.isPending;

	const isFormValid = (): boolean => {
		const emailValidation = validateEmail(email);
		return emailValidation.isValid && isNonEmptyString(password);
	};

	const validateField = (name: string, value: string): string | null => {
		switch (name) {
			case 'email': {
				const validation = validateEmail(value);
				return validation.isValid ? null : (validation.errors[0] ?? VALIDATION_MESSAGES.EMAIL_INVALID);
			}
			case 'password':
				if (!value.trim()) return VALIDATION_MESSAGES.PASSWORD_REQUIRED;
				break;
		}
		return null;
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		switch (name) {
			case 'email':
				setEmail(value);
				break;
			case 'password':
				setPassword(value);
				break;
		}
		setError(null);

		const fieldError = validateField(name, value);
		setFieldErrors(prev => ({
			...prev,
			[name]: fieldError ?? undefined,
		}));
	};

	const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);

		const emailError = validateField('email', email);
		const passwordError = validateField('password', password);

		const newFieldErrors: typeof fieldErrors = {};
		if (emailError) newFieldErrors.email = emailError;
		if (passwordError) newFieldErrors.password = passwordError;

		setFieldErrors(newFieldErrors);

		// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
		if (emailError || passwordError) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		if (!isFormValid()) {
			audioService.play(AudioKey.ERROR);
			return;
		}

		try {
			await loginMutation.mutateAsync({ email, password });
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

	const handleGoogleLogin = async () => {
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
				<CardTitle className='text-3xl font-bold'>Welcome Back</CardTitle>
				<CardDescription>Sign in to continue playing EveryTriv</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{error && (
					<Alert variant={VariantBase.DESTRUCTIVE}>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleLogin} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='email'>Email</Label>
						<Input
							id='email'
							name='email'
							type='email'
							placeholder='your@email.com'
							value={email}
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
						<div className='flex items-center justify-between'>
							<Label htmlFor='password'>Password</Label>
							<LinkButton
								to={ROUTES.FORGOT_PASSWORD}
								variant={ButtonVariant.GHOST}
								size={ButtonSize.SM}
								className='text-xs h-auto p-0 text-primary hover:underline'
							>
								Forgot password?
							</LinkButton>
						</div>
						<Input
							id='password'
							name='password'
							type='password'
							placeholder='Enter your password'
							value={password}
							onChange={handleChange}
							disabled={isLoading}
							autoComplete='current-password'
							className={cn(fieldErrors.password && 'border-destructive')}
						/>
						{fieldErrors.password && (
							<p className='text-sm text-destructive flex items-center gap-1'>
								<AlertCircle className='h-3 w-3' />
								{fieldErrors.password}
							</p>
						)}
					</div>

					<Button type='submit' className='w-full' size={ButtonSize.LG} disabled={isLoading || !isFormValid()}>
						{isLoading ? (
							<>
								<Spinner size={SpinnerSize.SM} variant='loader' className='mr-2' />
								Signing in...
							</>
						) : (
							'Sign In'
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

				<GoogleAuthButton onClick={handleGoogleLogin} disabled={isLoading} />

				<div className='text-center text-sm'>
					<span className='text-muted-foreground'>Don't have an account? </span>
					<Button
						type='button'
						variant={ButtonVariant.GHOST}
						size={ButtonSize.SM}
						onClick={() => navigate(ROUTES.REGISTER, { state: { modal: isModal } })}
						className='h-auto p-0 text-primary font-medium hover:underline'
					>
						Sign up
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
