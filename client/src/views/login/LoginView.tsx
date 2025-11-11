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

import { Button, FeatureHighlightList, fadeInUp, scaleIn } from '../../components';
import {
	AUTH_VIEW_CLASSNAMES,
	AudioKey,
	ButtonVariant,
	CLIENT_STORAGE_KEYS,
	LOGIN_FEATURE_HIGHLIGHTS,
} from '../../constants';
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
			<section className={AUTH_VIEW_CLASSNAMES.container}>
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

						<motion.section
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
								>
									<svg className='mr-2 h-5 w-5' viewBox='0 0 24 24'>
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

								<div className={AUTH_VIEW_CLASSNAMES.dividerWrapper}>
									<div className={AUTH_VIEW_CLASSNAMES.dividerLine} />
									<div className={AUTH_VIEW_CLASSNAMES.dividerLabel}>Or continue with email</div>
								</div>

								<form onSubmit={handleEmailLogin} className='space-y-4'>
									<div>
										<label className={AUTH_VIEW_CLASSNAMES.inputLabel}>Email</label>
										<input
											type='email'
											value={email}
											onChange={e => setEmail(e.target.value)}
											className={AUTH_VIEW_CLASSNAMES.inputField}
											placeholder='Enter your email'
											required
										/>
									</div>
									<div>
										<label className={AUTH_VIEW_CLASSNAMES.inputLabel}>Password</label>
										<input
											type='password'
											value={password}
											onChange={e => setPassword(e.target.value)}
											className={AUTH_VIEW_CLASSNAMES.inputField}
											placeholder='Enter your password'
											required
										/>
									</div>
									<Button
										type='submit'
										variant={ButtonVariant.PRIMARY}
										disabled={isLoading}
										className={AUTH_VIEW_CLASSNAMES.primaryButton}
									>
										{isLoading ? 'Signing in...' : 'Sign In'}
									</Button>
								</form>

								<div className={AUTH_VIEW_CLASSNAMES.linkContainer}>
									<Link to='/forgot-password' className={AUTH_VIEW_CLASSNAMES.linkPrimary}>
										Forgot your password?
									</Link>
									<div className={AUTH_VIEW_CLASSNAMES.linkSecondary}>
										Don&apos;t have an account?{' '}
										<Link to='/register' className={AUTH_VIEW_CLASSNAMES.linkSecondaryHighlight}>
											Sign up
										</Link>
									</div>
								</div>
							</div>
						</motion.section>
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
		</main>
	);
}
