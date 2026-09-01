import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Vibrate,
  ShieldCheck,
  Timer,
  Play,
  X,
  ExternalLink,
  Sparkles,
  Info,
  Radio,
  Lock,
} from 'lucide-react';
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
  scheduleLockScreenTestNotification,
  sendBrowserNotification,
  isNotificationSupported,
} from '../utils/notifications';
import { soundFx } from '../utils/sound';

interface PhoneNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhoneNotificationModal: React.FC<PhoneNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isCountingDown, setIsCountingDown] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(5);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPermissionStatus(getNotificationPermissionStatus());
    }
  }, [isOpen]);

  // Handle countdown for Lock Screen test
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCountingDown && countdownSeconds > 0) {
      timer = setTimeout(() => {
        setCountdownSeconds((prev) => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdownSeconds === 0) {
      setIsCountingDown(false);
      setCountdownSeconds(5);
      setSuccessMsg('បានបញ្ជូន Notification ទៅកាន់ Lock Screen រួចរាល់! 🔔✨');
    }
    return () => clearTimeout(timer);
  }, [isCountingDown, countdownSeconds]);

  if (!isOpen) return null;

  const handleEnablePermission = async () => {
    soundFx.playClick();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const status = await requestNotificationPermission();
      setPermissionStatus(status);
      if (status === 'granted') {
        soundFx.playCelebration();
        setSuccessMsg('បានបើកសិទ្ធិ Notification លើទូរស័ព្ទជោគជ័យ! 🎉');
        // Trigger a test greeting notification
        sendBrowserNotification(
          '🔔 សិទ្ធិ Notification បានបើករួចរាល់!',
          'ឥឡូវនេះលោកអ្នកនឹងទទួលបានការរំលឹកកិច្ចការទោះបីជាចាក់សោអេក្រង់ទូរស័ព្ទ (Lock Screen) ក៏ដោយ! ✨'
        );
      } else if (status === 'denied') {
        soundFx.playAlert();
        setErrorMsg('សិទ្ធិ Notification ត្រូវបានបដិសេធ (Blocked)។ សូមចូលទៅកាន់ Browser Settings ដើម្បីបើកសិទ្ធិឡើងវិញ។');
      }
    } catch {
      setErrorMsg('មានបញ្ហាក្នុងការបើកសិទ្ធិ Notification');
    }
  };

  const handleInstantTest = async () => {
    soundFx.playClick();
    setErrorMsg('');
    setSuccessMsg('');

    if (permissionStatus !== 'granted') {
      await handleEnablePermission();
      return;
    }

    soundFx.playReminderChime();
    await sendBrowserNotification(
      '🔔 សាកល្បង Notification លើទូរស័ព្ទ',
      'ប្រព័ន្ធរំលឹកកិច្ចការកំពុងដំណើរការយ៉ាងល្អ! សំឡេង និងរំញ័រត្រូវបានបើក។ ⚡',
      undefined,
      {
        tag: 'test-notify-' + Date.now(),
        vibrate: [300, 150, 300, 150, 300],
        requireInteraction: true,
      }
    );
    setSuccessMsg('បានបញ្ជូន Notification សាកល្បងភ្លាមៗរួចរាល់!');
  };

  const handleLockScreenCountdownTest = async () => {
    soundFx.playClick();
    setErrorMsg('');
    setSuccessMsg('');

    if (permissionStatus !== 'granted') {
      const status = await requestNotificationPermission();
      setPermissionStatus(status);
      if (status !== 'granted') {
        setErrorMsg('សូមបើកសិទ្ធិ Notification ជាមុនសិន');
        return;
      }
    }

    setIsCountingDown(true);
    setCountdownSeconds(5);
    scheduleLockScreenTestNotification(5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto transition-all animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-scale-in">
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-2 ring-white/20 shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Notification លើទូរស័ព្ទ (Lock Screen)</span>
                </h2>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  ទទួលការរំលឹកកិច្ចការទោះពេល Lock Screen & Background
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              permissionStatus === 'granted'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : permissionStatus === 'denied'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {permissionStatus === 'granted' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : permissionStatus === 'denied' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <Radio className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
              )}
              <div>
                <span className="text-xs font-bold block">
                  {permissionStatus === 'granted'
                    ? 'ស្ថានភាព៖ បានបើកដំណើរការ (Active)'
                    : permissionStatus === 'denied'
                    ? 'ស្ថានភាព៖ ត្រូវបានបដិសេធ (Blocked)'
                    : 'ស្ថានភាព៖ មិនទាន់បានបើក (Need Permission)'}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {permissionStatus === 'granted'
                    ? 'Notification និងរំញ័រលើទូរស័ព្ទរួចរាល់សម្រាប់ការរំលឹក'
                    : 'សូមចុចប៊ូតុងខាងក្រោមដើម្បីបើកការរំលឹកលើទូរស័ព្ទ'}
                </span>
              </div>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleEnablePermission}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm cursor-pointer"
              >
                បើកសិទ្ធិ
              </button>
            )}
          </div>

          {/* Feedback message */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Testing Action Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 block">
              សាកល្បងដំណើរការ Notification (Interactive Testing)
            </span>

            {/* Test 1: Countdown for Lock Screen */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      តេស្តលើ Lock Screen (រាប់ថយក្រោយ ៥ វិនាទី)
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-200/80 mt-1">
                    ចុចប៊ូតុងនេះ រួចចុចបិទ/ចាក់សោអេក្រង់ទូរស័ព្ទ (Lock Screen) ដើម្បីមើលការបង្ហាញលើផ្ទាំងចាក់សោ!
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isCountingDown}
                  onClick={handleLockScreenCountdownTest}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-700/50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer transition-all"
                >
                  {isCountingDown ? (
                    <>
                      <Timer className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{countdownSeconds} វិនាទី...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>តេស្ត Lock Screen</span>
                    </>
                  )}
                </button>
              </div>

              {isCountingDown && (
                <div className="mt-3 p-2.5 bg-amber-400/20 border border-amber-400/30 rounded-xl text-[11px] text-amber-200 flex items-center gap-2 animate-pulse">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>
                    👉 <strong>សូមចុច Lock អេក្រង់ទូរស័ព្ទរបស់អ្នកឥឡូវនេះ!</strong> Notification នឹងលោតឡើងក្នុងពេល {countdownSeconds} វិនាទីទៀត។
                  </span>
                </div>
              )}
            </div>

            {/* Test 2: Instant Test */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">សាកល្បង Notification ភ្លាមៗ</span>
                  <span className="text-[11px] text-slate-500">តេស្តសំឡេង Chime និងរំញ័រ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInstantTest}
                className="px-3 py-1.5 bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                តេស្តភ្លាមៗ
              </button>
            </div>
          </div>

          {/* Instructions for Phone Lock Screen settings */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>ការណែនាំដើម្បីឱ្យ Notification បង្ហាញលើ Lock Screen ទូរស័ព្ទ៖</span>
            </span>

            <div className="space-y-2 text-[11px] text-slate-600">
              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  <strong>សម្រាប់ Android (Chrome / Brave / Samsung Internet)៖</strong> ចូលទៅកាន់ Phone <strong>Settings</strong> ➔ <strong>Notifications</strong> ➔ <strong>Lock screen notifications</strong> ➔ ជ្រើសរើសយក <strong>"Show all content"</strong>។
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  <strong>សម្រាប់ iPhone / iOS (Safari)៖</strong> ចុចលើប៊ូតុង Share (សញ្ញាព្រួញឡើងលើ) ➔ ជ្រើសរើស <strong>"Add to Home Screen"</strong> (បញ្ចូលទៅអេក្រង់ដើម) ➔ បើក App ពី Home Screen ដើម្បីទទួលបាន Push Notification ពេល Lock Screen ពេញលេញ។
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p>
                  <strong>ប្រព័ន្ធរំញ័រ (Vibration)៖</strong> ប្រព័ន្ធនឹងរំញ័រទូរស័ព្ទជាចង្វាក់ (Vibrate Pattern) ដោយស្វ័យប្រវត្តិនៅពេលដល់ម៉ោងរំលឹកកិច្ចការ។
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            យល់ព្រម & រួចរាល់
          </button>
        </div>
      </div>
    </div>
  );
};
