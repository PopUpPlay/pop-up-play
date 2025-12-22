import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProfileProgress({ profile }) {
  const requiredFields = [
    { key: 'display_name', label: 'Display Name', value: profile?.display_name },
    { key: 'avatar_url', label: 'Profile Photo', value: profile?.avatar_url },
    { key: 'bio', label: 'Bio', value: profile?.bio },
    { key: 'age', label: 'Age', value: profile?.age },
    { key: 'gender', label: 'Gender', value: profile?.gender },
    { key: 'interested_in', label: 'Interested In', value: profile?.interested_in },
    { key: 'interests', label: 'Interests', value: profile?.interests?.length > 0 },
    { key: 'hobbies', label: 'Hobbies', value: profile?.hobbies },
    { key: 'looking_for', label: 'Looking For', value: profile?.looking_for }
  ];

  const completedFields = requiredFields.filter(field => field.value).length;
  const totalFields = requiredFields.length;
  const percentage = Math.round((completedFields / totalFields) * 100);

  return (
    <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800">Profile Completion</h3>
        <span className="text-2xl font-bold text-violet-600">{percentage}%</span>
      </div>
      
      <Progress value={percentage} className="h-3 mb-4" />
      
      <div className="grid grid-cols-2 gap-2">
        {requiredFields.map((field) => (
          <div key={field.key} className="flex items-center gap-2 text-sm">
            {field.value ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={field.value ? 'text-slate-700' : 'text-slate-400'}>
              {field.label}
            </span>
          </div>
        ))}
      </div>

      {percentage < 100 && (
        <p className="text-xs text-slate-500 mt-4 text-center">
          Complete your profile to improve your matches!
        </p>
      )}
    </div>
  );
}