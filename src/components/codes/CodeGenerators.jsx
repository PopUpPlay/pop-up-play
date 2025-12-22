import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Ticket, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default function CodeGenerators({ adminEmail }) {
  const queryClient = useQueryClient();
  const [durations, setDurations] = useState({
    generator1: 7,
    generator2: 30,
    generator3: 90
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['accessCodes'],
    queryFn: () => base44.entities.AccessCode.list(),
    refetchInterval: 5000
  });

  const createCodeMutation = useMutation({
    mutationFn: async ({ generatorType, duration }) => {
      const code = generateCode();
      return base44.entities.AccessCode.create({
        code,
        generator_type: generatorType,
        duration_days: duration,
        created_by: adminEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessCodes'] });
      toast.success('Code generated successfully!');
    },
    onError: () => {
      toast.error('Failed to generate code');
    }
  });

  const deleteCodeMutation = useMutation({
    mutationFn: (codeId) => base44.entities.AccessCode.delete(codeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessCodes'] });
      toast.success('Code deleted');
    }
  });

  const handleGenerate = (generatorType) => {
    const duration = durations[generatorType];
    if (!duration || duration < 1) {
      toast.error('Please enter a valid duration');
      return;
    }
    createCodeMutation.mutate({ generatorType, duration });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const generators = [
    { id: 'generator1', name: 'Generator 1', color: 'bg-blue-50 border-blue-200' },
    { id: 'generator2', name: 'Generator 2', color: 'bg-green-50 border-green-200' },
    { id: 'generator3', name: 'Generator 3', color: 'bg-purple-50 border-purple-200' }
  ];

  return (
    <div className="space-y-6">
      {generators.map((generator) => {
        const generatorCodes = codes.filter(c => c.generator_type === generator.id);
        const unredeemed = generatorCodes.filter(c => !c.is_redeemed);
        
        return (
          <Card key={generator.id} className={`${generator.color} border-2`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                {generator.name}
                <span className="ml-auto text-sm font-normal text-slate-600">
                  {unredeemed.length} active codes
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-slate-700">Duration (days)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={durations[generator.id]}
                    onChange={(e) => setDurations({
                      ...durations,
                      [generator.id]: parseInt(e.target.value) || 0
                    })}
                    className="mt-1 rounded-xl"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => handleGenerate(generator.id)}
                    disabled={createCodeMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-700 text-white">
                    Generate Code
                  </Button>
                </div>
              </div>

              {generatorCodes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-slate-700">Generated Codes:</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {generatorCodes.map((codeItem) => (
                      <div
                        key={codeItem.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          codeItem.is_redeemed ? 'bg-slate-100' : 'bg-white'
                        }`}>
                        <div className="flex-1">
                          <p className={`font-mono text-sm ${
                            codeItem.is_redeemed ? 'text-slate-400 line-through' : 'text-slate-800'
                          }`}>
                            {codeItem.code}
                          </p>
                          <p className="text-xs text-slate-500">
                            {codeItem.duration_days} days
                            {codeItem.is_redeemed && ` • Redeemed by ${codeItem.redeemed_by}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!codeItem.is_redeemed && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => copyToClipboard(codeItem.code)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCodeMutation.mutate(codeItem.id)}
                            className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}