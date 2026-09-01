import React from 'react';
import { BellRing, Check, Clock, X, Timer, Play } from 'lucide-react';
import { Task } from '../types';
import { formatKhmerTime } from '../utils/khmerDates';
import { CATEGORIES_CONFIG } from '../utils/translations';

interface ReminderAlertBannerProps {
  alerts: Task[];
  onComplete: (task: Task) => void;
  onSnooze: (taskId: string, minutes: number) => void;
  onDismiss: (taskId: string) => void;
  onStartFocusTimer: (task: Task) => void;
}

export const ReminderAlertBanner: React.FC<ReminderAlertBannerProps> = ({
  alerts,
  onComplete,
  onSnooze,
  onDismiss,
  onStartFocusTimer,
}) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-5 z-50 max-w-sm sm:max-w-md w-auto sm:w-full space-y-2.5 pointer-events-none">
      {alerts.slice(0, 3).map((task) => {
        const cat = CATEGORIES_CONFIG[task.category] || CATEGORIES_CONFIG.other;

        return (
          <div
            key={task.id}
            id={`reminder-alert-${task.id}`}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 sm:p-4 shadow-2xl border border-indigo-500/40 ring-2 sm:ring-4 ring-indigo-500/20 animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <BellRing className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase">
                      ⏰ ដល់ម៉ោងរំលឹក
                    </span>
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {cat.labelKm}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5 leading-snug truncate">
                    {task.title}
                  </h4>
                  {task.dueTime && (
                    <p className="text-[11px] sm:text-xs text-slate-300 flex items-center mt-0.5">
                      <Clock className="w-3 h-3 mr-1 text-indigo-400 shrink-0" />
                      កាលកំណត់៖ {formatKhmerTime(task.dueTime)}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDismiss(task.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                title="បិទការរំលឹក"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5 pt-2 border-t border-slate-800 text-[11px] sm:text-xs">
              <button
                onClick={() => onComplete(task)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>បានរួចរាល់</span>
              </button>

              <button
                onClick={() => onStartFocusTimer(task)}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>ផ្ដោត</span>
              </button>

              <button
                onClick={() => onSnooze(task.id, 5)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
              >
                ពន្យារ ៥ន
              </button>

              <button
                onClick={() => onSnooze(task.id, 15)}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors hidden xs:inline-block"
              >
                ពន្យារ ១៥ន
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
