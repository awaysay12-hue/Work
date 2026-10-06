import React from 'react';
import {
  Timer,
  Filter,
  CheckCircle2,
  Sparkles,
  Flame,
} from 'lucide-react';
import { UserAccount, Task, DailyStreak } from '../types';
import { ROLE_CONFIGS } from '../utils/userPermissions';
import { toKhmerNumber } from '../utils/translations';
import { getTodayDateString } from '../utils/khmerDates';

interface PersonalUserBannerProps {
  currentUser: UserAccount;
  tasks: Task[];
  streak: DailyStreak;
  onFilterMyTasks: () => void;
  onFilterAllTasks: () => void;
  isMyTasksActive: boolean;
  onStartFocusTimer?: (task?: Task) => void;
}

export const PersonalUserBanner: React.FC<PersonalUserBannerProps> = ({
  currentUser,
  tasks,
  streak,
  onFilterMyTasks,
  onFilterAllTasks,
  isMyTasksActive,
  onStartFocusTimer,
}) => {
  const roleCfg = ROLE_CONFIGS[currentUser.role] || ROLE_CONFIGS.member;
  const isViewer = currentUser.role === 'viewer';

  const myTasks = tasks.filter(
    (t) => t.assigneeId === currentUser.id || t.creatorId === currentUser.id
  );
  const myPendingCount = myTasks.filter((t) => !t.completed).length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 p-3.5 sm:p-4 shadow-sm card-colorful-hover transition-all">
      {/* Decorative gradient aura */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400/20 via-purple-400/20 to-pink-400/20 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10">
        {/* Left: User Identity & Clean Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-md group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
              {currentUser.avatarInitial || currentUser.khmerName?.slice(0, 1) || 'U'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate leading-snug flex items-center gap-1.5">
                <span>សូមស្វាគមន៍, {currentUser.khmerName}</span>
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              </h2>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
              >
                {roleCfg.titleKh}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-indigo-700 dark:text-indigo-300">{currentUser.department || 'ទូទៅ'}</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {isViewer
                  ? 'របៀបអានប៉ុណ្ណោះ (Read-Only Mode)'
                  : `កិច្ចការផ្ទាល់ខ្លួនកំពុងដំណើរការ ${toKhmerNumber(myPendingCount)}`}
              </span>
              {streak.currentStreak > 0 && (
                <>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500 animate-bounce" />
                    <span>{toKhmerNumber(streak.currentStreak)} ថ្ងៃបន្តបន្ទាប់</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {!isViewer && (
            <button
              type="button"
              onClick={isMyTasksActive ? onFilterAllTasks : onFilterMyTasks}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
                isMyTasksActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-300'
              }`}
            >
              <Filter className={`w-3.5 h-3.5 ${isMyTasksActive ? 'text-white' : 'text-indigo-500'}`} />
              <span>{isMyTasksActive ? 'បង្ហាញកិច្ចការខ្ញុំ' : 'បង្ហាញទាំងអស់'}</span>
            </button>
          )}

          {onStartFocusTimer && (
            <button
              type="button"
              onClick={() => onStartFocusTimer()}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white shadow-sm hover:shadow-orange-500/25 hover:scale-105 active:scale-95"
            >
              <Timer className="w-3.5 h-3.5 animate-pulse" />
              <span>ផ្ដោតអារម្មណ៍</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
