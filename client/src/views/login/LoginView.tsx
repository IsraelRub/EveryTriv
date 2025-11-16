/**
 * Login View
 *
 * @module LoginView
 * @description User login page with Google OAuth integration
 */

import { FormEvent, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { Button, fadeInUp, FeatureHighlightList, GoogleIcon, scaleIn, ValidatedInput } from '../../components';
import { Icon } from '../../components/IconLibrary';
import {
	AudioKey,
	AUTH_VIEW_CLASSNAMES,
	ButtonVariant,
	CLIENT_STORAGE_KEYS,
	ComponentSize,
	LOGIN_FEATURE_HIGHLIGHTS,
} from '../../constants';
import { useGoogleOAuth, useLogin } from '../../hooks';
import { audioService, storageService } from '../../services';

export default function LoginView() {
	const navigate = useNavigate();

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [emailValid, setEmailValid] = useState(true);
	const [passwordValid, setPasswordValid] = useState(true);
	const emailErrorId = useId();
	const passwordErrorId = useId();

	const googleOAuth = useGoogleOAuth();
	const { mutate: login, isPending: isLoading } = useLogin();

	// Authentication redirect is now handled by PublicRoute HOC
	// No need for local authentication check

	const handleEmailLogin = async (e: FormEvent) => {
		e.preventDefault();
		setError(null);

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
					const errorMessage = getErrorMessage(error);
					setError(errorMessage);
					logger.authError('Login failed', { error: errorMessage });
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
		<section aria-label='Login' className={AUTH_VIEW_CLASSNAMES.container}>
			<div className={AUTH_VIEW_CLASSNAMES.card}>
				<div className={AUTH_VIEW_CLASSNAMES.formColumn}>
					<motion.header
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.2 }}
						className={AUTH_VIEW_CLASSNAMES.header}
					>
						<h1 className={AUTH_VIEW_CLASSNAMES.title}>Welcome Back</h1>
						<p className={AUTH_VIEW_CLASSNAMES.subtitle}>Sign in to continue your trivia journey</p>
					</motion.header>

					<motion.div
						variants={scaleIn}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.4 }}
						aria-label='Login Form'
						className={AUTH_VIEW_CLASSNAMES.formSection}
					>
						<div className={AUTH_VIEW_CLASSNAMES.formWrapper}>
							<Button
								variant={ButtonVariant.SECONDARY}
								onClick={handleGoogleLogin}
								disabled={googleOAuth.isPending}
								className={AUTH_VIEW_CLASSNAMES.socialButton}
								aria-label='Continue with Google'
							>
								<GoogleIcon size={ComponentSize.MD} className='mr-2' />
								{googleOAuth.isPending ? 'Signing in...' : 'Continue with Google'}
							</Button>

							<div className={AUTH_VIEW_CLASSNAMES.dividerWrapper}>
								<div className={AUTH_VIEW_CLASSNAMES.dividerLine} />
								<div className={AUTH_VIEW_CLASSNAMES.dividerLabel}>Or continue with email</div>
							</div>

							<form onSubmit={handleEmailLogin} className='space-y-4' noValidate>
								{error && (
									<div
										role='alert'
										aria-live='assertive'
										className='rounded-md bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-400'
									>
										<div className='flex items-center gap-2'>
											<Icon name='alerttriangle' size={ComponentSize.SM} />
											<span>{error}</span>
										</div>
									</div>
								)}
								<div>
									<label htmlFor='login-email' className={AUTH_VIEW_CLASSNAMES.inputLabel}>
										Email
									</label>
									<ValidatedInput
										id='login-email'
										type='email'
										validationType='email'
										initialValue={email}
										onChange={(value, isValid) => {
											setEmail(value);
											setEmailValid(isValid);
											if (error && isValid) {
												setError(null);
											}
										}}
										className={AUTH_VIEW_CLASSNAMES.inputField}
										placeholder='Enter your email'
										required
										aria-describedby={emailErrorId}
										aria-invalid={email && !emailValid ? 'true' : 'false'}
										aria-required='true'
									/>
									<div id={emailErrorId} className='sr-only' aria-live='polite' />
								</div>
								<div>
									<label htmlFor='login-password' className={AUTH_VIEW_CLASSNAMES.inputLabel}>
										Password
									</label>
									<div className='relative'>
										<ValidatedInput
											id='login-password'
											type={showPassword ? 'text' : 'password'}
											validationType='password'
											initialValue={password}
											onChange={(value, isValid) => {
												setPassword(value);
												setPasswordValid(isValid);
												if (error && isValid) {
													setError(null);
												}
											}}
											className={AUTH_VIEW_CLASSNAMES.inputField}
											placeholder='Enter your password'
											required
											aria-describedby={passwordErrorId}
											aria-invalid={password && !passwordValid ? 'true' : 'false'}
											aria-required='true'
										/>
										<button
											type='button'
											onClick={() => setShowPassword(!showPassword)}
											className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors'
											aria-label={showPassword ? 'Hide password' : 'Show password'}
											tabIndex={0}
										>
											{showPassword ? (
												<Icon name='eyeoff' size={ComponentSize.SM} />
											) : (
												<Icon name='eye' size={ComponentSize.SM} />
											)}
										</button>
									</div>
									<div id={passwordErrorId} className='sr-only' aria-live='polite' />
								</div>
								<div className='flex items-center justify-between'>
									<Link
										to='/forgot-password'
										className='text-sm text-slate-400 hover:text-slate-200 underline transition-colors'
									>
										Forgot password?
									</Link>
								</div>
								<Button
									type='submit'
									variant={ButtonVariant.PRIMARY}
									disabled={isLoading}
									className={AUTH_VIEW_CLASSNAMES.primaryButton}
									aria-label={isLoading ? 'Signing in...' : 'Sign in'}
								>
									{isLoading ? 'Signing in...' : 'Sign In'}
								</Button>
							</form>

							<div className={AUTH_VIEW_CLASSNAMES.linkContainer}>
								<div className={AUTH_VIEW_CLASSNAMES.linkSecondary}>
									Don&apos;t have an account?{' '}
									<Link to='/register' className={AUTH_VIEW_CLASSNAMES.linkSecondaryHighlight}>
										Sign up
									</Link>
								</div>
							</div>
						</div>
					</motion.div>
				</div>

				<motion.aside
					variants={fadeInUp}
					initial='hidden'
					animate='visible'
					transition={{ delay: 0.6 }}
					className={AUTH_VIEW_CLASSNAMES.featuresColumn}
					aria-label='Login Features'
				>
					<header className={AUTH_VIEW_CLASSNAMES.featuresHeader}>
						<h2 className='text-2xl font-semibold text-white'>Stay ahead with EveryTriv</h2>
						<p className='text-sm text-slate-400'>
							Practice with adaptive trivia sets, monitor your momentum, and keep progress synced across devices.
						</p>
					</header>
					<FeatureHighlightList items={LOGIN_FEATURE_HIGHLIGHTS} />
					<p className='text-sm text-slate-400'>
						Daily challenges, personalised stats, and premium question packs keep desktop players engaged for hours.
					</p>
				</motion.aside>
			</div>
		</section>
	);
}
