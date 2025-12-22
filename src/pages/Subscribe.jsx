import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, Check, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';

// You'll need to replace this with your actual Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

export default function Subscribe() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: settings } = useQuery({
    queryKey: ['subscriptionSettings'],
    queryFn: async () => {
      const result = await base44.entities.SubscriptionSettings.list();
      return result[0] || null;
    },
    enabled: !!user
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
      return subs[0] || null;
    },
    enabled: !!user?.email
  });

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('createCheckoutSession', {});
      
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Failed to start checkout');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const features = [
    'Unlimited profile views',
    'Advanced matching algorithm',
    'Video verification',
    'Priority support',
    'No ads',
    'Exclusive features'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">
            Upgrade to Premium
          </h1>
          <p className="text-lg text-slate-600">
            Get unlimited access to all features
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Pricing Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8 text-center text-white">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-5xl font-bold">${settings.monthly_price}</span>
              <span className="text-xl text-violet-200">/month</span>
            </div>
            {settings.free_trial_enabled && (
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">30-Day Free Trial</span>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="p-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">What's included:</h3>
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.05 }}
                  className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-slate-700">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Subscribe Button */}
            <Button
              onClick={handleSubscribe}
              disabled={isLoading || subscription?.status === 'active'}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl shadow-lg">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Loading...
                </>
              ) : subscription?.status === 'active' ? (
                'Already Subscribed'
              ) : (
                settings.free_trial_enabled ? 'Start Free Trial' : 'Subscribe Now'
              )}
            </Button>

            {settings.free_trial_enabled && (
              <p className="text-center text-xs text-slate-500 mt-4">
                Cancel anytime during the trial. No charges until trial ends.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}