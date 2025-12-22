import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function SubscriptionGate({ children }) {
  const [user, setUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        setIsChecking(false);
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

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['userSubscription', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const subs = await base44.entities.UserSubscription.filter({ user_email: user.email });
      
      if (subs.length === 0 && settings?.free_trial_enabled) {
        // Create trial subscription for new user
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 30);
        
        const newSub = await base44.entities.UserSubscription.create({
          user_email: user.email,
          status: 'trial',
          trial_ends_at: trialEndsAt.toISOString()
        });
        return newSub;
      }
      
      return subs[0] || null;
    },
    enabled: !!user?.email && !!settings
  });

  useEffect(() => {
    if (user && settings && subscription !== undefined) {
      setIsChecking(false);

      // If subscription is required
      if (settings.subscription_enabled) {
        // Check if user is admin - bypass for admins
        if (user.role === 'admin') {
          return;
        }

        // Check subscription status
        if (!subscription) {
          navigate(createPageUrl('Subscribe'));
          return;
        }

        // Check if trial expired
        if (subscription.status === 'trial' && subscription.trial_ends_at) {
          const trialEnd = new Date(subscription.trial_ends_at);
          if (new Date() > trialEnd) {
            navigate(createPageUrl('Subscribe'));
            return;
          }
        }

        // Check if subscription is not active or trial
        if (!['active', 'trial'].includes(subscription.status)) {
          navigate(createPageUrl('Subscribe'));
          return;
        }
      }
    }
  }, [user, settings, subscription, navigate]);

  if (isChecking || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}