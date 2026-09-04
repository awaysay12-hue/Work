import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  Sparkles,
  Tag,
  FileText,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { SystemConfig } from '../types';
import { soundFx } from '../utils/sound';

interface ReleaseVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemConfig: SystemConfig;
  onReleaseVersion: (newVersion: string, releaseNotes: string, exitMaintenance: boolean) => void;
}

export const ReleaseVersionModal: React.FC<ReleaseVersionModalProps> = ({
  isOpen,
  onClose,
  systemConfig,
  onReleaseVersion,
}) => {
  // Suggest next minor version automatically (e.g. v2.5.0 -> v2.6.0)
  const calculateNextVersion = (current: string) => {
    const clean = current.replace(/^[vV]/, '');
    const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
    if (parts.length >= 2) {
      parts[1] += 1;
      parts[2] = 0;
      return `v${parts.join('.')}`;
    }
    return `${current}-update`;
  };

  const [versionInput, setVersionInput] = useState<string>(() =>
    calculateNextVersion(systemConfig.currentVersion || 'v2.5.0')
  );
  const [releaseNotes, setReleaseNotes] = useState<string>(
    'ពង្រឹងសុវត្ថិភាពគណនីបុគ្គល (User Privacy Isolation), បង្កើនល្បឿនប្រព័ន្ធ និងរៀបចំមុខងារ Auto-login ឯកជន'
  );
  const [exitMaintenance, setExitMaintenance] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!versionInput.trim()) return;

    soundFx.playCelebration();
    setIsSubmitting(true);

    setTimeout(() => {
      onReleaseVersion(versionInput.trim(), releaseNotes.trim(), exitMaintenance);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const presetNotes = [
    'ពង្រឹងសុវត្ថិភាពគណនីបុគ្គល (User Account Privacy)',
    'កែលម្អប្រព័ន្ធ Auto-login ឯកជនលើឧបករណ៍',
    'កែលម្អល្បឿន និង UI ទូទៅឱ្យកាន់តែរលូន',
    'ជួសជុលបញ្ហាបច្ចេកទេស និងបន្ថែមមុខងារថ្មីៗ',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-in">
        {/* Modal Top Ribbon */}
        <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 ring-2 ring-white/20">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>បញ្ចេញ Version ថ្មី (Update to New Version)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/30">
                    SUPER ADMIN
                  </span>
                </h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  ធ្វើបច្ចុប្បន្នភាពកំណែប្រព័ន្ធ និងបើកឱ្យ User ទាំងអស់ចូលប្រើប្រាស់
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Current vs New Version Badge Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Version បច្ចុប្បន្ន
              </span>
              <span className="text-sm font-black font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                {systemConfig.currentVersion || 'v2.5.0'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-600 block mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Version ថ្មីដែលត្រូវបញ្ចេញ</span>
              </span>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  placeholder="ឧ. v2.6.0"
                  className="w-full px-2.5 py-1 text-sm font-black font-mono text-indigo-700 bg-indigo-50/70 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Version Increment Helpers */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-[11px] font-medium">ជម្រើសរហ័ស៖</span>
            <button
              type="button"
              onClick={() => setVersionInput(calculateNextVersion(systemConfig.currentVersion))}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer"
            >
              +0.1 (Minor)
            </button>
            <button
              type="button"
              onClick={() => {
                const clean = systemConfig.currentVersion.replace(/^[vV]/, '');
                const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
                if (parts.length >= 3) {
                  parts[2] += 1;
                  setVersionInput(`v${parts.join('.')}`);
                }
              }}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer"
            >
              +0.0.1 (Patch)
            </button>
          </div>

          {/* Release Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>កំណត់សម្គាល់ការកែប្រែ (Release Notes)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">បង្ហាញជូនអ្នកប្រើប្រាស់</span>
            </label>
            <textarea
              rows={3}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="រៀបរាប់ពីការកែប្រែក្នុងកំណែថ្មីនេះ..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {presetNotes.map((note, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReleaseNotes((prev) => (prev ? `${prev}, ${note}` : note));
                    soundFx.playClick();
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  + {note}
                </button>
              ))}
            </div>
          </div>

          {/* Maintenance Mode Toggle Checkbox */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={exitMaintenance}
                onChange={(e) => setExitMaintenance(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-900 block">
                  បញ្ចប់ការកែប្រែ និងបើកឱ្យ User ទាំងអស់ចូលប្រើប្រាស់វិញភ្លាមៗ
                </span>
                <span className="text-emerald-700 text-[11px] block mt-0.5">
                  បិទ Maintenance Mode ដើម្បីឱ្យ User ទាំងអស់អាចចូលមើល និងប្រើប្រាស់ Version ថ្មីនេះបាន។
                </span>
              </div>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              បោះបង់
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Rocket className="w-4 h-4" />
              <span>{isSubmitting ? 'កំពុងបញ្ចេញ...' : '🚀 បញ្ចេញ Version ថ្មីភ្លាមៗ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
