import React from 'react';
import {
  Calendar,
  Clock,
  CheckCheck,
  AlertCircle,
  ListTodo,
  Layers,
  Search,
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

  const todayCount = tasks.filter((t) => t.dueDate === todayStr && !t.completed).length;
  const tomorrowCount = tasks.filter((t) => t.dueDate === tomorrowStr && !t.completed).length;
  const overdueCount = tasks.filter((t) => t.dueDate < todayStr && !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const allActiveCount = tasks.filter((t) => !t.completed).length;

  const tabs: Array<{
    id: ViewFilterPeriod;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'today',
      label: 'ថ្ងៃនេះ',
      icon: Clock,
      badgeCount: todayCount,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      id: 'tomorrow',
      label: 'ថ្ងៃស្អែក',
      icon: Calendar,
      badgeCount: tomorrowCount,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'upcoming',
      label: 'ជិតដល់',
      icon: ListTodo,
    },
    {
      id: 'overdue',
      label: 'ហួសកំណត់',
      icon: AlertCircle,
      badgeCount: overdueCount,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'completed',
      label: 'បានបញ្ចប់',
      icon: CheckCheck,
      badgeCount: completedCount,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'all',
      label: 'ទាំងអស់',
      icon: Layers,
      badgeCount: allActiveCount,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
  ];

  const categories = Object.values(CATEGORIES_CONFIG);

  const currentAssignee = filters.assigneeFilter || 'all';

  return (
    <div className="space-y-3">
      {/* Scope / Assignee Selector Row */}
      {currentUser && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>ការបង្ហាញកិច្ចការ៖</span>
            </span>

            {/* If Admin / Manager: show toggle between All Tasks and My Tasks */}
            {(currentUser.role === 'admin' || currentUser.role === 'manager') ? (
              <>
                <button
                  onClick={() => onFilterChange({ assigneeFilter: 'all' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentAssignee === 'all'
                      ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3 h-3 text-slate-500" />
                  <span>កិច្ចការក្រុមទាំងអស់</span>
                </button>

                <button
                  onClick={() => onFilterChange({ assigneeFilter: currentUser.id })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentAssignee === currentUser.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
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
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">តាមសមាជិក៖</span>
              <select
                value={currentAssignee}
                onChange={(e) => onFilterChange({ assigneeFilter: e.target.value })}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium cursor-pointer"
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

      {/* High Density Filter Tab Strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = filters.period === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onFilterChange({ period: tab.id })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.badgeCount === 'number' && tab.badgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    tab.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {toKhmerNumber(tab.badgeCount)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* High Density Search, Category Pills & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="search-task-input"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="ស្វែងរកកិច្ចការ..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-2xs"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories & Sort */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => onFilterChange({ category: 'all' })}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                filters.category === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ទាំងអស់
            </button>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  onFilterChange({
                    category: filters.category === cat.id ? 'all' : cat.id,
                  })
                }
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  filters.category === cat.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.labelKm}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 ml-auto">
            <select
              id="sort-task-select"
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as TaskFilterState['sortBy'],
                })
              }
              className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="dueAsc">កាលកំណត់ (ជិត)</option>
              <option value="dueDesc">កាលកំណត់ (ឆ្ងាយ)</option>
              <option value="priority">អាទិភាព</option>
              <option value="title">អក្សរក្រម</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

