import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, DollarSign, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function SubscriptionSettings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    monthly_price: '',
    stripe_price_id: '',
    free_trial_enabled: false,
    trial_days: 30,
    subscription_enabled: false
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (currentUser.role !== 'admin') {
          window.location.href = createPageUrl('Home');
          return;
        }
        setUser(currentUser);
      } catch (err) {
        base44.auth.redirectToLogin();
      }
    };
    loadUser();
  }, []);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['subscriptionSettings'],
    queryFn: async () => {
      const results = await base44.entities.SubscriptionSettings.list();
      return results[0] || null;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        monthly_price: settings.monthly_price || '',
        stripe_price_id: settings.stripe_price_id || '',
        free_trial_enabled: settings.free_trial_enabled || false,
        trial_days: settings.trial_days || 30,
        subscription_enabled: settings.subscription_enabled || false
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (settings) {
        return base44.entities.SubscriptionSettings.update(settings.id, data);
      } else {
        return base44.entities.SubscriptionSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionSettings'] });
      toast.success('Settings saved successfully!');
    },
    onError: () => {
      toast.error('Failed to save settings');
    }
  });

  const handleSave = () => {
    if (!formData.monthly_price || !formData.stripe_price_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    saveMutation.mutate(formData);
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-rose-50 pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Subscription Settings</h1>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-6 h-6 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-800">Subscription Configuration</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <Label className="text-slate-800 font-semibold">Enable Subscription</Label>
                <p className="text-sm text-slate-500 mt-1">
                  Require users to subscribe to access the platform
                </p>
              </div>
              <Switch
                checked={formData.subscription_enabled}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, subscription_enabled: checked }))
                }
                className="data-[state=checked]:bg-violet-400"
              />
            </div>

            <div>
              <Label htmlFor="monthly_price" className="text-slate-600">
                Monthly Price (USD) *
              </Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="monthly_price"
                  type="number"
                  step="0.01"
                  value={formData.monthly_price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, monthly_price: parseFloat(e.target.value) || '' }))
                  }
                  placeholder="9.99"
                  className="pl-10 rounded-xl border-slate-200"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stripe_price_id" className="text-slate-600">
                Stripe Price ID *
              </Label>
              <Input
                id="stripe_price_id"
                value={formData.stripe_price_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, stripe_price_id: e.target.value }))
                }
                placeholder="price_1234567890"
                className="mt-1 rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-500 mt-1">
                Create a recurring price in your Stripe Dashboard
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between p-4 bg-violet-50 rounded-xl mb-4">
                <div>
                  <Label className="text-slate-800 font-semibold">Enable Free Trial</Label>
                  <p className="text-sm text-slate-500 mt-1">
                    Give new users a free trial period
                  </p>
                </div>
                <Switch
                  checked={formData.free_trial_enabled}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, free_trial_enabled: checked }))
                  }
                  className="data-[state=checked]:bg-violet-400"
                />
              </div>

              {formData.free_trial_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Label htmlFor="trial_days" className="text-slate-600">
                    Trial Duration (Days)
                  </Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="trial_days"
                      type="number"
                      value={formData.trial_days}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, trial_days: parseInt(e.target.value) || 30 }))
                      }
                      placeholder="30"
                      className="pl-10 rounded-xl border-slate-200"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Create a recurring price in your Stripe Dashboard</li>
            <li>Copy the Price ID (starts with "price_")</li>
            <li>Paste it in the field above</li>
            <li>Set your monthly price</li>
            <li>Configure trial settings if needed</li>
            <li>Enable subscription when ready</li>
          </ol>
        </motion.div>
      </main>
    </div>
  );
}