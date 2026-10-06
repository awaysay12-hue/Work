import React from 'react';
import {
  Timer,
  Play,
  Flame,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Task, DailyStreak, UserAccount } from '../types';
import { toKhmerNumber } from '../utils/translations';
import { getTodayDateString } from '../utils/khmerDates';
import { UserAvatar } from './UserAvatar';

interface RightSidebarWidgetsProps {
  tasks: Task[];
  streak: DailyStreak;
  onToggleComplete: (task: Task) => void;
  onStartFocusTimer: (task: Task) => void;
  onOpenNewTask: () => void;
  users?: UserAccount[];
  currentUser?: UserAccount;
  onFilterAssignee?: (userId: string) => void;
  activeAssigneeId?: string;
  onOpenTodaySummary?: () => void;
}

export const RightSidebarWidgets: React.FC<RightSidebarWidgetsProps> = ({
  tasks,
  streak,
  onToggleComplete,
  onStartFocusTimer,
  onOpenNewTask,
  users = [],
  currentUser,
  onFilterAssignee,
  activeAssigneeId,
  onOpenTodaySummary,
}) => {
  const todayStr = getTodayDateString();
  const activeTasks = tasks.filter((t) => !t.archived && !t.completed);

  // Urgent and high-priority tasks requiring immediate attention
  const urgentQueue = activeTasks
    .filter((t) => t.priority === 'urgent' || t.priority === 'high' || t.dueDate <= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* 1. Deep Focus Session Card with Radiant Gradient & Glow */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/25 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-purple-950/25 p-4 sm:p-5 rounded-2xl border border-amber-200/80 dark:border-slate-800 shadow-sm card-colorful-hover transition-all">
        {/* Soft decorative blur */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400/20 to-purple-400/20 blur-xl pointer-events-none" />

        <div className="relative flex items-center justify-between mb-3.5 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
              <Timer className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-1.5">
                <span>សម័យផ្ដោតការងារ</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Focus & Pomodoro Flow</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-300/80 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
            <span className="text-xs font-black font-mono tabular-nums">
              {toKhmerNumber(streak.currentStreak)} ថ្ងៃ
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs border border-amber-100 dark:border-slate-800 text-center mb-3.5 shadow-2xs">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium block">ម៉ោងផ្ដោតសរុប</span>
            <span className="text-base font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-mono tabular-nums">
              {toKhmerNumber(streak.totalFocusMinutesAllTime)} នាទី
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium block">កិច្ចការសម្រេច</span>
            <span className="text-base font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent font-mono tabular-nums">
              {toKhmerNumber(streak.totalCompletedAllTime)}
            </span>
          </div>
        </div>

        {urgentQueue.length > 0 ? (
          <button
            type="button"
            onClick={() => onStartFocusTimer(urgentQueue[0])}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>ផ្ដើមផ្ដោតកិច្ចការបន្ទាន់ (២៥ នាទី)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenNewTask}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>បន្ថែមភារកិច្ចថ្មី</span>
          </button>
        )}
      </div>

      {/* 2. Team Workload & Allocation with Vibrant Row Hover */}
      {users && users.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card-colorful-hover transition-all">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                  ការងារតាមសមាជិក
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Team Allocation</p>
              </div>
            </div>

            {onFilterAssignee && activeAssigneeId && (
              <button
                type="button"
                onClick={() => onFilterAssignee('all')}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer"
              >
                បង្ហាញទាំងអស់
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {users.map((u) => {
              const uTasks = activeTasks.filter(
                (t) => t.assigneeId === u.id || t.creatorId === u.id
              );
              const isSelected = activeAssigneeId === u.id;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onFilterAssignee?.(isSelected ? 'all' : u.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/60 dark:to-purple-950/60 border border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:translate-x-1 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="ring-2 ring-indigo-400/30 rounded-full p-0.5">
                      <UserAvatar
                        avatarUrl={u.avatarUrl}
                        avatarColor={u.avatarColor}
                        avatarInitial={u.avatarInitial}
                        name={u.khmerName || u.name}
                        size="xs"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">
                        {u.khmerName || u.name}
                      </p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                        {u.department}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black font-mono tabular-nums px-2.5 py-0.5 rounded-full shrink-0 transition-transform group-hover:scale-110 ${
                      uTasks.length > 0
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {toKhmerNumber(uTasks.length)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Category Breakdown Widget with Vibrant Animated Gradient Bars */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card-colorful-hover transition-all">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                ប្រភេទការងារចម្បង
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Categories Distribution</p>
            </div>
          </div>
          <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
            {toKhmerNumber(activeTasks.length)} ភារកិច្ច
          </span>
        </div>

        <div className="space-y-3">
          {[
            { id: 'work', nameKm: 'រដ្ឋបាល & ការងារទូទៅ', gradient: 'from-indigo-500 via-purple-500 to-indigo-600', dotBg: 'bg-indigo-500' },
            { id: 'project', nameKm: 'គម្រោង & អភិវឌ្ឍន៍', gradient: 'from-sky-400 via-cyan-500 to-blue-600', dotBg: 'bg-sky-500' },
            { id: 'it', nameKm: 'IT Support & បច្ចេកវិទ្យា', gradient: 'from-emerald-400 via-teal-500 to-green-600', dotBg: 'bg-emerald-500' },
            { id: 'meeting', nameKm: 'កិច្ចប្រជុំ & សិក្ខាសាលា', gradient: 'from-amber-400 via-orange-500 to-red-500', dotBg: 'bg-amber-500' },
            { id: 'personal', nameKm: 'ផ្ទាល់ខ្លួន', gradient: 'from-fuchsia-500 via-pink-500 to-purple-600', dotBg: 'bg-fuchsia-500' },
          ].map((cat) => {
            const count = activeTasks.filter((t) => t.category === cat.id).length;
            const pct = activeTasks.length > 0 ? Math.round((count / activeTasks.length) * 100) : 0;
            return (
              <div key={cat.id} className="group">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 truncate flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cat.dotBg} group-hover:scale-125 transition-transform`} />
                    <span>{cat.nameKm}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono">
                    <span className="font-black text-slate-800 dark:text-slate-200">{toKhmerNumber(count)}</span>
                    <span className="text-[10px] text-slate-400">({toKhmerNumber(pct)}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.gradient} transition-all duration-500 ease-out`}
                    style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
