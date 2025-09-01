/**
 * Registration View
 *
 * @module RegistrationView
 * @description User registration page with validation using ValidatedForm
 */

import { CUSTOM_DIFFICULTY_MULTIPLIERS, DifficultyLevel, POPULAR_TOPICS } from 'everytriv-shared/constants';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import {
	CardGrid,
	FadeInLeft,
	FadeInUp,
	HoverScale,
	Icon,
	ResponsiveGrid,
	ScaleIn,
	StaggerContainer,
} from '@/components';
import { DIFFICULTY_LEVELS_UI, REGISTRATION_DEFAULT_VALUES, REGISTRATION_FIELDS } from '@/constants';
import { setAuthenticated, setUser } from '@/redux/features/userSlice';

import { ValidatedForm } from '../../components/forms';
import { Button, ValidationLoading, ValidationSuccess, ValidationWarning } from '../../components/ui';
import { AudioKey } from '../../constants';
import { useDebouncedCallback, usePerformance } from '../../hooks';
import { audioService, authService, logger, storageService } from '../../services';
import { RootState } from '../../types';

export default function RegistrationView() {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { isAuthenticated } = useSelector((state: RootState) => state.user);
	const [step, setStep] = useState<'method' | 'manual' | 'preferences' | 'confirmation'>('method');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid' | 'warning'>(
		'idle'
	);
	const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
	const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);

	const [, setRegistrationSuccess] = useState(false);

	// Performance tracking
	const { startOperation, completeOperation, errorOperation } = usePerformance();

	// Debounced topic selection
	const debouncedTopicToggle = useDebouncedCallback((topic: string) => {
		setSelectedTopics((prev) => (prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]));
	}, 300);

	useEffect(() => {
		// Redirect if already authenticated
		if (isAuthenticated) {
			navigate('/profile');
			return;
		}

		logger.game('Registration page viewed', {
			page: 'registration',
		});
	}, [isAuthenticated, navigate]);

	const handleGoogleSignUp = () => {
		const operationId = 'google-signup';
		startOperation(operationId);

		logger.game('Google sign-up initiated', {
			provider: 'google',
		});

		// Play button click sound
		audioService.play(AudioKey.BUTTON_CLICK);

		try {
			authService.initiateGoogleLogin();
			completeOperation(operationId);
		} catch (error) {
			errorOperation(operationId, error instanceof Error ? error.message : 'Google signup failed');
			audioService.play(AudioKey.ERROR);
		}
	};

	const toggleTopic = (topic: string) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		debouncedTopicToggle.debounced(topic);

		logger.game('Topic toggled', {
			topic: topic,
			previousTopic: selectedTopics.length,
		});
	};

	const handleDifficultySelect = (difficulty: DifficultyLevel) => {
		audioService.play(AudioKey.BUTTON_CLICK);
		setSelectedDifficulty(difficulty);

		// Save preference to storage
		storageService.setItem('user-preferences', {
			difficulty: difficulty,
			topics: selectedTopics,
			lastUpdated: new Date().toISOString(),
		});

		logger.game('Difficulty selected', {
			difficulty: difficulty,
			previousDifficulty: selectedDifficulty,
		});
	};

	const handleFormSubmit = async (values: Record<string, unknown>, isValid: boolean) => {
		const operationId = 'registration-submit';
		startOperation(operationId);

		setValidationStatus('validating');

		if (!isValid) {
			setValidationStatus('invalid');
			logger.gameError('Registration form validation failed');
			audioService.play(AudioKey.ERROR);
			errorOperation(operationId, 'Form validation failed');
			return;
		}

		// Additional password confirmation validation
		if (values.password !== values.confirmPassword) {
			setValidationStatus('invalid');
			logger.gameError('Password confirmation mismatch');
			audioService.play(AudioKey.ERROR);
			errorOperation(operationId, 'Password confirmation mismatch');
			return;
		}

		setIsSubmitting(true);

		try {
			logger.game('Manual registration form submitted', {
				username: values.username,
				email: values.email,
			});

			// Save registration data to storage
			storageService.setItem('registration-data', {
				username: values.username as string,
				email: values.email as string,
				topics: selectedTopics,
				difficulty: selectedDifficulty,
				submittedAt: new Date().toISOString(),
			});

			// Here you would call your registration API
			const response = await authService.register({
				username: values.username as string,
				email: values.email as string,
				password: values.password as string,
			});

			if (response.user) {
				setValidationStatus('valid');
				setRegistrationSuccess(true);
				audioService.play(AudioKey.GAME_START);

				dispatch(
					setUser({
						...response.user,
						created_at: new Date(),
						updated_at: new Date(),
					})
				);
				dispatch(setAuthenticated(true));
				setStep('confirmation');
				completeOperation(operationId);
			}
		} catch (error) {
			setValidationStatus('invalid');
			logger.gameError('Registration failed', { error: error instanceof Error ? error.message : 'Registration failed' });
			audioService.play(AudioKey.ERROR);
			errorOperation(operationId, error instanceof Error ? error.message : 'Registration failed');
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderMethodSelection = () => (
		<FadeInUp className='space-y-8'>
			<div className='text-center'>
				<h1 className='text-4xl font-bold gradient-text mb-4'>Join EveryTriv</h1>
				<p className='text-slate-300 text-lg'>Choose how you'd like to create your account</p>
			</div>

			<CardGrid columns={2} gap='lg' className='max-w-4xl mx-auto'>
				<HoverScale>
					<div className='glass rounded-xl p-8 text-center cursor-pointer' onClick={handleGoogleSignUp}>
						<Icon name='Google' className='w-12 h-12 mx-auto mb-4 text-blue-400' />
						<h3 className='text-xl font-semibold text-white mb-2'>Continue with Google</h3>
						<p className='text-slate-300'>Quick and secure sign-up with your Google account</p>
					</div>
				</HoverScale>

				<HoverScale>
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
				</HoverScale>
			</CardGrid>

			<div className='text-center'>
				<p className='text-slate-400'>
					Already have an account?{' '}
					<Link to='/login' className='text-blue-400 hover:text-blue-300 transition-colors'>
						Sign in here
					</Link>
				</p>
			</div>
		</FadeInUp>
	);

	const renderManualForm = () => (
		<FadeInUp className='space-y-6'>
			<div className='text-center mb-8'>
				<h2 className='text-3xl font-bold gradient-text mb-4'>Create Your Account</h2>
				<p className='text-slate-300'>Fill in your details to get started</p>
			</div>

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

			<div className='text-center'>
				<Button
					variant='secondary'
					onClick={() => {
						audioService.play(AudioKey.BUTTON_CLICK);
						setStep('method');
					}}
					className='mr-4'
				>
					<Icon name='ArrowLeft' className='w-4 h-4 mr-2' />
					Back to Options
				</Button>
				<p className='text-slate-400 mt-4'>
					Already have an account?{' '}
					<Link to='/login' className='text-blue-400 hover:text-blue-300 transition-colors'>
						Sign in here
					</Link>
				</p>
			</div>
		</FadeInUp>
	);

	const renderPreferences = () => (
		<FadeInUp className='space-y-6'>
			<div className='text-center mb-8'>
				<h2 className='text-3xl font-bold gradient-text mb-4'>Customize Your Experience</h2>
				<p className='text-slate-300'>Choose your preferences to get personalized content</p>
			</div>

			<div className='glass rounded-xl p-6'>
				<div className='space-y-6'>
					{/* Difficulty Level */}
					<div>
						<h3 className='text-lg font-semibold text-white mb-4 flex items-center'>
							<Icon name='Target' className='w-5 h-5 mr-2' />
							Preferred Difficulty Level
						</h3>

						{/* Difficulty Info */}
						<div className='mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
							<p className='text-sm text-blue-300'>
								<strong>Multiplier:</strong> {CUSTOM_DIFFICULTY_MULTIPLIERS[selectedDifficulty] || 1.0}x points
							</p>
						</div>

						<CardGrid columns={3} gap='md'>
							{Object.entries(DIFFICULTY_LEVELS_UI).map(([key, level]) => (
								<HoverScale key={key}>
									<div
										className={`glass rounded-lg p-4 text-center cursor-pointer border-2 transition-colors ${
											selectedDifficulty === key
												? 'border-blue-400 bg-blue-500/20'
												: 'border-transparent hover:border-blue-400'
										}`}
										onClick={() => handleDifficultySelect(key as DifficultyLevel)}
									>
										<Icon name='Target' className='w-8 h-8 mx-auto mb-2 text-blue-400' />
										<h4 className='font-semibold text-white mb-1'>{level.label}</h4>
										<p className='text-sm text-slate-300'>{level.description}</p>
										<div className='text-xs text-blue-300 mt-2'>
											{CUSTOM_DIFFICULTY_MULTIPLIERS[key as DifficultyLevel] || 1.0}x points
										</div>
									</div>
								</HoverScale>
							))}
						</CardGrid>
					</div>

					{/* Favorite Topics */}
					<div>
						<h3 className='text-lg font-semibold text-white mb-4 flex items-center'>
							<Icon name='Star' className='w-5 h-5 mr-2' />
							Favorite Topics
						</h3>
						<p className='text-slate-300 mb-4'>Select topics you're interested in (optional)</p>

						{/* Validation Status */}
						{validationStatus === 'validating' && <ValidationLoading className='mb-4' showMessages={true} />}

						{selectedTopics.length > 0 && (
							<ValidationSuccess
								message={`${selectedTopics.length} topics selected`}
								className='mb-4'
								showMessages={true}
							/>
						)}

						{selectedTopics.length === 0 && (
							<ValidationWarning
								warnings={['No topics selected - you can always add them later']}
								className='mb-4'
								showMessages={true}
							/>
						)}

						<StaggerContainer>
							<ResponsiveGrid minWidth='200px' gap='sm'>
								{POPULAR_TOPICS.map((topic: string, index: number) => (
									<FadeInLeft key={topic} delay={index * 0.05}>
										<HoverScale>
											<div
												className={`glass rounded-lg p-3 text-center cursor-pointer border-2 transition-colors ${
													selectedTopics.includes(topic)
														? 'border-green-400 bg-green-400/20'
														: 'border-transparent hover:border-green-400'
												}`}
												onClick={() => toggleTopic(topic)}
											>
												<span className='text-sm text-white'>{topic}</span>
											</div>
										</HoverScale>
									</FadeInLeft>
								))}
							</ResponsiveGrid>
						</StaggerContainer>
					</div>
				</div>
			</div>

			<div className='text-center'>
				<Button
					onClick={() => {
						audioService.play(AudioKey.BUTTON_CLICK);
						setStep('confirmation');
					}}
					className='mr-4'
				>
					Continue
					<Icon name='ArrowRight' className='w-4 h-4 ml-2' />
				</Button>
				<Button
					variant='secondary'
					onClick={() => {
						audioService.play(AudioKey.BUTTON_CLICK);
						setStep('manual');
					}}
				>
					<Icon name='ArrowLeft' className='w-4 h-4 mr-2' />
					Back
				</Button>
			</div>
		</FadeInUp>
	);

	const renderConfirmation = () => (
		<ScaleIn className='text-center space-y-8'>
			<div className='glass rounded-xl p-8 max-w-md mx-auto'>
				<Icon name='CheckCircle' className='w-16 h-16 mx-auto mb-4 text-green-400' />
				<h2 className='text-2xl font-bold text-white mb-4'>Welcome to EveryTriv!</h2>
				<p className='text-slate-300 mb-6'>
					Your account has been created successfully. You can now start playing and earning points!
				</p>
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
		</ScaleIn>
	);

	return (
		<div className='min-h-screen flex items-center justify-center p-4'>
			<div className='w-full max-w-4xl'>
				{step === 'method' && renderMethodSelection()}
				{step === 'manual' && renderManualForm()}
				{step === 'preferences' && renderPreferences()}
				{step === 'confirmation' && renderConfirmation()}
			</div>
		</div>
	);
}
