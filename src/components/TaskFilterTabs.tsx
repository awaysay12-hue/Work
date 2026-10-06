import React from 'react';
import {
  Calendar,
  Clock,
  CheckCheck,
  AlertCircle,
  ListTodo,
  Layers,
  Archive,
  ArrowUpDown,
  CalendarDays,
  BarChart3,
  UserCheck,
  Users,
} from 'lucide-react';
import { ViewFilterPeriod, TaskFilterState, Task, UserAccount } from '../types';
import { CATEGORIES_CONFIG, toKhmerNumber } from '../utils/translations';
import { getTodayDateString, getTomorrowDateString } from '../utils/khmerDates';

interface TaskFilterTabsProps {
  filters: TaskFilterState;
  onFilterChange: (filters: Partial<TaskFilterState>) => void;
  tasks: Task[];
  currentUser?: UserAccount;
  users?: UserAccount[];
}

export const TaskFilterTabs: React.FC<TaskFilterTabsProps> = ({
  filters,
  onFilterChange,
  tasks,
  currentUser,
  users = [],
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const todayCount = tasks.filter((t) => !t.archived && t.dueDate === todayStr && !t.completed).length;
  const tomorrowCount = tasks.filter((t) => !t.archived && t.dueDate === tomorrowStr && !t.completed).length;
  const overdueCount = tasks.filter((t) => !t.archived && t.dueDate < todayStr && !t.completed).length;
  const completedCount = tasks.filter((t) => !t.archived && t.completed).length;
  const allActiveCount = tasks.filter((t) => !t.archived && !t.completed).length;
  const archivedCount = tasks.filter((t) => t.archived).length;

  const tabs: Array<{
    id: ViewFilterPeriod;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    activeClass: string;
    iconColor: string;
    badgeClass: string;
  }> = [
    {
      id: 'today',
      label: 'ថ្ងៃនេះ',
      icon: Clock,
      badgeCount: todayCount,
      activeClass: 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-gradient-to-b from-indigo-50/90 to-transparent dark:from-indigo-950/60 shadow-2xs',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
    },
    {
      id: 'tomorrow',
      label: 'ថ្ងៃស្អែក',
      icon: Calendar,
      badgeCount: tomorrowCount,
      activeClass: 'border-blue-600 text-blue-700 dark:text-blue-300 bg-gradient-to-b from-blue-50/90 to-transparent dark:from-blue-950/60 shadow-2xs',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    },
    {
      id: 'upcoming',
      label: 'ជិតដល់',
      icon: ListTodo,
      activeClass: 'border-cyan-600 text-cyan-700 dark:text-cyan-300 bg-gradient-to-b from-cyan-50/90 to-transparent dark:from-cyan-950/60 shadow-2xs',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
    },
    {
      id: 'overdue',
      label: 'ហួសកំណត់',
      icon: AlertCircle,
      badgeCount: overdueCount,
      activeClass: 'border-rose-600 text-rose-700 dark:text-rose-300 bg-gradient-to-b from-rose-50/90 to-transparent dark:from-rose-950/60 shadow-2xs',
      iconColor: 'text-rose-600 dark:text-rose-400 animate-pulse',
      badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 animate-pulse',
    },
    {
      id: 'completed',
      label: 'បានបញ្ចប់',
      icon: CheckCheck,
      badgeCount: completedCount,
      activeClass: 'border-emerald-600 text-emerald-700 dark:text-emerald-300 bg-gradient-to-b from-emerald-50/90 to-transparent dark:from-emerald-950/60 shadow-2xs',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
    {
      id: 'archived',
      label: 'ប័ណ្ណសារ (Archived)',
      icon: Archive,
      badgeCount: archivedCount,
      activeClass: 'border-amber-600 text-amber-700 dark:text-amber-300 bg-gradient-to-b from-amber-50/90 to-transparent dark:from-amber-950/60 shadow-2xs',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      id: 'all',
      label: 'ទាំងអស់',
      icon: Layers,
      badgeCount: allActiveCount,
      activeClass: 'border-purple-600 text-purple-700 dark:text-purple-300 bg-gradient-to-b from-purple-50/90 to-transparent dark:from-purple-950/60 shadow-2xs',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    },
  ];

  const categories = Object.values(CATEGORIES_CONFIG);

  const currentAssignee = filters.assigneeFilter || 'all';

  return (
    <div className="space-y-3">
      {/* Scope / Assignee Selector Row */}
      {currentUser && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>ការបង្ហាញកិច្ចការ៖</span>
            </span>

            {/* If Admin / Manager: show toggle between All Tasks and My Tasks */}
            {(currentUser.role === 'admin' || currentUser.role === 'manager') ? (
              <>
                <button
                  onClick={() => onFilterChange({ assigneeFilter: 'all' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentAssignee === 'all'
                      ? 'bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span>កិច្ចការក្រុមទាំងអស់</span>
                </button>

                <button
                  onClick={() => onFilterChange({ assigneeFilter: currentUser.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentAssignee === currentUser.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span>កិច្ចការរបស់ខ្ញុំ ({currentUser.khmerName})</span>
                </button>
              </>
            ) : (
              /* Regular Member / Viewer: strictly locked to their own tasks */
              <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                <span>កិច្ចការផ្ទាល់ខ្លួន ({currentUser.khmerName})</span>
                <span className="text-[10px] bg-indigo-700/80 px-1.5 py-0.2 rounded uppercase font-medium">
                  {currentUser.role}
                </span>
              </div>
            )}
          </div>

          {/* Member dropdown if more than 1 user and user is admin/manager */}
          {users.length > 0 && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
            <div className="flex items-center gap-1.5 ml-auto text-xs">
              <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium hidden sm:inline">តាមសមាជិក៖</span>
              <select
                value={currentAssignee}
                onChange={(e) => onFilterChange({ assigneeFilter: e.target.value })}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
              >
                <option value="all">សមាជិកទាំងអស់ (All)</option>
                <option value={currentUser.id}>កិច្ចការខ្ញុំ ({currentUser.khmerName})</option>
                {users
                  .filter((u) => u.id !== currentUser.id)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.khmerName} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* High Density Colorful Filter Tab Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filters.period === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onFilterChange({ period: tab.id })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border-b-2 cursor-pointer hover:scale-105 active:scale-95 ${
                isActive
                  ? `${tab.activeClass} font-extrabold`
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isActive ? tab.iconColor : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-black font-mono transition-transform duration-200 ${
                    tab.badgeClass
                  }`}
                >
                  {toKhmerNumber(tab.badgeCount)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Categories Filter Strip & Sort Dropdown with Colorful Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-0.5">
            ប្រភេទ៖
          </span>
          <button
            type="button"
            onClick={() => onFilterChange({ category: 'all' })}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
              filters.category === 'all'
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-indigo-600 dark:to-purple-600 text-white shadow-xs ring-1 ring-slate-800 dark:ring-indigo-400'
                : 'bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            ទាំងអស់
          </button>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.id;
            // Distinct category color identities
            const catColors: Record<string, { active: string; inactive: string }> = {
              work: {
                active: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-1 ring-indigo-400',
                inactive: 'hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400',
              },
              project: {
                active: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white ring-1 ring-sky-400',
                inactive: 'hover:border-sky-300 hover:text-sky-600 dark:hover:text-sky-400',
              },
              it: {
                active: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-1 ring-emerald-400',
                inactive: 'hover:border-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400',
              },
              meeting: {
                active: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white ring-1 ring-amber-400',
                inactive: 'hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400',
              },
              personal: {
                active: 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white ring-1 ring-fuchsia-400',
                inactive: 'hover:border-fuchsia-300 hover:text-fuchsia-600 dark:hover:text-fuchsia-400',
              },
            };
            const currentCatStyle = catColors[cat.id] || {
              active: 'bg-indigo-600 text-white ring-1 ring-indigo-400',
              inactive: 'hover:border-indigo-300 hover:text-indigo-600',
            };

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    category: isSelected ? 'all' : cat.id,
                  })
                }
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shadow-2xs hover:scale-105 active:scale-95 ${
                  isSelected
                    ? `${currentCatStyle.active} shadow-xs`
                    : `bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${currentCatStyle.inactive}`
                }`}
              >
                {cat.labelKm}
              </button>
            );
          })}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
            តម្រៀបតាម៖
          </span>
          <select
            id="sort-task-select"
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as TaskFilterState['sortBy'],
              })
            }
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer shadow-2xs"
          >
            <option value="dueAsc">កាលកំណត់ (ជិតមកដល់)</option>
            <option value="dueDesc">កាលកំណត់ (ឆ្ងាយ)</option>
            <option value="priority">អាទិភាពការងារ</option>
            <option value="title">តាមអក្សរក្រម (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

