/**
 * Registration View
 *
 * @module RegistrationView
 * @description User registration page with validation using ValidatedForm
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { motion } from 'framer-motion';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { Button, CardGrid, FeatureHighlightList, fadeInUp, hoverScale, Icon, scaleIn, ValidatedForm } from '../../components';
import {
	AUTH_VIEW_CLASSNAMES,
	AudioKey,
	ButtonVariant,
	CLIENT_STORAGE_KEYS,
	LOGIN_FEATURE_HIGHLIGHTS,
	REGISTRATION_DEFAULT_VALUES,
	REGISTRATION_FIELDS,
	Spacing,
} from '../../constants';
import { useRegister } from '../../hooks';
import { audioService, authService, storageService } from '../../services';

export default function RegistrationView() {
	const navigate = useNavigate();

	const [step, setStep] = useState<'method' | 'manual' | 'confirmation'>('method');

	const { mutate: register, isPending: isSubmitting } = useRegister();

	const [, setRegistrationSuccess] = useState(false);

	useEffect(() => {
		logger.gameInfo('Registration page viewed', {
			page: 'registration',
		});
	}, []);

	const handleGoogleSignUp = () => {
		logger.gameInfo('Google sign-up initiated', {
			provider: 'google',
		});

		// Play button click sound
		audioService.play(AudioKey.BUTTON_CLICK);

		try {
			authService.initiateGoogleLogin();
		} catch (error) {
			logger.gameError('Google signup failed', {
				error: getErrorMessage(error),
			});
			audioService.play(AudioKey.ERROR);
		}
	};

	const handleFormSubmit = async (values: Record<string, string>, isValid: boolean) => {
		if (!isValid) {
			logger.gameError('Registration form validation failed');
			audioService.play(AudioKey.ERROR);
			return;
		}

		// Additional password confirmation validation
		if (values.password !== values.confirmPassword) {
			logger.gameError('Password confirmation mismatch');
			audioService.play(AudioKey.ERROR);
			return;
		}

		logger.gameInfo('Manual registration form submitted', {
			username: values.username,
			email: values.email,
		});

		register(
			{
				username: values.username,
				email: values.email,
				password: values.password,
				confirmPassword: values.password,
				agreeToTerms: true,
			},
			{
				onSuccess: async data => {
					setRegistrationSuccess(true);
					audioService.play(AudioKey.SUCCESS);
					logger.gameInfo('Registration successful', { username: values.username });

					if (data.accessToken) {
						await storageService.set(CLIENT_STORAGE_KEYS.AUTH_TOKEN, data.accessToken);
					}

					setStep('confirmation');
				},
				onError: error => {
					logger.gameError('Registration failed', {
						error: getErrorMessage(error),
					});
					audioService.play(AudioKey.ERROR);
				},
			}
		);
	};

	const renderMethodSelection = () => (
		<motion.section
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
			className='space-y-8'
			whileHover={{ scale: 1.01 }}
			aria-label='Registration Method Selection'
		>
			<header className='text-center'>
				<h1 className='text-4xl font-bold gradient-text mb-4'>Join EveryTriv</h1>
				<p className='text-slate-300 text-lg'>Choose how you'd like to create your account</p>
			</header>

			<CardGrid columns={2} gap={Spacing.LG} className='w-full'>
				<motion.article
					variants={hoverScale}
					initial='initial'
					whileHover='hover'
					whileTap={{ scale: 0.95 }}
					aria-label='Google Sign Up Option'
				>
					<div className='glass rounded-xl p-8 text-center cursor-pointer' onClick={handleGoogleSignUp}>
						<Icon name='Google' className='w-12 h-12 mx-auto mb-4 text-blue-400' />
						<h3 className='text-xl font-semibold text-white mb-2'>Continue with Google</h3>
						<p className='text-slate-300'>Quick and secure sign-up with your Google account</p>
					</div>
				</motion.article>

				<motion.article
					variants={hoverScale}
					initial='initial'
					whileHover='hover'
					whileTap={{ scale: 0.95 }}
					aria-label='Email Sign Up Option'
				>
					<div
						className='glass rounded-xl p-8 text-center cursor-pointer'
						onClick={() => {
							audioService.play(AudioKey.BUTTON_CLICK);
							setStep('manual');
						}}
					>
						<Icon name='Mail' className='w-12 h-12 mx-auto mb-4 text-green-400' />
						<h3 className='text-xl font-semibold text-white mb-2'>Sign up with Email</h3>
						<p className='text-slate-300'>Create account with email and password</p>
					</div>
				</motion.article>
			</CardGrid>

			<div className='text-center'>
				<p className='text-slate-400'>
					Already have an account?{' '}
					<Link to='/login' className={`${AUTH_VIEW_CLASSNAMES.linkPrimary} text-base transition-colors`}>
						Sign in here
					</Link>
				</p>
			</div>
		</motion.section>
	);

	const renderManualForm = () => (
		<motion.section
			variants={fadeInUp}
			initial='hidden'
			animate='visible'
			className='space-y-6'
			whileHover={{ scale: 1.01 }}
			aria-label='Registration Form'
		>
			<header className='text-left mb-8'>
				<h2 className='text-3xl font-bold gradient-text mb-4'>Create Your Account</h2>
				<p className='text-slate-300'>Fill in your details to get started</p>
			</header>

			<div className='glass rounded-xl p-6'>
				<ValidatedForm
					fields={REGISTRATION_FIELDS}
					initialValues={{
						username: REGISTRATION_DEFAULT_VALUES.username,
						email: REGISTRATION_DEFAULT_VALUES.email,
						'address.country': REGISTRATION_DEFAULT_VALUES.address.country,
						password: REGISTRATION_DEFAULT_VALUES.password,
						confirmPassword: REGISTRATION_DEFAULT_VALUES.confirmPassword,
					}}
					title='Create Your Account'
					description='Fill in your details to get started'
					submitText='Create Account'
					loading={isSubmitting}
					onSubmit={handleFormSubmit}
					isGlassy={true}
					showValidationSummary={true}
				/>
			</div>

			<div className='flex flex-col gap-4 text-left'>
				<Button
					variant={ButtonVariant.SECONDARY}
					onClick={() => {
						audioService.play(AudioKey.BUTTON_CLICK);
						setStep('method');
					}}
					className='w-fit'
				>
					<Icon name='ArrowLeft' className='w-4 h-4 mr-2' />
					Back to Options
				</Button>
				<p className='text-slate-400'>
					Already have an account?{' '}
					<Link to='/login' className={`${AUTH_VIEW_CLASSNAMES.linkPrimary} text-base transition-colors`}>
						Sign in here
					</Link>
				</p>
			</div>
		</motion.section>
	);

	const renderConfirmation = () => (
		<motion.article
			variants={scaleIn}
			initial='hidden'
			animate='visible'
			className='text-center space-y-8'
			whileHover={{ scale: 1.02 }}
			aria-label='Registration Confirmation'
		>
			<div className='glass rounded-xl p-8 max-w-md mx-auto'>
				<Icon name='CheckCircle' className='w-16 h-16 mx-auto mb-4 text-green-400' />
				<header className='text-center'>
					<h2 className='text-2xl font-bold text-white mb-4'>Welcome to EveryTriv!</h2>
					<p className='text-slate-300 mb-6'>
						Your account has been created successfully. You can start playing and earning points!
					</p>
				</header>
				<Button
					onClick={() => {
						audioService.play(AudioKey.GAME_START);
						navigate('/profile');
					}}
					className='w-full'
				>
					Go to Profile
					<Icon name='ArrowRight' className='w-4 h-4 ml-2' />
				</Button>
			</div>
		</motion.article>
	);

	return (
		<main role='main' aria-label='Registration'>
			<section className={AUTH_VIEW_CLASSNAMES.container}>
				<div className={AUTH_VIEW_CLASSNAMES.card}>
					<div className={AUTH_VIEW_CLASSNAMES.formColumn}>
						{step === 'method' && renderMethodSelection()}
						{step === 'manual' && renderManualForm()}
						{step === 'confirmation' && renderConfirmation()}
					</div>

					<motion.aside
						variants={fadeInUp}
						initial='hidden'
						animate='visible'
						transition={{ delay: 0.5 }}
						className={AUTH_VIEW_CLASSNAMES.featuresColumn}
						aria-label='Registration Highlights'
					>
						<header className={AUTH_VIEW_CLASSNAMES.featuresHeader}>
							<h2 className='text-2xl font-semibold text-white'>Why create an account?</h2>
							<p className='text-sm text-slate-400'>
								Unlock personalised analytics, cross-platform sync, and team invitations directly from the desktop experience.
							</p>
						</header>
						<FeatureHighlightList items={LOGIN_FEATURE_HIGHLIGHTS} />
						<p className='text-sm text-slate-400'>
							Advanced leaderboards and premium tournaments are ready when you upgrade—no extra setup required.
						</p>
					</motion.aside>
				</div>
			</section>
		</main>
	);
}
