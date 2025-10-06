import type {
  PointPurchaseOption,
  SubscriptionData,
  SubscriptionPlans as SubscriptionPlansType,
  UrlResponse,
} from '@shared';
import {
  clientLogger as logger,
  CONTACT_INFO,
  formatCurrency,
  getErrorMessage,
  PAYMENT_CONTENT,
  PAYMENT_FEATURES,
  VALID_GAME_MODES,
} from '@shared';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  createStaggerContainer,
  fadeInDown,
  fadeInRight,
  fadeInUp,
  scaleIn,
  slideInUp,
} from '../../components/animations';
import { Icon } from '../../components/icons';
import { CardGrid, Container, GridLayout, Section } from '../../components/layout';
import SubscriptionPlans from '../../components/subscription/SubscriptionPlans';
import { Button, ValidationMessage } from '../../components/ui';
import { AudioKey } from '../../constants';
import {
  useDebouncedCallback,
  usePointBalance,
  usePointPackages,
  usePurchasePoints,
} from '../../hooks';
import { useCancelSubscription, useCreateSubscription } from '../../hooks/api';
import { useAppDispatch, useAppSelector } from '../../hooks/layers/utils';
import { selectUserPointBalance } from '../../redux/selectors';
import { setPointBalance } from '../../redux/slices';
import { audioService, storageService } from '../../services';

