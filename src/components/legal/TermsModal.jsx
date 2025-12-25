import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function TermsModal({ onAccept, isLoading }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-rose-50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Age Verification & Terms</h2>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-4 text-slate-700">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Age Requirement
              </h3>
              <p className="text-sm text-amber-800">
                You must be <strong>18 years of age or older</strong> to use Popup-play.com. 
                By continuing, you confirm that you meet this age requirement.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Prohibited Activities
              </h3>
              <p className="text-sm text-red-800 mb-2">
                <strong>Popup-play.com is NOT intended for prostitution or any activities involving 
                the solicitation of individuals for sex.</strong>
              </p>
              <p className="text-sm text-red-800">
                Soliciting sex is illegal and subject to legal penalties. Any users found engaging 
                in such activities will be immediately banned and reported to authorities.
              </p>
            </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <h3 className="font-semibold text-violet-900 mb-2">Purpose of Service</h3>
              <p className="text-sm text-violet-800">
                Popup-play.com is a social connection platform designed for meeting new people, 
                making friends, and building genuine social connections in your area.
              </p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Checkbox
                id="terms-agree"
                checked={agreed}
                onCheckedChange={setAgreed}
                className="mt-1 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <label
                htmlFor="terms-agree"
                className="text-sm text-slate-700 cursor-pointer leading-relaxed"
              >
                I confirm that I am <strong>18 years of age or older</strong>, and I understand that 
                Popup-play.com is not intended for prostitution or solicitation of sex. I agree to 
                use this platform for legitimate social connections only.
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <Button
            onClick={onAccept}
            disabled={!agreed || isLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 h-12 text-base font-semibold rounded-xl text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-white" />
                I Agree - Continue to Popup-play.com
              </span>
            )}
          </Button>
          <p className="text-xs text-slate-500 text-center mt-3">
            By clicking continue, you accept our terms and conditions
          </p>
        </div>
      </motion.div>
    </div>
  );
}