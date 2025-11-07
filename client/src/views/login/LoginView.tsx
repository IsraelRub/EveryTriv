/**
 * Login View
 *
 * @module LoginView
 * @description User login page with Google OAuth integration
 */

import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { Button, Card, Container, fadeInUp, GridLayout, scaleIn } from '../../components';
import { AudioKey, ButtonVariant, CardVariant, CLIENT_STORAGE_KEYS, ContainerSize, Spacing } from '../../constants';
import { useGoogleOAuth, useLogin } from '../../hooks';
import { audioService, storageService } from '../../services';

export default function LoginView() {
	const navigate = useNavigate();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const googleOAuth = useGoogleOAuth();
	const { mutate: login, isPending: isLoading } = useLogin();

	// Authentication redirect is now handled by PublicRoute HOC
	// No need for local authentication check

	const handleEmailLogin = async (e: FormEvent) => {
		e.preventDefault();

		audioService.play(AudioKey.BUTTON_CLICK);

		login(
			{ email, password },
			{
				onSuccess: async data => {
					logger.authInfo('Login successful', { email });
					if (data.accessToken) {
						await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, data.accessToken);
					}
					navigate('/');
				},
				onError: error => {
					logger.authError('Login failed', { error: getErrorMessage(error) });
					audioService.play(AudioKey.ERROR);
				},
			}
		);
	};

	const handleGoogleLogin = () => {
		audioService.play(AudioKey.BUTTON_CLICK);
		googleOAuth.mutate();
	};

	return (
		<main role='main' aria-label='Login'>
			<Container size={ContainerSize.XL} className='min-h-screen flex flex-col items-center justify-center p-4'>
				<Card variant={CardVariant.TRANSPARENT} padding={Spacing.XL} className='w-full max-w-md'>
					{/* Header */}
					<motion.header
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.2 }}
						className='text-center mb-8'
					>
						<h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>Welcome Back</h1>
						<p className='text-xl text-slate-300'>Sign in to continue your trivia journey</p>
					</motion.header>

					{/* Login Form */}
					<motion.section
						variants={scaleIn}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.4 }}
						whileHover={{ scale: 1.02 }}
						aria-label='Login Form'
					>
						<Card variant={CardVariant.GLASS} padding={Spacing.LG} className='rounded-lg'>
							{/* Google OAuth Button */}
							<Button
								variant={ButtonVariant.SECONDARY}
								onClick={handleGoogleLogin}
								disabled={googleOAuth.isPending}
								className='w-full mb-6 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
							>
								<svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
									<path
										fill='#4285F4'
										d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
									/>
									<path
										fill='#34A853'
										d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
									/>
									<path
										fill='#FBBC05'
										d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
									/>
									<path
										fill='#EA4335'
										d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
									/>
								</svg>
								{googleOAuth.isPending ? 'Signing in...' : 'Continue with Google'}
							</Button>

							{/* Divider */}
							<div className='relative mb-6'>
								<div className='absolute inset-0 flex items-center'>
									<div className='w-full border-t border-white/20'></div>
								</div>
								<div className='relative flex justify-center text-sm'>
									<span className='px-2 bg-slate-900 text-slate-400'>Or continue with email</span>
								</div>
							</div>

							{/* Email Login Form */}
							<form onSubmit={handleEmailLogin} className='space-y-4'>
								<div>
									<label className='block text-white font-medium mb-2'>Email</label>
									<input
										type='email'
										value={email}
										onChange={e => setEmail(e.target.value)}
										className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Enter your email'
										required
									/>
								</div>
								<div>
									<label className='block text-white font-medium mb-2'>Password</label>
									<input
										type='password'
										value={password}
										onChange={e => setPassword(e.target.value)}
										className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
										placeholder='Enter your password'
										required
									/>
								</div>
								<Button
									type='submit'
									variant={ButtonVariant.PRIMARY}
									disabled={isLoading}
									className='w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
								>
									{isLoading ? 'Signing in...' : 'Sign In'}
								</Button>
							</form>

							{/* Links */}
							<div className='mt-6 text-center space-y-2'>
								<Link to='/forgot-password' className='text-blue-400 hover:text-blue-300 text-sm'>
									Forgot your password?
								</Link>
								<div className='text-slate-400 text-sm'>
									Don&apos;t have an account?{' '}
									<Link to='/register' className='text-blue-400 hover:text-blue-300 font-medium'>
										Sign up
									</Link>
								</div>
							</div>
						</Card>
					</motion.section>

					{/* Features */}
					<motion.aside
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.6 }}
						aria-label='Login Features'
						className='mt-8 text-center'
					>
						<GridLayout variant='balanced' gap={Spacing.MD} className='text-slate-300'>
							<div className='flex items-center justify-center space-x-2'>
								<svg className='w-5 h-5 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fillRule='evenodd'
										d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
										clipRule='evenodd'
									/>
								</svg>
								<span className='text-sm'>Secure Login</span>
							</div>
							<div className='flex items-center justify-center space-x-2'>
								<svg className='w-5 h-5 text-blue-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fillRule='evenodd'
										d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
										clipRule='evenodd'
									/>
								</svg>
								<span className='text-sm'>Track Progress</span>
							</div>
							<div className='flex items-center justify-center space-x-2'>
								<svg className='w-5 h-5 text-purple-400' fill='currentColor' viewBox='0 0 20 20'>
									<path
										fillRule='evenodd'
										d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z'
										clipRule='evenodd'
									/>
								</svg>
								<span className='text-sm'>Sync Data</span>
							</div>
						</GridLayout>
					</motion.aside>
				</Card>
			</Container>
		</main>
	);
}
