import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function SubscriptionSettings() {
  const [user, setUser] = useState(null);
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
      const result = await base44.entities.SubscriptionSettings.list();
      return result[0] || null;
    },
    enabled: !!user
  });

  const [formData, setFormData] = useState({
    monthly_price: 9.99,
    stripe_price_id: '',
    free_trial_enabled: true,
    subscription_enabled: false
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        monthly_price: settings.monthly_price || 9.99,
        stripe_price_id: settings.stripe_price_id || '',
        free_trial_enabled: settings.free_trial_enabled ?? true,
        subscription_enabled: settings.subscription_enabled ?? false
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
    if (!formData.stripe_price_id) {
      toast.error('Please enter a Stripe Price ID');
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
            className="bg-violet-600 hover:bg-violet-700 text-white">
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Info Card */}
        <motion.div
          className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Setup Instructions</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Create a subscription product in your Stripe Dashboard</li>
                <li>Copy the Price ID (starts with price_) and paste below</li>
                <li>Configure your webhook endpoint in Stripe to point to your function</li>
                <li>Enable subscription to start requiring payment</li>
              </ol>
            </div>
          </div>
        </motion.div>

        {/* Settings Form */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}>
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <CreditCard className="w-6 h-6 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-800">Subscription Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="monthly_price" className="text-slate-700">Monthly Price ($)</Label>
              <Input
                id="monthly_price"
                type="number"
                step="0.01"
                value={formData.monthly_price}
                onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })}
                placeholder="9.99"
                className="mt-2 rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-500 mt-1">Display price for users</p>
            </div>

            <div>
              <Label htmlFor="stripe_price_id" className="text-slate-700">Stripe Price ID *</Label>
              <Input
                id="stripe_price_id"
                value={formData.stripe_price_id}
                onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                placeholder="price_xxxxxxxxxxxxx"
                className="mt-2 rounded-xl border-slate-200"
              />
              <p className="text-xs text-slate-500 mt-1">
                Find this in your Stripe Dashboard under Products → Pricing
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <Label className="text-slate-700 font-semibold">30-Day Free Trial</Label>
                <p className="text-xs text-slate-500 mt-1">
                  New users get 30 days free before payment required
                </p>
              </div>
              <Switch
                checked={formData.free_trial_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, free_trial_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-violet-50 rounded-xl border border-violet-200">
              <div>
                <Label className="text-violet-900 font-semibold">Require Subscription</Label>
                <p className="text-xs text-violet-700 mt-1">
                  Enable to start requiring users to subscribe
                </p>
              </div>
              <Switch
                checked={formData.subscription_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, subscription_enabled: checked })}
              />
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Monthly Price</p>
              <p className="text-2xl font-bold text-slate-800">${formData.monthly_price}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className={`text-sm font-semibold ${formData.subscription_enabled ? 'text-green-600' : 'text-slate-400'}`}>
                {formData.subscription_enabled ? 'Active' : 'Disabled'}
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}