export default function PaymentView() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const pointBalance = useAppSelector(selectUserPointBalance);

  // Use custom hooks for data fetching
  const { data: balanceData, isLoading: balanceLoading } = usePointBalance();
  const { data: packages, isLoading: packagesLoading } = usePointPackages();
  const purchaseMutation = usePurchasePoints();
  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState<
    'idle' | 'validating' | 'valid' | 'invalid' | 'warning'
  >('idle');

  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlansType | null>(null);
  const [subscriptionPlansLoading, setSubscriptionPlansLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);

  // Debounced package selection
  const debouncedPackageSelect = useDebouncedCallback((packageId: string) => {
    setSelectedPackage(packageId);
  }, 300);

  const handlePackageSelect = (packageId: string) => {
    audioService.play(AudioKey.BUTTON_CLICK);
    debouncedPackageSelect.debounced(packageId);

    logger.gameTarget('Package selected', {
      packageId,
      gameModes: VALID_GAME_MODES,
      timestamp: new Date().toISOString(),
    });
  };

  // Update Redux state when balance data changes
  useEffect(() => {
    if (balanceData) {
      dispatch(
        setPointBalance({
          points: 0,
          balance: balanceData.total_points,
          purchasedPoints: balanceData.purchased_points,
          freePoints: balanceData.free_questions,
          lastUpdated: new Date(),
        })
      );
    }
  }, [balanceData, dispatch]);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const storedSubscription = await storageService.get('current_subscription');
        if (storedSubscription && storedSubscription.success && storedSubscription.data) {
          setCurrentSubscription(storedSubscription.data as SubscriptionData | null);
        }
      } catch (err) {
        logger.error('Failed to fetch current subscription status', {
          error: getErrorMessage(err),
        });
      }
    };

    const fetchSubscriptionPlans = async () => {
      setSubscriptionPlansLoading(true);
      try {
        const plans = await storageService.get('subscription_plans');
        if (plans && plans.success && plans.data) {
          setSubscriptionPlans(plans.data as SubscriptionPlansType);
        }
      } catch (err) {
        logger.error('Failed to fetch subscription plans', { error: getErrorMessage(err) });
      } finally {
        setSubscriptionPlansLoading(false);
      }
    };

    fetchSubscriptionStatus();
    fetchSubscriptionPlans();
  }, []);

  // Memoize features array to avoid recreation on every render
  const features = useMemo(
    () => [
      {
        icon: (
          <Icon
            name={PAYMENT_FEATURES.UNLIMITED_QUESTIONS.icon}
            size='2xl'
            color={PAYMENT_FEATURES.UNLIMITED_QUESTIONS.color}
          />
        ),
        title: PAYMENT_FEATURES.UNLIMITED_QUESTIONS.title,
        description: `${PAYMENT_FEATURES.UNLIMITED_QUESTIONS.description} ${CONTACT_INFO.features[1]}. ${CONTACT_INFO.features[3]}.`,
      },
      {
        icon: (
          <Icon
            name={PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.icon}
            size='2xl'
            color={PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.color}
          />
        ),
        title: PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.title,
        description: `${PAYMENT_FEATURES.CUSTOM_DIFFICULTIES.description} ${CONTACT_INFO.features[0]}. ${CONTACT_INFO.features[2]}.`,
      },
      {
        icon: (
          <Icon
            name={PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.icon}
            size='2xl'
            color={PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.color}
          />
        ),
        title: PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.title,
        description: PAYMENT_FEATURES.DAILY_FREE_QUESTIONS.description,
      },
      {
        icon: (
          <Icon
            name={PAYMENT_FEATURES.SUPPORT.icon}
            size='2xl'
            color={PAYMENT_FEATURES.SUPPORT.color}
          />
        ),
        title: PAYMENT_FEATURES.SUPPORT.title,
        description: `${PAYMENT_FEATURES.SUPPORT.description} ${CONTACT_INFO.tagline}. Contact us at ${CONTACT_INFO.email}.`,
      },
    ],
    []
  );

  const handlePurchase = async () => {
    if (!selectedPackage) {
      audioService.play(AudioKey.ERROR);
      setPurchaseStatus('invalid');
      return;
    }

    const startTime = performance.now();
    setPurchaseStatus('validating');

    try {
      setPurchasing(true);

      // Save purchase attempt to storage
      await storageService.set('purchase-attempt', {
        packageId: selectedPackage,
        timestamp: new Date().toISOString(),
        gameModes: VALID_GAME_MODES,
      });

      purchaseMutation.mutate(selectedPackage, {
        onSuccess: (response: UrlResponse & { paymentUrl?: string }) => {
          if (response.success) {
            setPurchaseStatus('valid');
            audioService.play(AudioKey.GAME_START);

            logger.payment('Payment intent created successfully', {
              packageId: selectedPackage,
              gameModes: VALID_GAME_MODES,
              timestamp: new Date().toISOString(),
            });

            // Simulate payment confirmation
            setTimeout(() => {
              setSuccess(true);
              setPurchasing(false);
              audioService.play(AudioKey.SUCCESS);
              const duration = performance.now() - startTime;
              logger.performance('point_purchase', duration, { success: true });
            }, 2000);
          }
        },
        onError: (err: Error) => {
          setPurchaseStatus('invalid');
          audioService.play(AudioKey.ERROR);
          const errorMessage = getErrorMessage(err);
          logger.payment('Purchase failed', {
            error: errorMessage,
            packageId: selectedPackage,
          });
          const duration = performance.now() - startTime;
          logger.performance('point_purchase', duration, {
            success: false,
            error: errorMessage,
          });
          logger.userError('Purchase failed', { error: errorMessage });
          setPurchasing(false);
        },
      });
    } catch (err: unknown) {
      setPurchaseStatus('invalid');
      audioService.play(AudioKey.ERROR);
      const errorMessage = getErrorMessage(err);
      logger.paymentFailed('payment_intent', errorMessage, {
        packageId: selectedPackage,
      });
      const duration = performance.now() - startTime;
      logger.performance('point_purchase', duration, {
        success: false,
        error: errorMessage,
      });
      logger.userError('Purchase failed', {
        error: errorMessage,
      });
      setPurchasing(false);
    }
  };

  if (balanceLoading || packagesLoading) {
    return (
      <div className='min-h-screen pt-20 pb-12 px-4 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-slate-300'>{PAYMENT_CONTENT.LOADING.message}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className='min-h-screen pt-20 pb-12 px-4 flex items-center justify-center'>
        <motion.div
          variants={scaleIn}
          initial='hidden'
          animate='visible'
          className='text-center max-w-md'
          whileHover={{ scale: 1.02 }}
        >
          <div className='w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6'>
            <Icon name='checkcircle' size='xl' color='white' />
          </div>
          <h2 className='text-3xl font-bold gradient-text mb-4'>{PAYMENT_CONTENT.SUCCESS.title}</h2>
          <p className='text-slate-300 text-lg mb-8'>{PAYMENT_CONTENT.SUCCESS.message}</p>

          <div className='glass rounded-xl p-6 mb-8'>
            <h3 className='text-lg font-semibold text-white mb-4'>Updated Balance</h3>
            <div className='space-y-2 text-left text-slate-300'>
              <div className='flex justify-between'>
                <span>Total Points:</span>
                <span className='font-semibold text-white'>{pointBalance?.total_points || 0}</span>
              </div>
              <div className='flex justify-between'>
                <span>Free Questions:</span>
                <span className='text-green-400'>{pointBalance?.free_questions || 0}</span>
              </div>
              <div className='flex justify-between'>
                <span>Purchased Points:</span>
                <span className='text-blue-400'>{pointBalance?.purchased_points || 0}</span>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <motion.div
              variants={fadeInRight}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={() => {
                  audioService.play(AudioKey.GAME_START);
                  navigate('/');
                }}
                variant='primary'
                size='lg'
                className='w-full max-w-sm bg-gradient-to-r from-blue-500 to-purple-500'
              >
                {PAYMENT_CONTENT.SUCCESS.startPlaying}
              </Button>
            </motion.div>
            <motion.div
              variants={fadeInRight}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.4 }}
            >
              <Button
                onClick={() => {
                  audioService.play(AudioKey.BUTTON_CLICK);
                  navigate('/');
                }}
                variant='ghost'
                size='lg'
                className='w-full max-w-sm text-slate-300'
              >
                {PAYMENT_CONTENT.SUCCESS.backToHome}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'points' | 'subscription'>('points');

  return (
    <Container
      size='xl'
      className='min-h-screen flex flex-col items-center justify-start p-4 pt-20'
    >
      <Section padding='xl' className='w-full space-y-8'>
        {/* Header */}
        <motion.div
          variants={fadeInDown}
          initial='hidden'
          animate='visible'
          transition={{ delay: 0.2 }}
          className='text-center mb-12'
        >
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4 gradient-text'>
            {PAYMENT_CONTENT.HEADER.title}
          </h1>
          <p className='text-xl text-slate-300'>{PAYMENT_CONTENT.HEADER.subtitle}</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
          exit='exit'
          className='mb-8'
        >
          <div className='flex justify-center'>
            <div className='bg-slate-800/60 rounded-lg p-1 border border-white/10'>
              <button
                onClick={() => setActiveTab('points')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'points'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon name='zap' size='sm' className='mr-2 inline' />
                Points Packages
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'subscription'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Icon name='star' size='sm' className='mr-2 inline' />
                Subscription Plans
              </button>
            </div>
          </div>
        </motion.div>

        {/* Subscription Management */}
        {activeTab === 'subscription' && (
          <motion.div
            variants={fadeInUp}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.4 }}
            className='mb-8'
          >
            <Section background='glass' padding='lg' className='rounded-lg'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-2xl font-bold text-white'>Subscription Management</h2>
                <Button
                  variant='secondary'
                  onClick={() => setShowSubscriptionManagement(!showSubscriptionManagement)}
                  className='bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30'
                >
                  {showSubscriptionManagement ? 'Hide' : 'Manage'}
                </Button>
              </div>

              {showSubscriptionManagement && (
                <div className='space-y-4'>
                  {currentSubscription && currentSubscription.plan !== 'free' ? (
                    <div className='bg-green-500/10 border border-green-400/30 rounded-lg p-4'>
                      <h3 className='text-lg font-semibold text-green-300 mb-2'>
                        Active Subscription
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                        <div>
                          <span className='text-slate-400'>Plan:</span>
                          <span className='text-white ml-2'>
                            {String(currentSubscription.plan || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span className='text-slate-400'>Status:</span>
                          <span className='text-green-400 ml-2'>
                            {String(currentSubscription.status || 'Unknown')}
                          </span>
                        </div>
                        <div>
                          <span className='text-slate-400'>Next Billing:</span>
                          <span className='text-white ml-2'>
                            {String(currentSubscription.nextBillingDate || 'Unknown')}
                          </span>
                        </div>
                      </div>
                      <div className='mt-4 flex gap-2'>
                        <Button
                          variant='secondary'
                          onClick={() => cancelSubscription.mutate()}
                          disabled={cancelSubscription.isPending}
                          className='bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30'
                        >
                          {cancelSubscription.isPending ? 'Canceling...' : 'Cancel Subscription'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className='bg-slate-500/10 border border-slate-400/30 rounded-lg p-4'>
                      <h3 className='text-lg font-semibold text-slate-300 mb-2'>
                        No Active Subscription
                      </h3>
                      <p className='text-slate-400 text-sm mb-4'>
                        Subscribe to unlock unlimited questions and premium features.
                      </p>
                      <Button
                        variant='primary'
                        onClick={() =>
                          createSubscription.mutate({ plan: 'premium', billingCycle: 'monthly' })
                        }
                        disabled={createSubscription.isPending}
                        className='bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                      >
                        {createSubscription.isPending
                          ? 'Creating...'
                          : 'Start Premium Subscription'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Section>
          </motion.div>
        )}

        {/* Current Subscription Status */}
        {activeTab === 'subscription' &&
          currentSubscription &&
          currentSubscription.plan !== 'free' && (
            <motion.div
              variants={fadeInUp}
              initial='hidden'
              animate='visible'
              exit='exit'
              className='mb-8'
            >
              <div className='bg-green-500/20 border border-green-400/30 rounded-lg p-4 text-center'>
                <Icon name='checkcircle' size='lg' color='success' className='mx-auto mb-2' />
                <h3 className='text-lg font-semibold text-green-400 mb-1'>
                  Active{' '}
                  {String(currentSubscription.plan || 'Unknown')
                    .charAt(0)
                    .toUpperCase() + String(currentSubscription.plan || 'Unknown').slice(1)}{' '}
                  Subscription
                </h3>
                <p className='text-green-300 text-sm'>
                  Next billing:{' '}
                  {new Date(String(currentSubscription.endDate || '')).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          )}

        {/* Content based on active tab */}
        {activeTab === 'points' ? (
          // Points Packages Content
          <motion.div variants={fadeInUp} initial='hidden' animate='visible' exit='exit'>
            {/* Package Selection */}
            <motion.div
              variants={fadeInUp}
              initial='hidden'
              animate='visible'
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Validation Status */}
              {purchaseStatus === 'validating' && (
                <ValidationMessage
                  status='validating'
                  className='mb-4 text-center'
                  showMessages={true}
                />
              )}

              {selectedPackage && purchaseStatus === 'valid' && (
                <motion.div
                  variants={fadeInRight}
                  initial='hidden'
                  animate='visible'
                  transition={{ delay: 0.1 }}
                >
                  <ValidationMessage
                    status='valid'
                    successMessage={PAYMENT_CONTENT.VALIDATION.packageSelected}
                    className='mb-4 text-center'
                    showMessages={true}
                  />
                </motion.div>
              )}

              {!selectedPackage && (
                <ValidationMessage
                  status='warning'
                  warnings={[PAYMENT_CONTENT.VALIDATION.selectPackage]}
                  className='mb-4 text-center'
                  showMessages={true}
                />
              )}

              <CardGrid columns={3} gap='lg' className='mb-8'>
                {Array.isArray(packages) && packages.length > 0 ? (
                  packages.map((pkg, index) => (
                    <motion.div
                      key={pkg.id}
                      variants={fadeInRight}
                      initial='hidden'
                      animate='visible'
                      transition={{ delay: 0.1 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        className={`relative glass rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                          selectedPackage === pkg.id
                            ? 'ring-2 ring-blue-500 bg-blue-500/10'
                            : 'hover:bg-white/5'
                        } ${pkg.popular ? 'ring-2 ring-yellow-400' : ''}`}
                        onClick={() => handlePackageSelect(pkg.id)}
                      >
                        {pkg.popular && (
                          <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                            <div className='bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center'>
                              <Icon name='star' size='sm' color='black' className='mr-1' />
                              {PAYMENT_CONTENT.PACKAGES.popularBadge}
                            </div>
                          </div>
                        )}

                        <div className='text-center'>
                          <h3 className='text-2xl font-bold text-white mb-2'>
                            {formatCurrency(pkg.price)}
                          </h3>
                          <div className='text-4xl font-bold text-white mb-4'>
                            {pkg.points} {PAYMENT_CONTENT.PACKAGES.points}
                            {pkg.savings && (
                              <span className='text-lg text-green-400 block'>
                                {PAYMENT_CONTENT.PACKAGES.save} {pkg.savings}
                              </span>
                            )}
                          </div>
                          <div className='space-y-3 mb-6'>
                            <div className='flex items-center text-slate-300'>
                              <Icon
                                name='checkcircle'
                                size='sm'
                                color='success'
                                className='mr-3 flex-shrink-0'
                              />
                              {pkg.points} {PAYMENT_CONTENT.PACKAGES.features.questions}
                            </div>
                            <div className='flex items-center text-slate-300'>
                              <Icon
                                name='checkcircle'
                                size='sm'
                                color='success'
                                className='mr-3 flex-shrink-0'
                              />
                              {PAYMENT_CONTENT.PACKAGES.features.difficulties}
                            </div>
                            <div className='flex items-center text-slate-300'>
                              <Icon
                                name='checkcircle'
                                size='sm'
                                color='success'
                                className='mr-3 flex-shrink-0'
                              />
                              {PAYMENT_CONTENT.PACKAGES.features.noExpiration}
                            </div>
                          </div>
                          <Button
                            variant={selectedPackage === pkg.id ? 'primary' : 'ghost'}
                            className={`w-full ${
                              selectedPackage === pkg.id
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                                : ''
                            }`}
                          >
                            {selectedPackage === pkg.id
                              ? PAYMENT_CONTENT.PACKAGES.selected
                              : PAYMENT_CONTENT.PACKAGES.selectPlan}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className='col-span-full text-center py-12'>
                    <Icon
                      name='alerttriangle'
                      size='2xl'
                      color='warning'
                      className='mx-auto mb-4'
                    />
                    <h3 className='text-xl font-semibold text-white mb-2'>
                      {PAYMENT_CONTENT.PACKAGES.noPackagesTitle}
                    </h3>
                    <p className='text-slate-300'>{PAYMENT_CONTENT.PACKAGES.noPackagesMessage}</p>
                  </div>
                )}
              </CardGrid>
            </motion.div>
          </motion.div>
        ) : (
          // Subscription Plans Content
          <motion.div variants={fadeInUp} initial='hidden' animate='visible' exit='exit'>
            {subscriptionPlansLoading ? (
              <div className='text-center py-12'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'></div>
                <p className='text-slate-300 mt-4'>Loading subscription plans...</p>
              </div>
            ) : subscriptionPlans ? (
              <SubscriptionPlans plans={subscriptionPlans} />
            ) : (
              <div className='text-center py-12'>
                <p className='text-slate-300'>Failed to load subscription plans</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Payment Form */}
        {selectedPackage && (
          <motion.div
            variants={slideInUp}
            initial='hidden'
            animate='visible'
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.01 }}
          >
            <Section background='glass' padding='lg' className='rounded-lg'>
              <h2 className='text-2xl font-bold text-white mb-6 text-center'>
                {PAYMENT_CONTENT.PAYMENT.title}
              </h2>
              <GridLayout variant='form' gap='lg'>
                <div>
                  <label className='block text-white font-medium mb-2'>
                    {PAYMENT_CONTENT.PAYMENT.cardNumber}
                  </label>
                  <input
                    type='text'
                    placeholder={PAYMENT_CONTENT.PAYMENT.cardNumberPlaceholder}
                    className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-white font-medium mb-2'>
                    {PAYMENT_CONTENT.PAYMENT.expiryDate}
                  </label>
                  <input
                    type='text'
                    placeholder={PAYMENT_CONTENT.PAYMENT.expiryDatePlaceholder}
                    className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-white font-medium mb-2'>
                    {PAYMENT_CONTENT.PAYMENT.cvv}
                  </label>
                  <input
                    type='text'
                    placeholder={PAYMENT_CONTENT.PAYMENT.cvvPlaceholder}
                    className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-white font-medium mb-2'>
                    {PAYMENT_CONTENT.PAYMENT.nameOnCard}
                  </label>
                  <input
                    type='text'
                    placeholder={PAYMENT_CONTENT.PAYMENT.nameOnCardPlaceholder}
                    className='w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </GridLayout>

              <div className='mt-8 text-center'>
                <motion.div
                  variants={fadeInRight}
                  initial='hidden'
                  animate='visible'
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    variant='primary'
                    size='lg'
                    className='w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                    onClick={handlePurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                        {PAYMENT_CONTENT.PAYMENT.processing}
                      </div>
                    ) : (
                      `${PAYMENT_CONTENT.PAYMENT.payButton} ${formatCurrency(packages?.find((pkg: PointPurchaseOption) => pkg.id === selectedPackage)?.price || 0)}`
                    )}
                  </Button>
                </motion.div>
              </div>
            </Section>
          </motion.div>
        )}

        {/* Features Comparison */}
        <motion.div
          variants={fadeInUp}
          initial='hidden'
          animate='visible'
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.01 }}
        >
          <Section background='glass' padding='lg' className='rounded-lg'>
            <h2 className='text-2xl font-bold text-white mb-6 text-center'>
              {PAYMENT_CONTENT.FEATURES.title}
            </h2>
            <motion.div variants={createStaggerContainer(0.1)} initial='hidden' animate='visible'>
              <GridLayout variant='content' gap='lg'>
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInRight}
                    custom={index * 0.1}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className='text-center'>
                      <div className='text-4xl mb-4'>{feature.icon}</div>
                      <h3 className='text-xl font-semibold text-white mb-2'>{feature.title}</h3>
                      <p className='text-slate-300'>{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </GridLayout>
            </motion.div>
          </Section>
        </motion.div>
      </Section>
    </Container>
  );
}
