import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Ticket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RedeemCodeInput({ userEmail }) {
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const redeemMutation = useMutation({
    mutationFn: async (codeValue) => {
      // Find the code
      const codes = await base44.entities.AccessCode.filter({ code: codeValue.toUpperCase() });
      
      if (codes.length === 0) {
        throw new Error('Invalid code');
      }

      const accessCode = codes[0];

      if (accessCode.is_redeemed) {
        throw new Error('This code has already been used');
      }

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + accessCode.duration_days);

      // Update or create user subscription
      const existingSubs = await base44.entities.UserSubscription.filter({ user_email: userEmail });
      
      if (existingSubs.length > 0) {
        const currentSub = existingSubs[0];
        const newExpiry = new Date(Math.max(
          new Date(currentSub.current_period_end || new Date()),
          new Date()
        ));
        newExpiry.setDate(newExpiry.getDate() + accessCode.duration_days);

        await base44.entities.UserSubscription.update(currentSub.id, {
          status: 'active',
          current_period_end: newExpiry.toISOString()
        });
      } else {
        await base44.entities.UserSubscription.create({
          user_email: userEmail,
          status: 'active',
          current_period_end: expiresAt.toISOString()
        });
      }

      // Mark code as redeemed
      await base44.entities.AccessCode.update(accessCode.id, {
        is_redeemed: true,
        redeemed_by: userEmail,
        redeemed_at: new Date().toISOString()
      });

      return accessCode.duration_days;
    },
    onSuccess: (days) => {
      queryClient.invalidateQueries({ queryKey: ['userSubscription'] });
      toast.success(`Success! ${days} days of free access added to your account`);
      setCode('');
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to redeem code');
    }
  });

  const handleRedeem = () => {
    if (!code.trim()) {
      toast.error('Please enter a code');
      return;
    }
    redeemMutation.mutate(code.trim());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl">
          <Ticket className="w-4 h-4" />
          Redeem Code
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Redeem Access Code</DialogTitle>
          <DialogDescription>
            Enter your code to get free access
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="XXXX-XXXX-XXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="rounded-xl font-mono text-center text-lg tracking-wider"
            maxLength={14}
          />
          <Button
            onClick={handleRedeem}
            disabled={redeemMutation.isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl">
            {redeemMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redeeming...
              </>
            ) : (
              'Redeem Code'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}