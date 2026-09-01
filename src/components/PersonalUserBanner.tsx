import React from 'react';
import {
  UserCheck,
  Eye,
  CheckCircle2,
  Clock,
  Flame,
  ShieldAlert,
  Sparkles,
  Timer,
  Layers,
  Filter,
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
  const todayStr = getTodayDateString();
  const roleCfg = ROLE_CONFIGS[currentUser.role] || ROLE_CONFIGS.member;

  // Filter tasks assigned to current user or created by current user
  const myTasks = tasks.filter(
    (t) => t.assigneeId === currentUser.id || t.creatorId === currentUser.id
  );
  const myPendingToday = myTasks.filter((t) => t.dueDate === todayStr && !t.completed);
  const myCompletedTotal = myTasks.filter((t) => t.completed).length;
  const myTotalCount = myTasks.length;

  const isViewer = currentUser.role === 'viewer';
  const isMember = currentUser.role === 'member';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 shadow-lg border border-indigo-800/40">
      {/* Decorative radial lighting */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Greeting, Role & Description */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isViewer ? 'ទិដ្ឋភាពអ្នកមើល (Read-Only Mode)' : 'ផ្ទាំងការងារផ្ទាល់ខ្លួន (Personal Workspace)'}
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}>
              {roleCfg.titleKh}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>សូមស្វាគមន៍, {currentUser.khmerName}</span>
            <span className="text-xs font-normal text-indigo-300">({currentUser.department})</span>
          </h3>

          <p className="text-xs text-indigo-200/80 max-w-xl leading-relaxed">
            {isViewer
              ? 'គណនីរបស់អ្នកមានសិទ្ធិមើលកិច្ចការ និងស្ថិតិវឌ្ឍនភាពទូទៅក្នុងប្រព័ន្ធ (មិនអាចកែប្រែ ឬលុបបានទេ)។'
              : 'ផ្ដោតលើការសម្រេចកិច្ចការដែលបានចាត់តាំងឱ្យអ្នកប្រចាំថ្ងៃ និងតាមដានវឌ្ឍនភាពផ្ទាល់ខ្លួន។'}
          </p>
        </div>

        {/* Right Column: Quick Stats & View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Quick Stat: My Assigned */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center min-w-[76px]">
            <p className="text-[10px] text-indigo-200 uppercase font-semibold">កិច្ចការខ្ញុំ</p>
            <p className="text-base font-black text-white">{toKhmerNumber(myTotalCount)}</p>
          </div>

          {/* Quick Stat: Due Today */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center min-w-[76px]">
            <p className="text-[10px] text-amber-300 uppercase font-semibold">ថ្ងៃនេះ</p>
            <p className="text-base font-black text-amber-400">{toKhmerNumber(myPendingToday.length)}</p>
          </div>

          {/* Quick Stat: Completed */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 px-3 py-2 rounded-xl text-center min-w-[76px]">
            <p className="text-[10px] text-emerald-300 uppercase font-semibold">បានរួចរាល់</p>
            <p className="text-base font-black text-emerald-400">{toKhmerNumber(myCompletedTotal)}</p>
          </div>

          {/* Start Focus Mode Button for personal productivity */}
          {onStartFocusTimer && (
            <button
              onClick={() => onStartFocusTimer()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25"
              title="ចាប់ផ្តើមម៉ោងផ្តោតអារម្មណ៍ធ្វើការងារ (Focus Timer)"
            >
              <Timer className="w-3.5 h-3.5 text-amber-300" />
              <span>ម៉ោងផ្ដោតអារម្មណ៍</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
