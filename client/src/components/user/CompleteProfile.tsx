import { COUNTRIES } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { UserRole } from '@shared/constants';
import { getErrorMessage } from '@shared/utils/error.utils';
import { motion } from 'framer-motion';
import { FormEvent, memo, useCallback, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { setUser } from '@/redux/slices/userSlice';
import { authService } from '@/services/auth';

import { USER_DEFAULT_VALUES } from '../../constants';
import type { RootState } from '../../types/redux/state.types';
import { fadeInUp, hoverScale } from '../animations';
import { Avatar, Button, ValidatedInput, ValidationMessage } from '../ui';

const CompleteProfile = memo(function CompleteProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  // Memoize initial form data
  const initialFormData = useMemo(
    () => ({
      fullName: user?.fullName || '',
      avatar: user?.avatar || '',
      address: {
        country: user?.address?.country || '',
        state: user?.address?.state || '',
        city: user?.address?.city || '',
        street: user?.address?.street || '',
        zipCode: user?.address?.zipCode || '',
        apartment: user?.address?.apartment || '',
      },
    }),
    [user]
  );

  const [formData, setFormData] = useState(initialFormData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Enhanced validation with form validation hook

  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'validating' | 'valid' | 'invalid'
  >('idle');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateForm = useCallback((): boolean => {
    // Simple validation
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      setValidationErrors(['Full name must be at least 2 characters']);
      setValidationStatus('invalid');
      return false;
    }

    if (!formData.address.country) {
      setValidationErrors(['Country is required']);
      setValidationStatus('invalid');
      return false;
    }

    if (formData.avatar && !isValidAvatarUrl(formData.avatar)) {
      setValidationErrors([
        'Please enter a valid avatar URL from an allowed domain (HTTPS only, image formats: jpg, jpeg, png, gif, webp, svg)',
      ]);
      setValidationStatus('invalid');
      return false;
    }

    setValidationErrors([]);
    setValidationStatus('valid');
    return true;
  }, [formData]);

  const isValidAvatarUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);

      // Must be HTTPS
      if (urlObj.protocol !== 'https:') {
        return false;
      }

      // Check for allowed domains
      const allowedDomains = [
        'googleusercontent.com',
        'gravatar.com',
        'github.com',
        'githubusercontent.com',
        'imgur.com',
        'cloudinary.com',
        'amazonaws.com',
        'googleapis.com',
      ];

      const isAllowedDomain = allowedDomains.some(
        domain => urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );

      if (!isAllowedDomain) {
        return false;
      }

      // Check file extension
      const validExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
      if (!validExtensions.test(urlObj.pathname)) {
        return false;
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /\.exe$/i,
        /\.php$/i,
        /\.js$/i,
        /\.html$/i,
        /\.htm$/i,
        /script/i,
        /javascript/i,
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(url))) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  // Form validation is now handled by the useFormValidation hook

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');
      setValidationStatus('validating');

      // Validate form before submission
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      try {
        const updatedUser = await authService.completeProfile(formData);
        // Convert AuthResponse user to User type by adding missing properties
        const userWithTimestamps = {
          ...updatedUser,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dispatch(
          setUser({
            ...userWithTimestamps,
            ...USER_DEFAULT_VALUES,
            role: userWithTimestamps.role as UserRole,
            createdAt: userWithTimestamps.createdAt,
            updatedAt: userWithTimestamps.updatedAt,
          })
        );
        setValidationStatus('valid');
        navigate('/');
      } catch (error) {
        setError('Failed to update profile. Please try again.');
        setValidationStatus('invalid');
        logger.userError('Profile completion error', {
          error: getErrorMessage(error),
        });
      } finally {
        setLoading(false);
      }
    },
    [formData, dispatch, navigate, validateForm]
  );

  const handleSkip = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-pink-700 py-12 px-4 sm:px-6 lg:px-8'>
      <motion.div
        variants={fadeInUp}
        initial='hidden'
        animate='visible'
        className='max-w-md w-full space-y-8'
      >
        <div className='glass p-8 rounded-lg'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-white'>Complete Your Profile</h2>
            <p className='text-slate-300 mt-2'>Add some details to personalize your experience</p>
          </div>

          {/* Validation Message */}
          <ValidationMessage status={validationStatus} errors={validationErrors} className='mb-4' />

          {error && (
            <div className='bg-red-500/20 border border-red-500 text-red-100 px-4 py-3 rounded mb-4'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div>
              <label htmlFor='fullName' className='block text-sm font-medium text-slate-300 mb-2'>
                Full Name *
              </label>
              <ValidatedInput
                id='fullName'
                type='text'
                validationType='username'
                value={formData.fullName}
                initialValue={formData.fullName}
                onChange={value => {
                  setFormData(prev => ({ ...prev, fullName: value }));
                  // Form validation is handled automatically by the hook
                }}
                placeholder='Enter your full name'
                className='w-full'
              />
            </div>

            <div>
              <label htmlFor='country' className='block text-sm font-medium text-slate-300 mb-2'>
                Country *
              </label>
              <select
                id='country'
                value={formData.address.country}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, country: value },
                  }));
                  // Form validation is handled automatically by the hook
                }}
                className='w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value=''>Select your country</option>
                {COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.phonePrefix})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor='avatar' className='block text-sm font-medium text-slate-300 mb-2'>
                Avatar URL (optional)
              </label>
              <input
                id='avatar'
                type='url'
                value={formData.avatar}
                onChange={e => {
                  const value = e.target.value;
                  setFormData(prev => ({ ...prev, avatar: value }));
                  // Form validation is handled automatically by the hook
                }}
                placeholder='Enter avatar URL'
                className='w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>

            {formData.avatar && (
              <div className='text-center'>
                <Avatar
                  src={formData.avatar}
                  username={formData.fullName}
                  fullName={formData.fullName}
                  size='lg'
                  alt='Avatar preview'
                  showLoading={true}
                  lazy={false}
                />
              </div>
            )}

            <div className='flex space-x-4'>
              <motion.div variants={hoverScale} initial='normal' whileHover='hover'>
                <Button
                  type='submit'
                  variant='primary'
                  className='flex-1'
                  disabled={loading || validationStatus === 'invalid'}
                >
                  {loading ? (
                    <div className='flex items-center justify-center'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Saving...
                    </div>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </motion.div>

              <motion.div variants={hoverScale} initial='normal' whileHover='hover'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={handleSkip}
                  className='flex-1 text-slate-300 hover:text-white'
                  disabled={loading}
                >
                  Skip
                </Button>
              </motion.div>
            </div>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-xs text-slate-400'>
              You can always update your profile later in the settings
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
});

export default CompleteProfile;
