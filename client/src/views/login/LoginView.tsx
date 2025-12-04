import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AlertCircle, Loader2 } from 'lucide-react';

import { getErrorMessage } from '@shared/utils';

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
import { AudioKey, ButtonSize } from '@/constants';
import { useAudio, useLogin, useModalRoute } from '@/hooks';
import { authService } from '@/services';

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

	const isLoading = loginMutation.isPending;

	const handleLogin = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!email.trim() || !password.trim()) {
			setError('Please fill in all fields');
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
			setError(errorMessage || 'Login failed. Please check your credentials.');
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleGoogleLogin = async () => {
		setError(null);
		try {
			await authService.initiateGoogleLogin();
		} catch (err) {
			const errorMessage = getErrorMessage(err);
			setError(errorMessage || 'Failed to initiate Google login');
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
					<Alert variant='destructive'>
						<AlertCircle className='h-4 w-4' />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleLogin} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='email'>Email</Label>
						<Input
							id='email'
							type='email'
							placeholder='your@email.com'
							value={email}
							onChange={e => setEmail(e.target.value)}
							disabled={isLoading}
							required
							autoComplete='email'
						/>
					</div>

					<div className='space-y-2'>
						<div className='flex items-center justify-between'>
							<Label htmlFor='password'>Password</Label>
							<button
								type='button'
								onClick={() => navigate('/forgot-password')}
								className='text-xs text-primary hover:underline'
							>
								Forgot password?
							</button>
						</div>
						<Input
							id='password'
							type='password'
							placeholder='Enter your password'
							value={password}
							onChange={e => setPassword(e.target.value)}
							disabled={isLoading}
							required
							autoComplete='current-password'
						/>
					</div>

					<Button type='submit' className='w-full' size={ButtonSize.LG} disabled={isLoading}>
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
					variant='outline'
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
						onClick={() => navigate('/register', { state: { modal: isModal } })}
						className='text-primary font-medium hover:underline'
					>
						Sign up
					</button>
				</div>
			</CardContent>
		</Card>
	);
}
