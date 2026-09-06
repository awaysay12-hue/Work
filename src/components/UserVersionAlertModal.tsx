import React from 'react';
import {
  Rocket,
  Sparkles,
  CheckCircle2,
  Zap,
  ArrowRight,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import { SystemConfig } from '../types';
import { soundFx } from '../utils/sound';

interface UserVersionAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemConfig: SystemConfig;
  onAcceptUpdate?: () => void;
}

export const UserVersionAlertModal: React.FC<UserVersionAlertModalProps> = ({
  isOpen,
  onClose,
  systemConfig,
  onAcceptUpdate,
}) => {
  if (!isOpen) return null;

  const handleUpdateNow = () => {
    soundFx.playCelebration();
    if (onAcceptUpdate) {
      onAcceptUpdate();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-in">
        {/* Top Header Card */}
        <div className="px-6 pt-7 pb-6 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white relative text-center">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Animated Rocket Icon */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl blur-md animate-pulse opacity-70" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center shadow-xl ring-4 ring-white/20">
                <Rocket className="w-8 h-8 text-white animate-bounce" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>កំណែថ្មី {systemConfig.currentVersion || 'v2.6.0'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Super Admin បានដាក់ឱ្យប្រើ Version ថ្មី!
            </h2>
            <p className="text-xs text-indigo-200/90 mt-1 max-w-xs mx-auto">
              ប្រព័ន្ធត្រូវបានកែលម្អមុខងារ បង្កើនល្បឿន និងពង្រឹងសុវត្ថិភាពទិន្នន័យ។
            </p>
          </div>
        </div>

        {/* Release Notes Details */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-indigo-600" />
              <span>ព័ត៌មានលម្អិតនៃកំណែថ្មី (What's New)</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              {systemConfig.releaseNotes ||
                'ពង្រឹងសុវត្ថិភាពគណនីបុគ្គល (User Account Privacy), បង្កើនល្បឿនប្រព័ន្ធ និងរៀបចំមុខងារ Auto-login ឯកជន'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold leading-tight">សុវត្ថិភាពខ្ពស់ 100%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-semibold leading-tight">ល្បឿនលឿន & រលូន</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 space-y-2">
            <button
              onClick={handleUpdateNow}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group active:scale-98"
            >
              <span>ទទួលយក Version ថ្មីឥឡូវនេះ</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              បិទផ្ទាំងនេះ (Dismiss)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
