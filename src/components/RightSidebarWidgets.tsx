import React from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  TrendingUp,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { Task, DailyStreak } from '../types';
import { toKhmerNumber } from '../utils/translations';
import { formatKhmerTime, getRelativeDueDateText, getTodayDateString } from '../utils/khmerDates';

interface RightSidebarWidgetsProps {
  tasks: Task[];
  streak: DailyStreak;
  onToggleComplete: (task: Task) => void;
  onStartFocusTimer: (task: Task) => void;
  onOpenNewTask: () => void;
}

export const RightSidebarWidgets: React.FC<RightSidebarWidgetsProps> = ({
  tasks,
  streak,
  onToggleComplete,
  onStartFocusTimer,
  onOpenNewTask,
}) => {
  const todayStr = getTodayDateString();

  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const totalToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const totalCompleted = tasks.filter((t) => t.completed).length;

  const percentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const todayPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Active / Upcoming Important Reminders
  const activeReminders = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      const dateA = a.dueDate + (a.dueTime || '23:59');
      const dateB = b.dueDate + (b.dueTime || '23:59');
      return dateA.localeCompare(dateB);
    })
    .slice(0, 4);

  // SVG Circular progress math
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Overall Progress Widget (Matches Design Spec) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm">វឌ្ឍនភាពសរុប</h3>
          <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 font-bold px-2 py-0.5 rounded-full">
            {toKhmerNumber(todayPercentage)}% ថ្ងៃនេះ
          </span>
        </div>

        <div className="flex flex-col items-center justify-center relative py-2">
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="text-slate-100"
                strokeWidth="9"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="text-indigo-600 transition-all duration-700 ease-out"
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-slate-800 leading-none">
                {toKhmerNumber(percentage)}%
              </span>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">រួចរាល់</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center mt-4 px-2 leading-relaxed">
            អ្នកបានបញ្ចប់{' '}
            <strong className="text-slate-800 font-bold">{toKhmerNumber(totalCompleted)}</strong>{' '}
            ក្នុងចំណោម{' '}
            <strong className="text-slate-800 font-bold">{toKhmerNumber(totalTasks)}</strong>{' '}
            ភារកិច្ចរបស់អ្នក។
          </p>

          <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block font-medium">ថ្ងៃនេះ</span>
              <span className="text-xs font-bold text-slate-800">
                {toKhmerNumber(completedToday)}/{toKhmerNumber(totalToday)}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
              <span className="text-[10px] text-amber-600 block font-medium">ផ្ដោតសរុប</span>
              <span className="text-xs font-bold text-amber-700">
                {toKhmerNumber(streak.totalFocusMinutesAllTime)} នាទី
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Important Reminders Widget (Matches Design Spec) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm">ការរំលឹកសំខាន់ៗ</h3>
          <span className="text-[10px] font-bold text-slate-400">
            {toKhmerNumber(activeReminders.length)} ភារកិច្ច
          </span>
        </div>

        {activeReminders.length === 0 ? (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
            <p className="text-xs font-medium text-slate-600">គ្មានការរំលឹកដែលនៅសេសសល់ទេ</p>
            <p className="text-[10px] text-slate-400 mt-0.5">អ្នកបានបំពេញការងារយ៉ាងល្អប្រសើរ!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeReminders.map((task, idx) => {
              const dueInfo = getRelativeDueDateText(task.dueDate, task.dueTime);
              
              // Border colors: amber for upcoming, indigo for regular, rose for overdue / urgent
              let borderColor = 'border-indigo-400';
              let badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
              let badgeText = 'ភារកិច្ច';

              if (dueInfo.isOverdue || task.priority === 'urgent') {
                borderColor = 'border-rose-400';
                badgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                badgeText = 'បន្ទាន់';
              } else if (task.dueDate === todayStr) {
                borderColor = 'border-amber-400';
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-100';
                badgeText = 'ថ្ងៃនេះ';
              }

              return (
                <div
                  key={task.id}
                  className={`flex items-start justify-between gap-2 border-l-4 ${borderColor} pl-3 py-1.5 hover:bg-slate-50/80 rounded-r-lg transition-colors group`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate leading-snug">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span>{dueInfo.text}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${badgeColor}`}
                    >
                      {badgeText}
                    </span>

                    <button
                      onClick={() => onStartFocusTimer(task)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                      title="កំណត់ពេលផ្ដោត"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
