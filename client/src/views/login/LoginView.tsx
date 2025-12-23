import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AlertCircle, Loader2 } from 'lucide-react';

import { getErrorMessage } from '@shared/utils';

import { AudioKey, ButtonSize, ButtonVariant, ROUTES, VariantBase } from '@/constants';

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
} from '@/components';

import { useAudio, useLogin, useModalRoute } from '@/hooks';

import { authService } from '@/services';

import { validateEmailFormat } from '@/utils/validation';

/**
 * Login View
 * @description User authentication page with email/password and Google OAuth
 */
export function LoginView() {
	const navigate = useNavigate();
	const loginMutation = useLogin();
	const audioService = useAudio();
	const { isModal, closeModal, returnUrl } = useModalRoute();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<{
		email?: string;
		password?: string;
	}>({});

	const isLoading = loginMutation.isPending;

	const isFormValid = (): boolean => {
		const emailValidation = validateEmailFormat(email);
		return emailValidation.isValid && password.trim().length > 0;
	};

	const validateField = (name: string, value: string): string | null => {
		if (name === 'email') {
			if (!value.trim()) return 'Email is required';
			if (!value.includes('@')) return 'Please enter a valid email address';
		}
		if (name === 'password') {
			if (!value.trim()) return 'Password is required';
		}
		return null;
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (name === 'email') {
			setEmail(value);
		} else if (name === 'password') {
			setPassword(value);
		}
		setError(null);

		const fieldError = validateField(name, value);
		setFieldErrors(prev => ({
			...prev,
			[name]: fieldError || undefined,
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
				navigate(returnUrl || '/');
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
		<Card className='w-full max-w-md'>
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
							className={fieldErrors.email ? 'border-destructive' : ''}
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
							<button
								type='button'
								onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
								className='text-xs text-primary hover:underline'
							>
								Forgot password?
							</button>
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
							className={fieldErrors.password ? 'border-destructive' : ''}
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
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
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

				<Button
					type='button'
					variant={ButtonVariant.OUTLINE}
					className='w-full'
					size={ButtonSize.LG}
					onClick={handleGoogleLogin}
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
					<span className='text-muted-foreground'>Don't have an account? </span>
					<button
						type='button'
						onClick={() => navigate(ROUTES.REGISTER, { state: { modal: isModal } })}
						className='text-primary font-medium hover:underline'
					>
						Sign up
					</button>
				</div>
			</CardContent>
		</Card>
	);
}
