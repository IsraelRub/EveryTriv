/**
 * Registration View
 *
 * @module RegistrationView
 * @description User registration page with validation using ValidatedForm
 */

import { clientLogger } from '@shared';
import type { UserRole } from '@shared/types/domain/user/user.types';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { CardGrid, Icon } from '@/components';
import { REGISTRATION_DEFAULT_VALUES, REGISTRATION_FIELDS, USER_DEFAULT_VALUES } from '@/constants';
import { setAuthenticated, setUser } from '@/redux/slices/userSlice';

import { fadeInUp, hoverScale, scaleIn } from '../../components/animations';
import { ValidatedForm } from '../../components/forms';
import { Button } from '../../components/ui';
import { AudioKey } from '../../constants';
import { audioService, authService } from '../../services';
// import { RootState } from '../../redux/store';

export default function RegistrationView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  // const { isAuthenticated } = useSelector((state: RootState) => state.user);

  const [step, setStep] = useState<'method' | 'manual' | 'confirmation'>('method');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Removed localStorage registration data - not needed

  const [, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    // Authentication redirect is handled by PublicRoute HOC
    // No need for local authentication check

    clientLogger.game('Registration page viewed', {
      page: 'registration',
    });
  }, []);

  const handleGoogleSignUp = () => {
    clientLogger.game('Google sign-up initiated', {
      provider: 'google',
    });

    // Play button click sound
    audioService.play(AudioKey.BUTTON_CLICK);

    try {
      authService.initiateGoogleLogin();
    } catch (error) {
      clientLogger.gameError('Google signup failed', {
        error: error instanceof Error ? error.message : 'Google signup failed',
      });
      audioService.play(AudioKey.ERROR);
    }
  };

  // Removed topic toggle logic

  const handleFormSubmit = async (values: Record<string, any>, isValid: boolean) => {
    if (!isValid) {
      clientLogger.gameError('Registration form validation failed');
      audioService.play(AudioKey.ERROR);
      return;
    }

    // Additional password confirmation validation
    if (values.password !== values.confirmPassword) {
      clientLogger.gameError('Password confirmation mismatch');
      audioService.play(AudioKey.ERROR);
      return;
    }

    setIsSubmitting(true);

    try {
      clientLogger.game('Manual registration form submitted', {
        username: values.username,
        email: values.email,
      });

      // Registration data is handled by the server

      // Here you would call your registration API
      const response = await authService.register({
        username: values.username as string,
        email: values.email as string,
        password: values.password as string,
      });

      if (response.user) {
        setRegistrationSuccess(true);
        audioService.play(AudioKey.SUCCESS);

        dispatch(
          setUser({
            ...response.user,
            ...USER_DEFAULT_VALUES,
            role: response.user.role as UserRole,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );
        dispatch(setAuthenticated(true));
        setStep('confirmation');
      }
    } catch (error) {
      clientLogger.gameError('Registration failed', {
        error: error instanceof Error ? error.message : 'Registration failed',
      });
      audioService.play(AudioKey.ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMethodSelection = () => (
    <motion.div
      variants={fadeInUp}
      initial='hidden'
      animate='visible'
      className='space-y-8'
      whileHover={{ scale: 1.01 }}
    >
      <div className='text-center'>
        <h1 className='text-4xl font-bold gradient-text mb-4'>Join EveryTriv</h1>
        <p className='text-slate-300 text-lg'>Choose how you'd like to create your account</p>
      </div>

      <CardGrid columns={2} gap='lg' className='max-w-4xl mx-auto'>
        <motion.div
          variants={hoverScale}
          initial='initial'
          whileHover='hover'
          whileTap={{ scale: 0.95 }}
        >
          <div
            className='glass rounded-xl p-8 text-center cursor-pointer'
            onClick={handleGoogleSignUp}
          >
            <Icon name='Google' className='w-12 h-12 mx-auto mb-4 text-blue-400' />
            <h3 className='text-xl font-semibold text-white mb-2'>Continue with Google</h3>
            <p className='text-slate-300'>Quick and secure sign-up with your Google account</p>
          </div>
        </motion.div>

        <motion.div
          variants={hoverScale}
          initial='initial'
          whileHover='hover'
          whileTap={{ scale: 0.95 }}
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
        </motion.div>
      </CardGrid>

      <div className='text-center'>
        <p className='text-slate-400'>
          Already have an account?{' '}
          <Link to='/login' className='text-blue-400 hover:text-blue-300 transition-colors'>
            Sign in here
          </Link>
        </p>
      </div>
    </motion.div>
  );

  const renderManualForm = () => (
    <motion.div
      variants={fadeInUp}
      initial='hidden'
      animate='visible'
      className='space-y-6'
      whileHover={{ scale: 1.01 }}
    >
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
    </motion.div>
  );

  // Removed preferences step - difficulty and topics will be set in the game itself

  const renderConfirmation = () => (
    <motion.div
      variants={scaleIn}
      initial='hidden'
      animate='visible'
      className='text-center space-y-8'
      whileHover={{ scale: 1.02 }}
    >
      <div className='glass rounded-xl p-8 max-w-md mx-auto'>
        <Icon name='CheckCircle' className='w-16 h-16 mx-auto mb-4 text-green-400' />
        <h2 className='text-2xl font-bold text-white mb-4'>Welcome to EveryTriv!</h2>
        <p className='text-slate-300 mb-6'>
          Your account has been created successfully. You can start playing and earning points!
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
    </motion.div>
  );

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-4xl'>
        {step === 'method' && renderMethodSelection()}
        {step === 'manual' && renderManualForm()}
        {step === 'confirmation' && renderConfirmation()}
      </div>
    </div>
  );
}
