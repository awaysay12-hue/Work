import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { Task } from '../types';
import { toKhmerNumber } from '../utils/translations';

interface PriorityBreakdownCardProps {
  tasks: Task[];
  className?: string;
  onFilterPriority?: (priority: 'high' | 'medium' | 'low' | 'all') => void;
}

interface PrioritySlice {
  name: string;
  nameKm: string;
  key: 'high' | 'medium' | 'low';
  value: number;
  color: string;
  darkColor: string;
  bgLight: string;
  bgDark: string;
  textColor: string;
}

export const PriorityBreakdownCard: React.FC<PriorityBreakdownCardProps> = ({
  tasks,
  className = '',
  onFilterPriority,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'active'>('active');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Compute tasks based on active/all filter (excluding archived)
  const targetTasks = useMemo(() => {
    const nonArchived = tasks.filter((t) => !t.archived);
    if (filterMode === 'active') {
      return nonArchived.filter((t) => !t.completed);
    }
    return nonArchived;
  }, [tasks, filterMode]);

  const totalCount = targetTasks.length;

  const data: PrioritySlice[] = useMemo(() => {
    // High includes both 'urgent' and 'high'
    const highCount = targetTasks.filter(
      (t) => t.priority === 'high' || t.priority === 'urgent'
    ).length;
    const mediumCount = targetTasks.filter((t) => t.priority === 'medium').length;
    const lowCount = targetTasks.filter((t) => t.priority === 'low').length;

    return [
      {
        name: 'High',
        nameKm: 'អាទិភាពខ្ពស់',
        key: 'high',
        value: highCount,
        color: '#f43f5e', // Rose-500
        darkColor: '#fb7185', // Rose-400
        bgLight: 'bg-rose-50 border-rose-200',
        bgDark: 'dark:bg-rose-950/40 dark:border-rose-900/50',
        textColor: 'text-rose-600 dark:text-rose-400',
      },
      {
        name: 'Medium',
        nameKm: 'មធ្យម',
        key: 'medium',
        value: mediumCount,
        color: '#6366f1', // Indigo-500
        darkColor: '#818cf8', // Indigo-400
        bgLight: 'bg-indigo-50 border-indigo-200',
        bgDark: 'dark:bg-indigo-950/40 dark:border-indigo-900/50',
        textColor: 'text-indigo-600 dark:text-indigo-400',
      },
      {
        name: 'Low',
        nameKm: 'ទាប',
        key: 'low',
        value: lowCount,
        color: '#10b981', // Emerald-500
        darkColor: '#34d399', // Emerald-400
        bgLight: 'bg-emerald-50 border-emerald-200',
        bgDark: 'dark:bg-emerald-950/40 dark:border-emerald-900/50',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      },
    ];
  }, [targetTasks]);

  // Fallback display if zero tasks
  const chartData = useMemo(() => {
    const sum = data.reduce((acc, cur) => acc + cur.value, 0);
    if (sum === 0) {
      return [{ name: 'Empty', nameKm: 'គ្មានកិច្ចការ', key: 'low' as const, value: 1, color: '#e2e8f0', darkColor: '#334155', bgLight: '', bgDark: '', textColor: '' }];
    }
    return data.filter((d) => d.value > 0);
  }, [data]);

  const isEmpty = totalCount === 0;

  return (
    <div
      id="priority-breakdown-card"
      className={`bg-white dark:bg-slate-900/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm card-colorful-hover transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
              បែងចែកតាមកម្រិតអាទិភាព
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Priority Breakdown (High, Medium, Low)
            </p>
          </div>
        </div>

        {/* Filter Mode Toggle: Active vs All */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setFilterMode('active')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              filterMode === 'active'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            មិនទាន់រួច ({toKhmerNumber(tasks.filter((t) => !t.completed).length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ទាំងអស់ ({toKhmerNumber(tasks.length)})
          </button>
        </div>
      </div>

      {/* Donut Chart and Stats Layout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 pb-2">
        {/* Recharts Donut Visual */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as PrioritySlice;
                    if (item.name === 'Empty') return null;
                    const pct = totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0;
                    return (
                      <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 shadow-lg text-xs backdrop-blur-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.nameKm} ({item.name})</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {toKhmerNumber(item.value)} ភារកិច្ច ({toKhmerNumber(pct)}%)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={68}
                paddingAngle={isEmpty ? 0 : 4}
                dataKey="value"
                strokeWidth={2}
                stroke="transparent"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-all duration-300 cursor-pointer outline-none"
                    style={{
                      transform: activeIndex === index ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: 'center center',
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Metric in Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">
              {toKhmerNumber(totalCount)}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">
              {filterMode === 'active' ? 'កិច្ចការនៅសល់' : 'សរុបទាំងអស់'}
            </span>
          </div>
        </div>

        {/* Priority Legend & Quick Details */}
        <div className="flex-1 w-full space-y-2">
          {data.map((item) => {
            const pct = totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0;
            return (
              <div
                key={item.key}
                onClick={() => onFilterPriority && onFilterPriority(item.key)}
                className={`p-2 rounded-xl border transition-all flex items-center justify-between ${
                  item.bgLight
                } ${item.bgDark} ${
                  onFilterPriority ? 'cursor-pointer hover:shadow-xs' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">
                      {item.nameKm}
                    </p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {item.name} Priority
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-black ${item.textColor}`}>
                    {toKhmerNumber(item.value)}{' '}
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      ភារកិច្ច
                    </span>
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                    {toKhmerNumber(pct)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
