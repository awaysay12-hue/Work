import React, { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Lock,
  ArrowRight,
  LogOut,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { SystemConfig, UserAccount } from '../types';
import { soundFx } from '../utils/sound';

interface SystemMaintenanceScreenProps {
  systemConfig: SystemConfig;
  currentUser?: UserAccount;
  onRefreshStatus: () => void;
  onOpenAdminLogin: () => void;
  onLogout?: () => void;
}

export const SystemMaintenanceScreen: React.FC<SystemMaintenanceScreenProps> = ({
  systemConfig,
  currentUser,
  onRefreshStatus,
  onOpenAdminLogin,
  onLogout,
}) => {
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const handleCheck = () => {
    soundFx.playClick();
    setIsChecking(true);
    setCheckResult(null);

    setTimeout(() => {
      onRefreshStatus();
      setIsChecking(false);
      setCheckResult('ប្រព័ន្ធកំពុងស្ថិតក្នុងការកែប្រែនៅឡើយ... សូមរង់ចាំបន្តិចទៀត');
      setTimeout(() => setCheckResult(null), 4000);
    }, 700);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden antialiased select-none">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 left-10 w-80 h-80 bg-rose-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header info */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-white/20">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider uppercase text-amber-400 block leading-tight">
              TaskMate KH
            </span>
            <span className="text-[11px] text-slate-400">ប្រព័ន្ធគ្រប់គ្រងការងារប្រចាំថ្ងៃ</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
            {systemConfig.currentVersion || 'v2.5.0'}
          </span>
        </div>
      </div>

      {/* Main Maintenance Card */}
      <div className="w-full max-w-lg my-auto z-10 text-center py-8">
        {/* Animated Badge & Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/40 flex items-center justify-center shadow-2xl">
            <Wrench className="w-12 h-12 text-amber-400 animate-bounce" />
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-orange-600 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Super Admin កំពុងកែប្រែប្រព័ន្ធ (Maintenance Mode)</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          ប្រព័ន្ធកំពុងកែលម្អ និងរៀបចំ Version ថ្មី
        </h1>

        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
          {systemConfig.maintenanceReason ||
            'Super Admin កំពុងកែសម្រួលមុខងារ និងធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធ។ រាល់ព័ត៌មានត្រូវបានការពារសុវត្ថិភាព។ សូមរង់ចាំការបញ្ចេញកំណែ Version ថ្មីក្នុងពេលបន្តិចទៀតនេះ!'}
        </p>

        {/* Status Indicator Card */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md mb-6 max-w-sm mx-auto text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>ស្ថានភាពបច្ចុប្បន្ន៖</span>
            </span>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>កំពុងកែប្រែ (In Progress)</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
            <div className="flex justify-between">
              <span>អ្នកទទួលបន្ទុក៖</span>
              <span className="text-slate-200 font-semibold">{systemConfig.maintenanceStartedBy || 'Super Admin'}</span>
            </div>
            <div className="flex justify-between">
              <span>សិទ្ធិមើលទិន្នន័យ៖</span>
              <span className="text-rose-400 font-bold">User ទាំងអស់មិនអាចមើលឃើញទេ</span>
            </div>
            {systemConfig.lastUpdated && (
              <div className="flex justify-between">
                <span>កាលបរិច្ឆេទ៖</span>
                <span className="text-slate-300 font-mono">{systemConfig.lastUpdated}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
          <button
            onClick={handleCheck}
            disabled={isChecking}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'កំពុងពិនិត្យ...' : 'ពិនិត្យស្ថានភាពម្តងទៀត'}</span>
          </button>

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs sm:text-sm font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>ចាកចេញ (Log Out)</span>
            </button>
          )}
        </div>

        {checkResult && (
          <p className="text-xs text-amber-300 mt-3 animate-fade-in font-medium">
            {checkResult}
          </p>
        )}
      </div>

      {/* Footer Super Admin Entry link */}
      <div className="w-full max-w-md text-center z-10 pb-4">
        <button
          onClick={() => {
            soundFx.playClick();
            onOpenAdminLogin();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-amber-400" />
          <span>តើលោកអ្នកជា Super Admin? ចុចទីនេះដើម្បីចូលគ្រប់គ្រង</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </div>
  );
};
