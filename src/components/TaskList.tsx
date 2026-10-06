import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  LayoutList,
  Table as TableIcon,
  Search,
  SearchX,
  X,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  AlertCircle,
  Archive,
  History,
  Clock,
} from 'lucide-react';
import { Task, TaskFilterState } from '../types';
import { TaskCard } from './TaskCard';
import { getTodayDateString, getTomorrowDateString, getRelativeDueDateText } from '../utils/khmerDates';
import { toKhmerNumber } from '../utils/translations';

const RECENT_SEARCHES_STORAGE_KEY = 'tasklist_recent_searches_v1';
const MAX_RECENT_SEARCHES = 5;

interface TaskListProps {
  tasks: Task[];
  filters?: TaskFilterState;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onToggleComplete: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStartFocusTimer: (task: Task) => void;
  onOpenNewTask: () => void;
  onToggleArchive?: (task: Task) => void;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
  canToggleComplete?: boolean;
  canCreateTask?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  filters,
  searchQuery,
  onSearchChange,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
  onStartFocusTimer,
  onOpenNewTask,
  onToggleArchive,
  canEditTask = true,
  canDeleteTask = true,
  canToggleComplete = true,
  canCreateTask = true,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [localSearch, setLocalSearch] = useState<string>(
    searchQuery !== undefined ? searchQuery : filters?.searchQuery || ''
  );
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch {
      // Ignore
    }
    return [];
  });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close recent searches dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveRecentSearch = (query: string) => {
    const clean = query.trim();
    if (!clean) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleSelectRecentSearch = (query: string) => {
    setLocalSearch(query);
    if (onSearchChange) {
      onSearchChange(query);
    }
    saveRecentSearch(query);
    setIsSearchFocused(false);
  };

  const handleRemoveRecentSearch = (e: React.MouseEvent, itemToRemove: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleClearAllRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (localSearch.trim()) {
        saveRecentSearch(localSearch);
      }
      setIsSearchFocused(false);
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  const handleSearchBlur = () => {
    if (localSearch.trim().length >= 2) {
      saveRecentSearch(localSearch);
    }
  };

  // Synchronize local search state when prop updates
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearch(searchQuery);
    } else if (filters?.searchQuery !== undefined) {
      setLocalSearch(filters.searchQuery);
    }
  }, [searchQuery, filters?.searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const activeSearch = (searchQuery !== undefined ? searchQuery : localSearch).trim();

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  // Filter tasks based on current filter state & real-time search input
  const filteredTasks = tasks.filter((task) => {
    // Real-time search filter: matching against both task title and description fields
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      const matchTitle = (task.title || '').toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) {
        return false;
      }
    }

    if (filters) {
      // Period filter
      if (filters.period === 'archived') {
        if (!task.archived) return false;
      } else {
        if (task.archived) return false;

        if (filters.period === 'today') {
          if (task.dueDate !== todayStr) return false;
        } else if (filters.period === 'tomorrow') {
          if (task.dueDate !== tomorrowStr) return false;
        } else if (filters.period === 'upcoming') {
          if (task.dueDate <= tomorrowStr || task.completed) return false;
        } else if (filters.period === 'overdue') {
          if (task.completed || task.dueDate >= todayStr) return false;
        } else if (filters.period === 'completed') {
          if (!task.completed) return false;
        } else if (filters.period === 'all') {
          // Show everything non-archived
        }
      }

      // Category filter
      if (filters.category && filters.category !== 'all' && task.category !== filters.category) {
        return false;
      }

      // Priority filter
      if (filters.priority && filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeFilter && filters.assigneeFilter !== 'all') {
        const isAssigned = task.assigneeId === filters.assigneeFilter;
        const isCreated = task.creatorId === filters.assigneeFilter;
        if (!isAssigned && !isCreated) {
          return false;
        }
      }
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // If not in completed view, completed items go to bottom
    if (filters?.period !== 'completed') {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
    }

    const sortBy = filters?.sortBy || 'dueAsc';
    if (sortBy === 'dueAsc') {
      const dateDiff = a.dueDate.localeCompare(b.dueDate);
      if (dateDiff !== 0) return dateDiff;
      return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
    }
    if (sortBy === 'dueDesc') {
      const dateDiff = b.dueDate.localeCompare(a.dueDate);
      if (dateDiff !== 0) return dateDiff;
      return (b.dueTime || '00:00').localeCompare(a.dueTime || '00:00');
    }
    if (sortBy === 'priority') {
      const priorityWeights: Record<string, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'created') {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return 0;
  });

  // Count overdue tasks in current sorted view
  const overdueTasksCount = sortedTasks.filter(
    (t) => !t.completed && getRelativeDueDateText(t.dueDate, t.dueTime).isOverdue
  ).length;

  const getListTitle = () => {
    switch (filters?.period) {
      case 'today':
        return 'បញ្ជីការងារថ្ងៃនេះ';
      case 'tomorrow':
        return 'បញ្ជីការងារថ្ងៃស្អែក';
      case 'upcoming':
        return 'កិច្ចការជិតមកដល់';
      case 'overdue':
        return 'កិច្ចការយឺតយ៉ាវ / ហួសកំណត់';
      case 'completed':
        return 'កិច្ចការដែលបានបញ្ចប់';
      case 'archived':
        return 'ប័ណ្ណសារកិច្ចការ (Archived Tasks)';
      default:
        return 'បញ្ជីកិច្ចការទាំងអស់';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden transition-colors">
      {/* High Density Table Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{getListTitle()}</h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold font-mono tabular-nums">
            {sortedTasks.length}
          </span>
          {overdueTasksCount > 0 && (
            <span className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>ហួសកំណត់ {toKhmerNumber(overdueTasksCount)}</span>
            </span>
          )}
          {activeSearch && (
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span>ត្រូវគ្នា៖ {toKhmerNumber(filteredTasks.length)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Real-time Search Input inside TaskList with Recent Searches */}
          <div ref={searchContainerRef} className="relative flex-1 sm:w-60 md:w-72 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="tasklist-realtime-search-input"
              value={localSearch}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={handleSearchBlur}
              onKeyDown={handleSearchKeyDown}
              placeholder="ស្វែងរកតាម Title ឬ Description..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
            />
            {localSearch && (
              <button
                type="button"
                id="tasklist-clear-search-btn"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                title="លុបការស្វែងរក"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Recent Searches List displayed when search input is focused */}
            {isSearchFocused && recentSearches.length > 0 && (
              <div
                id="tasklist-recent-searches-dropdown"
                className="absolute left-0 right-0 sm:right-auto sm:w-72 md:w-80 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2.5 px-3 z-40 animate-in fade-in zoom-in-95 duration-150"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 dark:border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1.5 font-bold text-slate-600 dark:text-slate-300">
                    <History className="w-3.5 h-3.5 text-indigo-500" />
                    <span>ការស្វែងរកថ្មីៗ (Recent Searches)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllRecentSearches}
                    className="text-[10px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium cursor-pointer transition-colors"
                    title="លុបប្រវត្តិស្វែងរកទាំងអស់"
                  >
                    សម្អាត
                  </button>
                </div>

                {/* Clickable recent search buttons */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {recentSearches.map((item, idx) => (
                    <div
                      key={`${item}-${idx}`}
                      className="group inline-flex items-center rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-xs overflow-hidden shadow-2xs"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectRecentSearch(item)}
                        className="flex items-center gap-1.5 px-2.5 py-1 font-medium cursor-pointer text-left truncate max-w-[190px]"
                        title={`ស្វែងរក "${item}"`}
                      >
                        <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 shrink-0" />
                        <span className="truncate">{item}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecentSearch(e, item)}
                        className="px-1.5 py-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700/80 cursor-pointer transition-colors border-l border-slate-200 dark:border-slate-700 shrink-0"
                        title="លុប"
                        aria-label={`Remove recent search "${item}"`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* View switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="ទិដ្ឋភាពតារាង (Table View)"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="ទិដ្ឋភាពកាត (Card View)"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenNewTask}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline cursor-pointer whitespace-nowrap"
          >
            បន្ថែមថ្មី +
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner in TaskList */}
      {overdueTasksCount > 0 && (
        <div className="mx-3 sm:mx-4 mt-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-rose-500/10 dark:from-rose-950/40 dark:via-rose-950/20 dark:to-rose-950/40 border border-rose-300 dark:border-rose-800/80 animate-pulse-border-red flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>ការដាស់តឿន៖ មាន {toKhmerNumber(overdueTasksCount)} ភារកិច្ចហួសកាលកំណត់ (Overdue Tasks)</span>
              </h4>
              <p className="text-[10px] sm:text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                កិច្ចការទាំងនេះត្រូវបានរំលេចដោយស៊ុមក្រហមភ្លឹបភ្លែត (Pulsating Red Border) ដើម្បីទាក់ទាញចំណាប់អារម្មណ៍ និងដោះស្រាយជាបន្ទាន់!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[10px] font-bold shadow-xs shrink-0 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            <span>បន្ទាន់</span>
          </span>
        </div>
      )}

      {/* Content Area */}

      {sortedTasks.length === 0 ? (
        <div className="p-10 text-center">
          {activeSearch ? (
            <div className="max-w-sm mx-auto">
              <SearchX className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100">រកមិនឃើញកិច្ចការដែលត្រូវគ្នាទេ</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
                មិនមានកិច្ចការណាដែលមានចំណងជើង ឬការពិពណ៌នាត្រូវនឹងពាក្យ «{activeSearch}» ឡើយ។
              </p>
              <button
                type="button"
                id="tasklist-empty-clear-search-btn"
                onClick={handleClearSearch}
                className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                សម្អាតការស្វែងរក (Clear search)
              </button>
            </div>
          ) : filters?.period === 'completed' ? (
            <div className="max-w-sm mx-auto">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100">មិនទាន់មានកិច្ចការដែលបានបញ្ចប់ទេ</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">នៅពេលអ្នកបញ្ចប់កិច្ចការ វានឹងបង្ហាញនៅទីនេះ។</p>
            </div>
          ) : filters?.period === 'archived' ? (
            <div className="max-w-sm mx-auto">
              <Archive className="w-8 h-8 mx-auto text-amber-500 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100">គ្មានកិច្ចការក្នុងប័ណ្ណសារទេ</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                នៅពេលអ្នកចុចប៊ូតុង Archive លើកិច្ចការដែលបានបញ្ចប់ វានឹងត្រូវផ្លាស់ទីមករក្សាទុកនៅទីនេះ ដើម្បីកុំឱ្យរញ៉េរញ៉ៃលើផ្ទាំងធំ។
              </p>
            </div>
          ) : (
            <div className="max-w-sm mx-auto">
              <PlusCircle className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-100">មិនទាន់មានកិច្ចការនៅក្នុងបញ្ជីនេះទេ</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 mb-3">បន្ថែមកិច្ចការថ្មី ដើម្បីចាប់ផ្តើមផលិតភាពរបស់អ្នក។</p>
              {canCreateTask && (
                <button
                  onClick={onOpenNewTask}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-purple-500/25 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  + បន្ថែមកិច្ចការថ្មី
                </button>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 select-none">
              <tr>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase text-center w-12 sm:w-14">
                  ស្ថានភាព
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                  ឈ្មោះភារកិច្ច
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                  អាទិភាព
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                  ពេលវេលា
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase text-right">
                  សកម្មភាព
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onToggleSubtask={onToggleSubtask}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStartFocusTimer={onStartFocusTimer}
                  onToggleArchive={onToggleArchive}
                  isTableRow={true}
                  canEdit={canEditTask}
                  canDelete={canDeleteTask}
                  canToggleComplete={canToggleComplete}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-3 space-y-2.5">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onToggleSubtask={onToggleSubtask}
              onEdit={onEdit}
              onDelete={onDelete}
              onStartFocusTimer={onStartFocusTimer}
              onToggleArchive={onToggleArchive}
              isTableRow={false}
              canEdit={canEditTask}
              canDelete={canDeleteTask}
              canToggleComplete={canToggleComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
