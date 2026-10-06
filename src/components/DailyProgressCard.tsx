import React, { useMemo } from 'react';
import { Layers, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, Sparkles } from 'lucide-react';
import { Task } from '../types';
import { getTodayDateString } from '../utils/khmerDates';
import { toKhmerNumber } from '../utils/translations';

interface DailyProgressCardProps {
  tasks: Task[];
  onFilterPeriod?: (period: any) => void;
  activePeriod?: string;
  onViewAnalytics?: () => void;
  onOpenTodaySummary?: () => void;
  onOpenPhoneNotificationModal?: () => void;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = ({
  tasks,
  onFilterPeriod,
  activePeriod,
}) => {
  const todayStr = getTodayDateString();

  const { totalCount, pendingCount, completedCount, overdueCount } = useMemo(() => {
    const nonArchived = tasks.filter((t) => !t.archived);
    const total = nonArchived.length;
    const completed = nonArchived.filter((t) => t.completed).length;
    const pending = total - completed;
    const overdue = nonArchived.filter((t) => !t.completed && t.dueDate < todayStr).length;

    return {
      totalCount: total,
      pendingCount: pending,
      completedCount: completed,
      overdueCount: overdue,
    };
  }, [tasks, todayStr]);

  const cards = [
    {
      id: 'all',
      title: 'ភារកិច្ចសរុប',
      sub: 'កិច្ចការទាំងអស់ក្នុងប្រព័ន្ធ',
      count: totalCount,
      icon: Layers,
      // Colorful Gradient & Glow configuration
      gradientBorder: 'hover:border-indigo-400 dark:hover:border-indigo-500',
      activeStyles: 'ring-2 ring-indigo-500/40 border-indigo-500 shadow-md bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 dark:from-indigo-950/50 dark:via-slate-900 dark:to-purple-950/40',
      defaultStyles: 'bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 border-slate-200/90 dark:border-slate-800',
      iconContainer: 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xs group-hover:shadow-indigo-500/30 group-hover:scale-110',
      numColor: 'bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent',
      accentBar: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
    {
      id: 'today',
      title: 'កំពុងដំណើរការ',
      sub: 'មិនទាន់បានបញ្ចប់',
      count: pendingCount,
      icon: Clock,
      gradientBorder: 'hover:border-sky-400 dark:hover:border-sky-500',
      activeStyles: 'ring-2 ring-sky-500/40 border-sky-500 shadow-md bg-gradient-to-br from-sky-50/90 via-white to-cyan-50/60 dark:from-sky-950/50 dark:via-slate-900 dark:to-cyan-950/40',
      defaultStyles: 'bg-gradient-to-br from-white via-slate-50/50 to-sky-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20 border-slate-200/90 dark:border-slate-800',
      iconContainer: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xs group-hover:shadow-sky-500/30 group-hover:scale-110',
      numColor: 'bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent',
      accentBar: 'bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-600',
      badgeBg: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
    },
    {
      id: 'completed',
      title: 'បានបញ្ចប់រួចរាល់',
      sub: 'សម្រេចដោយជោគជ័យ',
      count: completedCount,
      icon: CheckCircle2,
      gradientBorder: 'hover:border-emerald-400 dark:hover:border-emerald-500',
      activeStyles: 'ring-2 ring-emerald-500/40 border-emerald-500 shadow-md bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/40',
      defaultStyles: 'bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-slate-200/90 dark:border-slate-800',
      iconContainer: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs group-hover:shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6',
      numColor: 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent',
      accentBar: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      id: 'overdue',
      title: 'យឺតយ៉ាវ / ហួសកំណត់',
      sub: overdueCount > 0 ? 'ត្រូវការដោះស្រាយបន្ទាន់' : 'គ្មានកិច្ចការយឺតយ៉ាវ',
      count: overdueCount,
      icon: AlertTriangle,
      gradientBorder: 'hover:border-rose-400 dark:hover:border-rose-500',
      activeStyles: 'ring-2 ring-rose-500/40 border-rose-500 shadow-md bg-gradient-to-br from-rose-50/90 via-white to-amber-50/60 dark:from-rose-950/50 dark:via-slate-900 dark:to-amber-950/40',
      defaultStyles: 'bg-gradient-to-br from-white via-slate-50/50 to-rose-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20 border-slate-200/90 dark:border-slate-800',
      iconContainer: `bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs group-hover:shadow-rose-500/30 group-hover:scale-110 ${
        overdueCount > 0 ? 'animate-pulse' : ''
      }`,
      numColor: 'bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-400 dark:to-red-400 bg-clip-text text-transparent',
      accentBar: 'bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500',
      badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4.5">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activePeriod === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onFilterPeriod?.(c.id)}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left cursor-pointer group relative overflow-hidden transition-all duration-300 card-colorful-hover ${
              c.gradientBorder
            } ${isActive ? c.activeStyles : c.defaultStyles}`}
          >
            {/* Top Accent Strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${c.accentBar} transition-opacity duration-300 ${
                isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
              }`}
            />

            {/* Header: Label & Icon */}
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>{c.title}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block" />
                )}
              </span>

              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${c.iconContainer}`}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
            </div>

            {/* Metric Number Display */}
            <div className="flex items-baseline justify-between mt-1">
              <h3
                className={`text-2xl sm:text-3xl lg:text-3.5xl font-black font-mono tabular-nums leading-none tracking-tight ${c.numColor}`}
              >
                {toKhmerNumber(String(c.count).padStart(2, '0'))}
              </h3>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>

            {/* Subtitle / Status */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium truncate flex items-center gap-1">
              <span>{c.sub}</span>
            </p>

            {/* Hover Shimmer Slide Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer-slide bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent pointer-events-none" />
          </button>
        );
      })}
    </div>
  );
};
