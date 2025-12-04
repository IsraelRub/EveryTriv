import { ChangeEvent, FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { VALIDATION_LIMITS } from '@shared/constants';
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
	Checkbox,
	Input,
	Label,
	Separator,
} from '@/components';
import { AudioKey, ButtonSize } from '@/constants';
import { useAudio, useModalRoute, useRegister } from '@/hooks';
import { authService } from '@/services';

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
		agreeToTerms: false,
	});
	const [error, setError] = useState<string | null>(null);

	const isLoading = registerMutation.isPending;

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
		setError(null);
	};

	const validateForm = (): string | null => {
		if (!formData.email.trim()) {
			return 'Email is required';
		}
		if (!formData.email.includes('@')) {
			return 'Please enter a valid email address';
		}
		if (!formData.password) {
			return 'Password is required';
		}
		if (formData.password.length < VALIDATION_LIMITS.PASSWORD.MIN_LENGTH) {
			return `Password must be at least ${VALIDATION_LIMITS.PASSWORD.MIN_LENGTH} characters`;
		}
		if (formData.password !== formData.confirmPassword) {
			return 'Passwords do not match';
		}
		if (!formData.agreeToTerms) {
			return 'You must agree to the Terms of Service';
		}
		return null;
	};

	const getPasswordStrength = (): { strength: number; label: string; color: string } => {
		const password = formData.password;
		let strength = 0;

		if (password.length >= VALIDATION_LIMITS.PASSWORD.MIN_LENGTH) strength++;
		if (password.length >= 12) strength++;
		if (/[A-Z]/.test(password)) strength++;
		if (/[0-9]/.test(password)) strength++;
		if (/[^A-Za-z0-9]/.test(password)) strength++;

		if (strength <= 1) return { strength, label: 'Weak', color: 'bg-red-500' };
		if (strength <= 2) return { strength, label: 'Fair', color: 'bg-yellow-500' };
		if (strength <= 3) return { strength, label: 'Good', color: 'bg-blue-500' };
		return { strength, label: 'Strong', color: 'bg-green-500' };
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

		const validationError = validateForm();
		if (validationError) {
			setError(validationError);
			audioService.play(AudioKey.ERROR);
			return;
		}

		try {
			await registerMutation.mutateAsync({
				email: formData.email,
				password: formData.password,
				confirmPassword: formData.confirmPassword,
				firstName: formData.firstName || undefined,
				lastName: formData.lastName || undefined,
				agreeToTerms: formData.agreeToTerms,
			});
			audioService.play(AudioKey.SUCCESS);
			if (isModal) {
				closeModal();
			} else {
				navigate(returnUrl || '/');
			}
		} catch (err) {
			const errorMessage = getErrorMessage(err);
			setError(errorMessage || 'Registration failed. Please try again.');
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleGoogleSignup = async () => {
		setError(null);
		try {
			await authService.initiateGoogleLogin();
		} catch (err) {
			const errorMessage = getErrorMessage(err);
			setError(errorMessage || 'Failed to initiate Google signup');
		}
	};

	const passwordStrength = getPasswordStrength();

	return (
		<Card className='w-full max-w-md'>
			<CardHeader className='text-center space-y-2'>
				<CardTitle className='text-3xl font-bold'>Create Account</CardTitle>
				<CardDescription>Join EveryTriv and start playing trivia</CardDescription>
			</CardHeader>

			<CardContent className='space-y-6'>
				{error && (
					<Alert variant='destructive'>
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
							required
							autoComplete='email'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='password'>
							Password <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='password'
							name='password'
							type='password'
							placeholder='Create a strong password'
							value={formData.password}
							onChange={handleChange}
							disabled={isLoading}
							required
							autoComplete='new-password'
						/>
						{formData.password && (
							<div className='space-y-1'>
								<div className='flex gap-1'>
									{[1, 2, 3, 4, 5].map(level => (
										<div
											key={level}
											className={`h-1 flex-1 rounded ${
												level <= passwordStrength.strength ? passwordStrength.color : 'bg-muted'
											}`}
										/>
									))}
								</div>
								<p className='text-xs text-muted-foreground'>Password strength: {passwordStrength.label}</p>
							</div>
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
								required
								autoComplete='new-password'
							/>
							{formData.confirmPassword && formData.password === formData.confirmPassword && (
								<CheckCircle2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500' />
							)}
						</div>
					</div>

					<div className='flex items-start space-x-2'>
						<Checkbox
							id='agreeToTerms'
							checked={formData.agreeToTerms}
							onCheckedChange={checked => setFormData(prev => ({ ...prev, agreeToTerms: checked === true }))}
							disabled={isLoading}
						/>
						<Label htmlFor='agreeToTerms' className='text-sm leading-tight cursor-pointer'>
							I agree to the{' '}
							<a href='/terms' className='text-primary hover:underline'>
								Terms of Service
							</a>{' '}
							and{' '}
							<a href='/privacy' className='text-primary hover:underline'>
								Privacy Policy
							</a>
						</Label>
					</div>

					<Button type='submit' className='w-full' size={ButtonSize.LG} disabled={isLoading}>
						{isLoading ? (
							<>
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
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
					variant='outline'
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
						onClick={() => navigate('/login', { state: { modal: isModal } })}
						className='text-primary font-medium hover:underline'
					>
						Sign in
					</button>
				</div>
			</CardContent>
		</Card>
	);
}
