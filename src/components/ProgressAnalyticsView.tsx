import React, { useMemo } from 'react';
import {
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  Upload,
  Sparkles,
  BarChart,
  ShieldCheck,
} from 'lucide-react';
import { Task, DailyStreak } from '../types';
import {
  CATEGORIES_CONFIG,
  PRIORITIES_CONFIG,
  KHMER_DAYS,
  toKhmerNumber,
} from '../utils/translations';
import { getTodayDateString } from '../utils/khmerDates';

interface ProgressAnalyticsViewProps {
  tasks: Task[];
  streak: DailyStreak;
  onExportData: () => void;
  onImportData: (file: File) => void;
  onClose?: () => void;
}

export const ProgressAnalyticsView: React.FC<ProgressAnalyticsViewProps> = ({
  tasks,
  streak,
  onExportData,
  onImportData,
}) => {
  const todayStr = getTodayDateString();

  // Calculate 7-day completion history
  const last7DaysData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeekName = KHMER_DAYS[d.getDay()];
      const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
      const total = dayTasks.length;
      const completed = dayTasks.filter((t) => t.completed).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      days.push({
        dateStr,
        dayName: dayOfWeekName,
        shortDay: dayOfWeekName.slice(0, 4),
        total,
        completed,
        rate,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [tasks, todayStr]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    Object.keys(CATEGORIES_CONFIG).forEach((k) => {
      counts[k] = { total: 0, completed: 0 };
    });

    tasks.forEach((t) => {
      if (counts[t.category]) {
        counts[t.category].total += 1;
        if (t.completed) counts[t.category].completed += 1;
      }
    });

    return Object.entries(counts).map(([catKey, data]) => {
      const meta = CATEGORIES_CONFIG[catKey as keyof typeof CATEGORIES_CONFIG];
      const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      return {
        key: catKey,
        meta,
        total: data.total,
        completed: data.completed,
        rate,
      };
    });
  }, [tasks]);

  // Overall metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusHours = (streak.totalFocusMinutesAllTime / 60).toFixed(1);

  // Productivity Score (0-100)
  const productivityScore = useMemo(() => {
    if (totalTasks === 0) return 100;
    const baseScore = overallRate * 0.7;
    const streakBonus = Math.min(streak.currentStreak * 5, 30);
    return Math.min(Math.round(baseScore + streakBonus), 100);
  }, [totalTasks, overallRate, streak.currentStreak]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportData(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Productivity Score & Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Productivity Score Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white rounded-2xl p-5 shadow-md flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
            <Award className="w-36 h-36" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-200 uppercase flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> ពិន្ទុផលិតភាព
            </span>
            <div className="text-4xl font-extrabold mt-1">
              {toKhmerNumber(productivityScore)}
              <span className="text-lg font-normal text-indigo-200">/១០០</span>
            </div>
            <p className="text-xs text-indigo-100 mt-1">
              {productivityScore >= 80
                ? '🌟 ល្អឥតខ្ចោះ! អ្នកកំពុងរក្សាវិន័យការងារបានយ៉ាងល្អ'
                : '💪 កំពុងរីកចម្រើន! បន្តបញ្ចប់កិច្ចការបន្ថែម'}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-amber-300 font-extrabold text-xl shrink-0">
            <Award className="w-8 h-8" />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              ចំនួនថ្ងៃជាប់ៗគ្នា (Streak)
            </span>
            <div className="text-3xl font-extrabold text-amber-600 mt-1 flex items-center">
              <Flame className="w-7 h-7 mr-1 fill-amber-500 text-amber-500" />
              {toKhmerNumber(streak.currentStreak)}{' '}
              <span className="text-sm font-medium text-slate-500 ml-1">ថ្ងៃ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              កំណត់ត្រាខ្ពស់បំផុត៖ <strong>{toKhmerNumber(streak.longestStreak)} ថ្ងៃ</strong>
            </p>
          </div>
        </div>

        {/* Total Focus Hours */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">
              ពេលវេលាផ្ដោតសរុប (Focus Time)
            </span>
            <div className="text-3xl font-extrabold text-indigo-600 mt-1 flex items-center">
              <Clock className="w-6 h-6 mr-1.5 text-indigo-500" />
              {toKhmerNumber(totalFocusHours)}{' '}
              <span className="text-sm font-medium text-slate-500 ml-1">ម៉ោង</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              បានបញ្ចប់កិច្ចការសរុប៖ <strong>{toKhmerNumber(streak.totalCompletedAllTime)} កិច្ចការ</strong>
            </p>
          </div>
        </div>
      </div>

      {/* 7-Day Completion Velocity Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                អត្រាសម្រេចកិច្ចការ ៧ ថ្ងៃចុងក្រោយ
              </h3>
              <p className="text-xs text-slate-500">
                ការប្រៀបធៀបចំនួនកិច្ចការដែលបានគ្រោងទុក និងបានបញ្ចប់
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1 text-indigo-600">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
              <span>បានបញ្ចប់</span>
            </div>
            <div className="flex items-center space-x-1 text-slate-400">
              <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
              <span>កិច្ចការសរុប</span>
            </div>
          </div>
        </div>

        {/* Custom Bar Chart Visualizer */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-4 border-b border-slate-100 pb-2">
          {last7DaysData.map((day, idx) => {
            const maxVal = Math.max(...last7DaysData.map((d) => d.total), 1);
            const totalHeight = Math.max((day.total / maxVal) * 100, 10);
            const completedHeight = day.total > 0 ? (day.completed / day.total) * totalHeight : 0;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] text-slate-500 font-bold mb-1 group-hover:text-indigo-600">
                  {toKhmerNumber(day.completed)}/{toKhmerNumber(day.total)}
                </div>
                <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl relative overflow-hidden flex flex-col justify-end h-32 border border-slate-200">
                  {/* Total bar outline */}
                  <div
                    className="w-full bg-slate-200/80 rounded-t-xl transition-all"
                    style={{ height: `${totalHeight}%` }}
                  >
                    {/* Completed fill bar */}
                    <div
                      className={`w-full transition-all duration-500 rounded-t-xl ${
                        day.isToday
                          ? 'bg-gradient-to-t from-indigo-700 to-indigo-500'
                          : 'bg-indigo-600'
                      }`}
                      style={{ height: `${(day.completed / Math.max(day.total, 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div
                  className={`text-xs font-semibold mt-2 ${
                    day.isToday ? 'text-indigo-600 font-bold' : 'text-slate-600'
                  }`}
                >
                  {day.shortDay}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Data Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              ការបែងចែកកិច្ចការតាមប្រភេទ
            </h3>
          </div>

          <div className="space-y-3.5">
            {categoryStats.map((item) => {
              if (item.total === 0) return null;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mr-2 ${item.meta.colorBg}`} />
                      {item.meta.labelKm}
                    </span>
                    <span className="text-slate-500">
                      {toKhmerNumber(item.completed)}/{toKhmerNumber(item.total)} (
                      {toKhmerNumber(item.rate)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Management: Export & Backup */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                បម្រុងទុកទិន្នន័យ (Backup)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              ទិន្នន័យកិច្ចការរបស់អ្នកត្រូវបានរក្សាទុកដោយសុវត្ថិភាព។ អ្នកអាចទាញយកទិន្នន័យទុកជាឯកសារ JSON
              ឬបញ្ចូលទិន្នន័យពីឯកសារចាស់ឡើងវិញបានគ្រប់ពេល។
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={onExportData}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>ទាញយកទិន្នន័យ (Export JSON)</span>
            </button>

            <label className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>បញ្ចូលទិន្នន័យឡើងវិញ (Import)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
