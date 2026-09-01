import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Task } from '../types';
import {
  KHMER_DAYS,
  KHMER_SHORT_DAYS,
  KHMER_MONTHS,
  CATEGORIES_CONFIG,
  toKhmerNumber,
} from '../utils/translations';
import { formatKhmerDate, formatKhmerTime, getTodayDateString } from '../utils/khmerDates';

interface CalendarViewProps {
  tasks: Task[];
  onSelectDate: (dateStr: string) => void;
  onOpenNewTaskWithDate: (dateStr: string) => void;
  onToggleComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onSelectDate,
  onOpenNewTaskWithDate,
  onToggleComplete,
  onEditTask,
}) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    const d = new Date();
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
    setSelectedDate(todayStr);
  };

  // Generate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: day,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete 35 or 42 grid cells
  const remaining = 35 - calendarCells.length;
  const nextMonthPadding = remaining < 0 ? 42 - calendarCells.length : remaining;
  for (let d = 1; d <= nextMonthPadding; d++) {
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Tasks for selected date
  const selectedDateTasks = tasks.filter((t) => t.dueDate === selectedDate);

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              ខែ{KHMER_MONTHS[currentMonth]} ឆ្នាំ{toKhmerNumber(currentYear)}
            </h2>
            <p className="text-xs text-slate-500">
              ជ្រើសរើសថ្ងៃដើម្បីមើលកាលវិភាគ និងគ្រប់គ្រងកិច្ចការ
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
          >
            ថ្ងៃនេះ
          </button>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 border-r border-slate-200 transition-colors"
              title="ខែមុន"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-50 text-slate-600 transition-colors"
              title="ខែបន្ទាប់"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 70% Calendar + 30% Selected Day Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          {/* Day of week labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 mb-2">
            {KHMER_SHORT_DAYS.map((day, idx) => (
              <div
                key={idx}
                className={`py-1.5 rounded-lg ${
                  idx === 0 ? 'text-red-500 font-bold bg-red-50/50' : ''
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const cellTasks = tasks.filter((t) => t.dueDate === cell.dateStr);
              const hasTasks = cellTasks.length > 0;
              const completedCount = cellTasks.filter((t) => t.completed).length;
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    onSelectDate(cell.dateStr);
                  }}
                  className={`min-h-[70px] sm:min-h-[85px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                      : isToday
                      ? 'border-indigo-200 bg-indigo-50/30'
                      : cell.isCurrentMonth
                      ? 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      : 'border-transparent bg-slate-50/40 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {toKhmerNumber(cell.dayNumber)}
                    </span>

                    {hasTasks && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          completedCount === cellTasks.length
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {toKhmerNumber(completedCount)}/{toKhmerNumber(cellTasks.length)}
                      </span>
                    )}
                  </div>

                  {/* Tiny task indicator bars */}
                  <div className="space-y-0.5 mt-1 overflow-hidden max-h-10">
                    {cellTasks.slice(0, 2).map((t) => {
                      const cat = CATEGORIES_CONFIG[t.category] || CATEGORIES_CONFIG.other;
                      return (
                        <div
                          key={t.id}
                          className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                            t.completed
                              ? 'line-through bg-slate-100 text-slate-400'
                              : `${cat.badgeBg}`
                          }`}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                    {cellTasks.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-bold px-1">
                        + {toKhmerNumber(cellTasks.length - 2)} ទៀត
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Task Drawer */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {formatKhmerDate(selectedDate, true)}
              </h3>
              <p className="text-xs text-slate-500">
                មានចំនួន {toKhmerNumber(selectedDateTasks.length)} កិច្ចការ
              </p>
            </div>
            <button
              onClick={() => onOpenNewTaskWithDate(selectedDate)}
              className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
              title="បន្ថែមកិច្ចការសម្រាប់ថ្ងៃនេះ"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* List of tasks for this date */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-1">
            {selectedDateTasks.length === 0 ? (
              <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400">
                  មិនទាន់មានកិច្ចការសម្រាប់ថ្ងៃនេះនៅឡើយទេ។
                </p>
                <button
                  onClick={() => onOpenNewTaskWithDate(selectedDate)}
                  className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  + បង្កើតកិច្ចការថ្មី
                </button>
              </div>
            ) : (
              selectedDateTasks.map((t) => {
                const cat = CATEGORIES_CONFIG[t.category] || CATEGORIES_CONFIG.other;
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border transition-all ${
                      t.completed
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => onToggleComplete(t)}
                        className={`shrink-0 mt-0.5 ${
                          t.completed
                            ? 'text-emerald-600'
                            : 'text-slate-300 hover:text-indigo-600'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4
                          onClick={() => onEditTask(t)}
                          className={`text-xs sm:text-sm font-semibold cursor-pointer text-slate-900 line-clamp-1 ${
                            t.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {t.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded ${cat.badgeBg}`}>
                            {cat.labelKm}
                          </span>
                          {t.dueTime && (
                            <span className="text-slate-500 flex items-center">
                              <Clock className="w-3 h-3 mr-0.5" />
                              {formatKhmerTime(t.dueTime)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
