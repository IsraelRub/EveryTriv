/**
 * Subscription Plans Component
 * Displays available subscription plans with features and pricing
 *
 * @component SubscriptionPlans
 * @description Component for displaying and selecting subscription plans
 * @used_by client/src/views/payment
 */
import { formatCurrency } from '@shared';
import { SubscriptionPlanDetails } from '@shared/types/subscription.types';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { useCreateSubscription } from '../../hooks/api';
import { SubscriptionPlansProps } from '../../types';
import { Icon } from '../icons';
import { Button } from '../ui';

export default function SubscriptionPlans({
  plans,
  onPlanSelect,
  className = '',
}: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const createSubscriptionMutation = useCreateSubscription();

  const handlePlanSelect = (planKey: string) => {
    setSelectedPlan(planKey);
    onPlanSelect?.(planKey);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    try {
      await createSubscriptionMutation.mutateAsync({
        plan: selectedPlan,
        billingCycle,
      });
    } catch (error) {
      // Error handling is managed by the mutation hook
    }
  };

  const getPlanPrice = (plan: SubscriptionPlanDetails) => {
    const basePrice = plan.price;
    const discount = billingCycle === 'yearly' ? 0.2 : 0;
    return basePrice * (1 - discount);
  };

  const getPlanFeatures = (plan: SubscriptionPlanDetails) => {
    const baseFeatures = plan.features || [];
    const pointBonus = plan.pointBonus ? [`${plan.pointBonus} bonus points`] : [];
    const questionLimit =
      plan.questionLimit === -1
        ? ['Unlimited questions']
        : [`${plan.questionLimit} questions/month`];

    return [...baseFeatures, ...pointBonus, ...questionLimit];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Billing Cycle Toggle */}
      <div className='flex justify-center'>
        <div className='bg-slate-800/60 rounded-lg p-1 border border-white/10'>
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-blue-500 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Yearly
            <span className='ml-1 text-xs text-green-400'>Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Object.entries(plans).map(([planKey, plan]) => (
          <motion.div
            key={planKey}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            initial='hidden'
            animate='visible'
            className={`relative rounded-xl p-6 border-2 transition-all cursor-pointer ${
              selectedPlan === planKey
                ? 'border-blue-400 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                : 'border-white/10 bg-slate-800/40 hover:border-white/20 hover:bg-slate-800/60'
            }`}
            onClick={() => handlePlanSelect(planKey)}
          >
            {/* Plan Header */}
            <div className='text-center mb-6'>
              <h3 className='text-xl font-bold text-white mb-2'>
                {plan.name || planKey.charAt(0).toUpperCase() + planKey.slice(1)}
              </h3>
              <div className='text-3xl font-bold text-white mb-1'>
                {formatCurrency(getPlanPrice(plan))}
              </div>
              <div className='text-slate-300 text-sm'>
                per {billingCycle === 'yearly' ? 'year' : 'month'}
              </div>
            </div>

            {/* Features List */}
            <div className='space-y-3 mb-6'>
              {getPlanFeatures(plan).map((feature, index) => (
                <div key={index} className='flex items-center text-slate-300'>
                  <Icon
                    name='checkcircle'
                    size='sm'
                    color='success'
                    className='mr-3 flex-shrink-0'
                  />
                  <span className='text-sm'>{feature}</span>
                </div>
              ))}
            </div>

            {/* Select Button */}
            <Button
              variant={selectedPlan === planKey ? 'primary' : 'ghost'}
              className={`w-full ${
                selectedPlan === planKey ? 'bg-gradient-to-r from-blue-500 to-purple-500' : ''
              }`}
            >
              {selectedPlan === planKey ? 'Selected' : 'Select Plan'}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Subscribe Button */}
      {selectedPlan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-center'
        >
          <Button
            onClick={handleSubscribe}
            disabled={createSubscriptionMutation.isPending}
            className='bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8 py-3 text-lg'
          >
            {createSubscriptionMutation.isPending ? 'Processing...' : 'Subscribe Now'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
