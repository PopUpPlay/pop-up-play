import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function MatchRating({ matchId, ratedUserEmail, currentUserEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();

  const { data: existingRating } = useQuery({
    queryKey: ['matchRating', matchId, currentUserEmail],
    queryFn: async () => {
      const ratings = await base44.entities.MatchRating.filter({
        match_id: matchId,
        rater_email: currentUserEmail
      });
      return ratings[0] || null;
    },
    enabled: !!matchId && !!currentUserEmail
  });

  const rateMutation = useMutation({
    mutationFn: async (data) => {
      if (existingRating) {
        return base44.entities.MatchRating.update(existingRating.id, data);
      }
      return base44.entities.MatchRating.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matchRating'] });
      toast.success('Rating saved successfully!');
      setIsOpen(false);
    },
    onError: () => {
      toast.error('Failed to save rating');
    }
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    rateMutation.mutate({
      match_id: matchId,
      rater_email: currentUserEmail,
      rated_email: ratedUserEmail,
      rating,
      feedback: feedback.trim() || undefined
    });
  };

  React.useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setFeedback(existingRating.feedback || '');
    }
  }, [existingRating]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Star className={`w-4 h-4 ${existingRating ? 'fill-yellow-500 text-yellow-500' : ''}`} />
          {existingRating ? `Rated ${existingRating.rating}★` : 'Rate Match'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate This Match</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Feedback (optional)
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Share your thoughts about this match..."
              className="resize-none"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={rateMutation.isPending || rating === 0}
            className="w-full bg-violet-600 hover:bg-violet-700"
          >
            {rateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Rating'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}