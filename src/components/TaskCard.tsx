import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  Bell,
  MoreVertical,
  Play,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  Repeat,
  CheckCircle2,
  User,
  AlertTriangle,
  AlertCircle,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { Task } from '../types';
import {
  CATEGORIES_CONFIG,
  PRIORITIES_CONFIG,
  REMINDER_OPTIONS,
  RECURRING_OPTIONS,
  toKhmerNumber,
} from '../utils/translations';
import { formatKhmerTime, getRelativeDueDateText } from '../utils/khmerDates';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStartFocusTimer: (task: Task) => void;
  onToggleArchive?: (task: Task) => void;
  isTableRow?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canToggleComplete?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
  onStartFocusTimer,
  onToggleArchive,
  isTableRow = true,
  canEdit = true,
  canDelete = true,
  canToggleComplete = true,
}) => {
  const [showSubtasks, setShowSubtasks] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const category = CATEGORIES_CONFIG[task.category] || CATEGORIES_CONFIG.other;
  const priority = PRIORITIES_CONFIG[task.priority] || PRIORITIES_CONFIG.medium;
  const dueInfo = getRelativeDueDateText(task.dueDate, task.dueTime);
  const isTaskOverdue = !task.completed && dueInfo.isOverdue;
  const recurringOpt = (RECURRING_OPTIONS || []).find((r) => r.id === task.recurring);

  const subtaskList = task.subtasks || [];
  const totalSubtasks = subtaskList.length;
  const completedSubtasks = subtaskList.filter((s) => s.completed).length;

  // High Density Priority Badge Classes with Colorful Gradients
  let priorityBadgeClass = 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
  if (task.priority === 'urgent' || task.priority === 'high') {
    priorityBadgeClass = 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/70 dark:to-pink-950/70 text-rose-700 dark:text-rose-300 border border-rose-300/80 dark:border-rose-800/80 shadow-2xs font-extrabold';
  } else if (task.priority === 'medium') {
    priorityBadgeClass = 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/70 dark:to-purple-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-300/80 dark:border-indigo-800/80 shadow-2xs font-bold';
  } else if (task.priority === 'low') {
    priorityBadgeClass = 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800/80 shadow-2xs font-bold';
  }

  if (isTableRow) {
    return (
      <>
        <tr
          id={`task-row-${task.id}`}
          className={`transition-colors group cursor-pointer ${
            task.completed
              ? 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850/60'
              : isTaskOverdue
              ? 'animate-pulse-row-red bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 border-l-4 border-l-rose-500 dark:border-l-rose-500'
              : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/50'
          }`}
        >
          {/* Status Checkbox */}
          <td className="px-3 sm:px-4 py-2.5 text-center w-12 sm:w-14">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canToggleComplete) onToggleComplete(task);
              }}
              disabled={!canToggleComplete}
              className={`p-1 rounded transition-all duration-200 hover:scale-110 active:scale-90 ${
                !canToggleComplete ? 'opacity-40 cursor-not-allowed' :
                task.completed
                  ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer animate-pop-bounce'
                  : isTaskOverdue
                  ? 'text-rose-500 dark:text-rose-400 hover:text-rose-600 cursor-pointer'
                  : 'text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer'
              }`}
              title={!canToggleComplete ? 'គ្មានសិទ្ធិផ្លាស់ប្តូរស្ថានភាព' : task.completed ? 'មិនទាន់រួចរាល់' : 'រួចរាល់'}
            >
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </td>

          {/* Task Title & Category */}
          <td className="px-3 sm:px-4 py-2.5 min-w-[200px]" onClick={() => canEdit && onEdit(task)}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs sm:text-sm font-semibold transition-colors ${
                  task.completed
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : isTaskOverdue
                    ? 'text-rose-950 dark:text-rose-200 font-bold group-hover:text-rose-700 dark:group-hover:text-rose-300'
                    : 'text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}
              >
                {task.title}
              </span>

              {/* Pulsating Overdue Visual Badge for Table Row */}
              {isTaskOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs animate-pulse-badge-red shrink-0">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-200"></span>
                  </span>
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>ហួសកំណត់</span>
                </span>
              )}

              {task.recurring && task.recurring !== 'none' && (
                <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/50 px-1.5 py-0.2 rounded font-medium">
                  {recurringOpt?.labelKm}
                </span>
              )}

              {task.archived && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
                  <Archive className="w-2.5 h-2.5" />
                  <span>ប័ណ្ណសារ</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className={`text-[10px] italic font-medium ${isTaskOverdue ? 'text-rose-600/80 dark:text-rose-400/80 font-semibold' : 'text-slate-400 dark:text-slate-500'}`}>
                {category.labelKm}
                {task.description ? ` • ${task.description}` : ''}
              </p>
              {task.assigneeName && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 font-medium">
                  <User className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{task.assigneeName}</span>
                </span>
              )}
              {totalSubtasks > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSubtasks(!showSubtasks);
                  }}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-0.5 cursor-pointer"
                >
                  <span>
                    ({toKhmerNumber(completedSubtasks)}/{toKhmerNumber(totalSubtasks)})
                  </span>
                  {showSubtasks ? (
                    <ChevronUp className="w-2.5 h-2.5" />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5" />
                  )}
                </button>
              )}
            </div>
          </td>

          {/* Priority */}
          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded ${priorityBadgeClass}`}
            >
              {priority.labelKm}
            </span>
          </td>

          {/* Due Time & Date */}
          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap text-[10px]">
            {isTaskOverdue ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-200 font-bold border border-rose-300 dark:border-rose-800/80 shadow-2xs animate-pulse-badge-red">
                <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{dueInfo.text}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium font-mono tabular-nums">
                <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                <span>{dueInfo.text}</span>
              </div>
            )}
          </td>

          {/* Actions */}
          <td className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap w-28">
            <div className="flex items-center justify-end gap-1">
              {!task.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocusTimer(task);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    isTaskOverdue
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-950/60'
                      : 'text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                  }`}
                  title="ផ្ដោតអារម្មណ៍ (Focus Timer)"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              {onToggleArchive && (task.completed || task.archived) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchive(task);
                  }}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    task.archived
                      ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      : 'text-slate-400 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                  title={task.archived ? 'យកចេញពីប័ណ្ណសារ (Unarchive / Restore)' : 'ទុកក្នុងប័ណ្ណសារ (Archive)'}
                >
                  {task.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                </button>
              )}
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="p-1 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="កែសម្រួល"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="p-1 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                  title="លុប"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </td>
        </tr>

        {/* Subtask Dropdown Rows */}
        {showSubtasks && totalSubtasks > 0 && (
          <tr className="bg-slate-50/70 dark:bg-slate-850/80 border-b border-slate-100 dark:border-slate-800">
            <td colSpan={5} className="px-10 py-2.5">
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                  អនុការងារ (Checklist)
                </div>
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300 py-0.5"
                  >
                    <button
                      onClick={() => onToggleSubtask(task.id, sub.id)}
                      className={`transition-colors cursor-pointer ${
                        sub.completed
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      {sub.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span
                      className={`text-xs ${
                        sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {sub.title}
                    </span>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

  // Card View Mode Fallback with Pulsating Red Border for Overdue Tasks
  return (
    <div
      id={`task-card-${task.id}`}
      className={`group bg-white dark:bg-slate-900 rounded-xl border p-4 transition-all duration-200 card-hover-effect animate-fade-in ${
        task.completed
          ? 'border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 opacity-80'
          : isTaskOverdue
          ? 'border-2 border-rose-500 dark:border-rose-600 bg-gradient-to-br from-white via-rose-50/30 to-rose-50/60 dark:from-slate-900 dark:via-rose-950/20 dark:to-rose-950/40 animate-pulse-border-red shadow-sm'
          : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/60'
      }`}
    >
      {/* Overdue Alert Banner in Card View */}
      {isTaskOverdue && (
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 mb-2.5 rounded-lg bg-rose-100/90 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 text-[11px] font-bold border border-rose-300 dark:border-rose-800/80 shadow-2xs animate-pulse-badge-red">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
            <span>កិច្ចការហួសកាលកំណត់ (Overdue Task) — សូមប្រញាប់ដោះស្រាយ!</span>
          </div>
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        <button
          onClick={() => canToggleComplete && onToggleComplete(task)}
          disabled={!canToggleComplete}
          className={`shrink-0 mt-0.5 transition-colors ${
            !canToggleComplete ? 'opacity-40 cursor-not-allowed' :
            task.completed
              ? 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 cursor-pointer'
              : isTaskOverdue
              ? 'text-rose-400 dark:text-rose-400 hover:text-rose-600 cursor-pointer'
              : 'text-slate-300 dark:text-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer'
          }`}
        >
          {task.completed ? (
            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-1.5 py-0.5 rounded font-medium">
                {category.labelKm}
              </span>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${priorityBadgeClass}`}>
                {priority.labelKm}
              </span>
              {isTaskOverdue && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-black rounded bg-rose-600 text-white shadow-2xs">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>បន្ទាន់</span>
                </span>
              )}
              {task.assigneeName && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-800/60 font-medium">
                  <User className="w-2.5 h-2.5" />
                  <span>{task.assigneeName}</span>
                </span>
              )}
              {task.archived && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 font-bold">
                  <Archive className="w-2.5 h-2.5" />
                  <span>ប័ណ្ណសារ</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {!task.completed && (
                <button
                  onClick={() => onStartFocusTimer(task)}
                  className={`p-1 rounded cursor-pointer ${
                    isTaskOverdue
                      ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60'
                      : 'text-slate-400 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                  }`}
                  title="ផ្ដោត"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              {onToggleArchive && (task.completed || task.archived) && (
                <button
                  onClick={() => onToggleArchive(task)}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    task.archived
                      ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      : 'text-slate-400 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                  title={task.archived ? 'យកចេញពីប័ណ្ណសារ (Unarchive / Restore)' : 'ទុកក្នុងប័ណ្ណសារ (Archive)'}
                >
                  {task.archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <h3
            className={`text-sm font-semibold cursor-pointer ${
              task.completed
                ? 'line-through text-slate-400 dark:text-slate-500'
                : isTaskOverdue
                ? 'text-rose-950 dark:text-rose-200 font-bold'
                : 'text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
            onClick={() => canEdit && onEdit(task)}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            <span className={`flex items-center gap-1 ${isTaskOverdue ? 'text-rose-700 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/60' : ''}`}>
              {isTaskOverdue ? <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> : <Clock className="w-3 h-3" />}
              {dueInfo.text}
            </span>
            {task.creatorName && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                បង្កើត៖ {task.creatorName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


