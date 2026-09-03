import React, { useState } from 'react';
import {
  Plus,
  LayoutList,
  Table as TableIcon,
  SearchX,
  CheckCircle2,
  PlusCircle,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { Task, TaskFilterState } from '../types';
import { TaskCard } from './TaskCard';
import { getTodayDateString, getTomorrowDateString, getRelativeDueDateText } from '../utils/khmerDates';
import { toKhmerNumber } from '../utils/translations';

interface TaskListProps {
  tasks: Task[];
  filters: TaskFilterState;
  onToggleComplete: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStartFocusTimer: (task: Task) => void;
  onOpenNewTask: () => void;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
  canToggleComplete?: boolean;
  canCreateTask?: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  filters,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
  onStartFocusTimer,
  onOpenNewTask,
  canEditTask = true,
  canDeleteTask = true,
  canToggleComplete = true,
  canCreateTask = true,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  // Filter tasks based on current filter state
  const filteredTasks = tasks.filter((task) => {
    // Period filter
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
      // Show everything
    }

    // Category filter
    if (filters.category !== 'all' && task.category !== filters.category) {
      return false;
    }

    // Priority filter
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
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

    // Search query filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchTags = task.tags?.some((t) => t.toLowerCase().includes(q));
      const matchSubtasks = task.subtasks?.some((s) => s.title.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTags && !matchSubtasks) {
        return false;
      }
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // If not in completed view, completed items go to bottom
    if (filters.period !== 'completed') {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
    }

    if (filters.sortBy === 'dueAsc') {
      const dateDiff = a.dueDate.localeCompare(b.dueDate);
      if (dateDiff !== 0) return dateDiff;
      return (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59');
    }
    if (filters.sortBy === 'dueDesc') {
      const dateDiff = b.dueDate.localeCompare(a.dueDate);
      if (dateDiff !== 0) return dateDiff;
      return (b.dueTime || '00:00').localeCompare(a.dueTime || '00:00');
    }
    if (filters.sortBy === 'priority') {
      const priorityWeights: Record<string, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    }
    if (filters.sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (filters.sortBy === 'created') {
      return b.createdAt.localeCompare(a.createdAt);
    }
    return 0;
  });

  // Count overdue tasks in current sorted view
  const overdueTasksCount = sortedTasks.filter(
    (t) => !t.completed && getRelativeDueDateText(t.dueDate, t.dueTime).isOverdue
  ).length;

  const getListTitle = () => {
    switch (filters.period) {
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
      default:
        return 'បញ្ជីកិច្ចការទាំងអស់';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
      {/* High Density Table Header */}
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-800 text-sm">{getListTitle()}</h3>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
            {sortedTasks.length}
          </span>
          {overdueTasksCount > 0 && (
            <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>ហួសកំណត់ {toKhmerNumber(overdueTasksCount)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="ទិដ្ឋភាពតារាង (Table View)"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-1 rounded text-xs transition-colors ${
                viewMode === 'card' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="ទិដ្ឋភាពកាត (Card View)"
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={onOpenNewTask}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
          >
            បន្ថែមថ្មី +
          </button>
        </div>
      </div>

      {/* Overdue Alert Banner in TaskList */}
      {overdueTasksCount > 0 && (
        <div className="mx-3 sm:mx-4 mt-3 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-rose-500/10 border border-rose-300 animate-pulse-border-red flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <div>
              <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>ការដាស់តឿន៖ មាន {toKhmerNumber(overdueTasksCount)} ភារកិច្ចហួសកាលកំណត់ (Overdue Tasks)</span>
              </h4>
              <p className="text-[10px] sm:text-[11px] text-rose-700 font-medium">
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
          {filters.searchQuery ? (
            <div className="max-w-sm mx-auto">
              <SearchX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <h4 className="text-xs font-bold text-slate-700">រកមិនឃើញកិច្ចការដែលត្រូវគ្នាទេ</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">សូមសាកល្បងស្វែងរកដោយប្រើពាក្យគន្លឹះផ្សេង។</p>
            </div>
          ) : filters.period === 'completed' ? (
            <div className="max-w-sm mx-auto">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-700">មិនទាន់មានកិច្ចការដែលបានបញ្ចប់ទេ</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">នៅពេលអ្នកបញ្ចប់កិច្ចការ វានឹងបង្ហាញនៅទីនេះ។</p>
            </div>
          ) : (
            <div className="max-w-sm mx-auto">
              <PlusCircle className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
              <h4 className="text-xs font-bold text-slate-700">មិនទាន់មានកិច្ចការនៅក្នុងបញ្ជីនេះទេ</h4>
              <p className="text-[11px] text-slate-400 mt-0.5 mb-3">បន្ថែមកិច្ចការថ្មី ដើម្បីចាប់ផ្តើមផលិតភាពរបស់អ្នក។</p>
              {canCreateTask && (
                <button
                  onClick={onOpenNewTask}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
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
            <thead className="bg-slate-50 border-b border-slate-100 select-none">
              <tr>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-center w-12 sm:w-14">
                  ស្ថានភាព
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">
                  ឈ្មោះភារកិច្ច
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">
                  អាទិភាព
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase">
                  ពេលវេលា
                </th>
                <th className="px-3 sm:px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase text-right">
                  សកម្មភាព
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleComplete}
                  onToggleSubtask={onToggleSubtask}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStartFocusTimer={onStartFocusTimer}
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
