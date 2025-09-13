/**
 * Unauthorized View
 *
 * @module UnauthorizedView
 * @description Page shown when user doesn't have required permissions
 */
import { clientLogger } from '@shared';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { fadeInUp, scaleIn } from '../../components/animations';
import { Icon } from '../../components/icons';
import { Container, Section } from '../../components/layout';
import { Button } from '../../components/ui';
import { AudioKey } from '../../constants';
import { audioService } from '../../services';

export default function UnauthorizedView() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    audioService.play(AudioKey.BUTTON_CLICK);
    navigate(-1);
  };

  const handleGoHome = () => {
    audioService.play(AudioKey.BUTTON_CLICK);
    navigate('/');
  };

  // Log unauthorized access
  clientLogger.securityDenied('Unauthorized access attempt', {
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  });

  return (
    <Container size='xl' className='min-h-screen flex items-center justify-center'>
      <Section padding='xl' className='text-center'>
        <motion.div variants={scaleIn} initial='hidden' animate='visible' className='space-y-6'>
          {/* Icon */}
          <div className='flex justify-center'>
            <Icon name='Shield' className='w-24 h-24 text-red-400' />
          </div>

          {/* Title */}
          <motion.h1 variants={fadeInUp} className='text-4xl font-bold text-white'>
            Access Denied
          </motion.h1>

          {/* Description */}
          <motion.p variants={fadeInUp} className='text-xl text-slate-300 max-w-md mx-auto'>
            You don't have permission to access this page. Please contact an administrator if you
            believe this is an error.
          </motion.p>

          {/* Actions */}
          <motion.div
            variants={fadeInUp}
            className='flex flex-col sm:flex-row gap-4 justify-center'
          >
            <Button variant='secondary' onClick={handleGoBack} className='flex items-center gap-2'>
              <Icon name='ArrowLeft' className='w-4 h-4' />
              Go Back
            </Button>

            <Button variant='primary' onClick={handleGoHome} className='flex items-center gap-2'>
              <Icon name='Home' className='w-4 h-4' />
              Go Home
            </Button>
          </motion.div>
        </motion.div>
      </Section>
    </Container>
  );
}
