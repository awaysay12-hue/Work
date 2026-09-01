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
  const recurringOpt = (RECURRING_OPTIONS || []).find((r) => r.id === task.recurring);

  const subtaskList = task.subtasks || [];
  const totalSubtasks = subtaskList.length;
  const completedSubtasks = subtaskList.filter((s) => s.completed).length;

  // High Density Priority Badge Classes
  let priorityBadgeClass = 'bg-slate-100 text-slate-600';
  if (task.priority === 'urgent' || task.priority === 'high') {
    priorityBadgeClass = 'bg-rose-100 text-rose-700';
  } else if (task.priority === 'medium') {
    priorityBadgeClass = 'bg-indigo-100 text-indigo-700';
  }

  if (isTableRow) {
    return (
      <>
        <tr
          id={`task-row-${task.id}`}
          className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
            task.completed ? 'bg-slate-50/40 text-slate-400' : ''
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
              className={`p-1 rounded transition-colors ${
                !canToggleComplete ? 'opacity-40 cursor-not-allowed' :
                task.completed
                  ? 'text-indigo-600 hover:text-indigo-700 cursor-pointer'
                  : 'text-slate-300 hover:text-indigo-600 cursor-pointer'
              }`}
              title={!canToggleComplete ? 'គ្មានសិទ្ធិផ្លាស់ប្តូរស្ថានភាព' : task.completed ? 'មិនទាន់រួចរាល់' : 'រួចរាល់'}
            >
              {task.completed ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </td>

          {/* Task Title & Category */}
          <td className="px-3 sm:px-4 py-2.5 min-w-[200px]" onClick={() => canEdit && onEdit(task)}>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors ${
                  task.completed ? 'line-through text-slate-400' : ''
                }`}
              >
                {task.title}
              </span>
              {task.recurring && task.recurring !== 'none' && (
                <span className="text-[10px] text-purple-600 bg-purple-50 px-1 py-0.2 rounded font-medium">
                  {recurringOpt?.labelKm}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-[10px] text-slate-400 italic font-medium">
                {category.labelKm}
                {task.description ? ` • ${task.description}` : ''}
              </p>
              {task.assigneeName && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                  <User className="w-2.5 h-2.5 text-indigo-600" />
                  <span>{task.assigneeName}</span>
                </span>
              )}
              {totalSubtasks > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSubtasks(!showSubtasks);
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-0.5"
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
          <td className="px-3 sm:px-4 py-2.5 whitespace-nowrap text-[10px] text-slate-500 font-medium">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{dueInfo.text}</span>
            </div>
          </td>

          {/* Actions */}
          <td className="px-3 sm:px-4 py-2.5 text-right whitespace-nowrap w-24">
            <div className="flex items-center justify-end gap-1">
              {!task.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartFocusTimer(task);
                  }}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="ផ្ដោតអារម្មណ៍ (Focus Timer)"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(task);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
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
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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
          <tr className="bg-slate-50/70 border-b border-slate-100">
            <td colSpan={5} className="px-10 py-2.5">
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  អនុការងារ (Checklist)
                </div>
                {task.subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center space-x-2 text-xs text-slate-600 py-0.5"
                  >
                    <button
                      onClick={() => onToggleSubtask(task.id, sub.id)}
                      className={`transition-colors ${
                        sub.completed
                          ? 'text-indigo-600'
                          : 'text-slate-300 hover:text-indigo-600'
                      }`}
                    >
                      {sub.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span
                      className={`text-xs ${
                        sub.completed ? 'line-through text-slate-400' : ''
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

  // Card View Mode Fallback
  return (
    <div
      id={`task-card-${task.id}`}
      className={`group bg-white rounded-xl border p-4 transition-all duration-200 card-hover-effect animate-fade-in ${
        task.completed
          ? 'border-slate-200 bg-slate-50/60 opacity-80'
          : dueInfo.isOverdue
          ? 'border-rose-200'
          : 'border-slate-200 hover:border-indigo-200'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => canToggleComplete && onToggleComplete(task)}
          disabled={!canToggleComplete}
          className={`shrink-0 mt-0.5 transition-colors ${
            !canToggleComplete ? 'opacity-40 cursor-not-allowed' :
            task.completed
              ? 'text-indigo-600 hover:text-indigo-700 cursor-pointer'
              : 'text-slate-300 hover:text-indigo-600 cursor-pointer'
          }`}
        >
          {task.completed ? (
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                {category.labelKm}
              </span>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${priorityBadgeClass}`}>
                {priority.labelKm}
              </span>
              {task.assigneeName && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
                  <User className="w-2.5 h-2.5" />
                  <span>{task.assigneeName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {!task.completed && (
                <button
                  onClick={() => onStartFocusTimer(task)}
                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                  title="ផ្ដោត"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(task.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <h3
            className={`text-sm font-semibold text-slate-800 ${
              task.completed ? 'line-through text-slate-400' : ''
            }`}
            onClick={() => canEdit && onEdit(task)}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {dueInfo.text}
            </span>
            {task.creatorName && (
              <span className="text-[9px] text-slate-400">
                បង្កើត៖ {task.creatorName}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

