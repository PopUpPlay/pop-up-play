import React from 'react';
import { Heart } from 'lucide-react';

// Calculate compatibility score between two profiles
export const calculateCompatibility = (myProfile, otherProfile) => {
  if (!myProfile || !otherProfile) return 0;
  
  let score = 0;
  let maxScore = 0;

  // Interests match (40% weight)
  if (myProfile.interests?.length > 0 && otherProfile.interests?.length > 0) {
    const myInterests = myProfile.interests.map(i => i.toLowerCase());
    const theirInterests = otherProfile.interests.map(i => i.toLowerCase());
    const commonInterests = myInterests.filter(i => theirInterests.includes(i));
    const interestScore = (commonInterests.length / Math.max(myInterests.length, theirInterests.length)) * 40;
    score += interestScore;
  }
  maxScore += 40;

  // Hobbies similarity (20% weight) - keyword matching
  if (myProfile.hobbies && otherProfile.hobbies) {
    const myHobbies = myProfile.hobbies.toLowerCase().split(/\s+/);
    const theirHobbies = otherProfile.hobbies.toLowerCase().split(/\s+/);
    const commonWords = myHobbies.filter(h => h.length > 3 && theirHobbies.includes(h));
    const hobbyScore = Math.min((commonWords.length / 3) * 20, 20);
    score += hobbyScore;
  }
  maxScore += 20;

  // Looking for compatibility (20% weight) - keyword matching
  if (myProfile.looking_for && otherProfile.looking_for) {
    const myLooking = myProfile.looking_for.toLowerCase().split(/\s+/);
    const theirLooking = otherProfile.looking_for.toLowerCase().split(/\s+/);
    const commonWords = myLooking.filter(l => l.length > 3 && theirLooking.includes(l));
    const lookingScore = Math.min((commonWords.length / 3) * 20, 20);
    score += lookingScore;
  }
  maxScore += 20;

  // Gender preference match (20% weight)
  const genderMatch = checkGenderPreference(myProfile, otherProfile) && 
                      checkGenderPreference(otherProfile, myProfile);
  if (genderMatch) {
    score += 20;
  }
  maxScore += 20;

  return Math.round((score / maxScore) * 100);
};

const checkGenderPreference = (viewer, viewed) => {
  if (!viewer.interested_in || !viewed.gender) return true;
  if (viewer.interested_in === 'everyone') return true;
  if (viewer.interested_in === 'men' && viewed.gender === 'male') return true;
  if (viewer.interested_in === 'women' && viewed.gender === 'female') return true;
  return false;
};

export default function CompatibilityScore({ score }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-emerald-600 bg-emerald-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-slate-600 bg-slate-100';
  };

  const getLabel = () => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Great Match';
    if (score >= 40) return 'Good Match';
    return 'Possible Match';
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getColor()}`}>
      <Heart className="w-3 h-3 fill-current" />
      {score}% {getLabel()}
    </div>
  );
}