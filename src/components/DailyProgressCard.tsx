import React, { useMemo } from 'react';
import { FileText, Smartphone, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Task, DailyStreak } from '../types';
import { getTodayDateString } from '../utils/khmerDates';
import { toKhmerNumber } from '../utils/translations';

interface DailyProgressCardProps {
  tasks: Task[];
  streak: DailyStreak;
  onViewAnalytics?: () => void;
  onOpenTodaySummary?: () => void;
  onOpenPhoneNotificationModal?: () => void;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = ({
  tasks,
  streak,
  onViewAnalytics,
  onOpenTodaySummary,
  onOpenPhoneNotificationModal,
}) => {
  const todayStr = getTodayDateString();

  const { totalCount, pendingCount, completedCount, overdueCount, todayCount, todayCompleted } = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => !t.completed && t.dueDate < todayStr).length;

    const tTasks = tasks.filter((t) => t.dueDate === todayStr);
    const tCompleted = tTasks.filter((t) => t.completed).length;

    return {
      totalCount: total,
      pendingCount: pending,
      completedCount: completed,
      overdueCount: overdue,
      todayCount: tTasks.length,
      todayCompleted: tCompleted,
    };
  }, [tasks, todayStr]);

  const todayRate = todayCount > 0 ? Math.round((todayCompleted / todayCount) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Tasks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <p className="text-xs font-bold text-slate-500 mb-1">ភារកិច្ចសរុប</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-800">
              {toKhmerNumber(String(totalCount).padStart(2, '0'))}
            </h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
              សកម្ម
            </span>
          </div>
        </div>

        {/* 2. In Progress */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-200 transition-colors">
          <p className="text-xs font-bold text-slate-500 mb-1">កំពុងដំណើរការ</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-indigo-600">
              {toKhmerNumber(String(pendingCount).padStart(2, '0'))}
            </h3>
            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
              ទៀងទាត់
            </span>
          </div>
        </div>

        {/* 3. Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-200 transition-colors">
          <p className="text-xs font-bold text-slate-500 mb-1">បានបញ្ចប់</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-emerald-500">
              {toKhmerNumber(String(completedCount).padStart(2, '0'))}
            </h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
              ជោគជ័យ
            </span>
          </div>
        </div>

        {/* 4. Overdue / Urgent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-200 transition-colors">
          <p className="text-xs font-bold text-slate-500 mb-1">យឺតយ៉ាវ / ហួសកំណត់</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-rose-500">
              {toKhmerNumber(String(overdueCount).padStart(2, '0'))}
            </h3>
            <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-bold">
              {overdueCount > 0 ? 'បន្ទាន់' : 'គ្មាន'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Ribbon: Today's Summary & Phone Notification Lockscreen */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/60 rounded-2xl border border-indigo-100">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
          <span className="font-bold text-slate-800">
            វឌ្ឍនភាពថ្ងៃនេះ៖ {toKhmerNumber(todayCompleted)}/{toKhmerNumber(todayCount)} ({toKhmerNumber(todayRate)}%)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTodaySummary && (
            <button
              type="button"
              onClick={onOpenTodaySummary}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>សរុបរបាយការណ៍ថ្ងៃនេះ</span>
            </button>
          )}

          {onOpenPhoneNotificationModal && (
            <button
              type="button"
              onClick={onOpenPhoneNotificationModal}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="បើក Notification លើទូរស័ព្ទ & Lock Screen"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Notification Lock Screen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
