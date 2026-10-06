import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, TaskCategory, UserAccount } from '../types';
import { CATEGORIES_CONFIG } from '../utils/translations';
import { getTodayDateString } from '../utils/khmerDates';
import { soundFx } from '../utils/sound';

interface QuickAddBarProps {
  onAddTask: (task: Task) => void;
  currentUser?: UserAccount;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onAddTask, currentUser }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [dueTime, setDueTime] = useState('17:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;

    const todayStr = getTodayDateString();

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: title.trim(),
      category,
      priority: 'medium',
      dueDate: todayStr,
      dueTime: dueTime || undefined,
      reminderTiming: '15m_before',
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: [],
      recurring: 'none',
      tags: [],
      estimatedMinutes: 25,
      spentMinutes: 0,
      creatorId: currentUser.id,
      creatorName: currentUser.khmerName || currentUser.name,
      creatorEmail: currentUser.email,
      assigneeId: currentUser.id,
      assigneeName: currentUser.khmerName || currentUser.name,
      assigneeEmail: currentUser.email,
      department: currentUser.department || 'General',
      visibilityScope: currentUser.role === 'admin' ? 'all' : 'assigned_only',
      verifiedInDatabase: true,
    };

    soundFx.playClick();
    onAddTask(newTask);
    setTitle('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-2 sm:p-2.5 shadow-xs hover:border-purple-300 dark:hover:border-purple-700/60 transition-all duration-300 focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500"
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ml-0.5 transition-all duration-300 ${
            title.trim()
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-xs scale-105 animate-pulse'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </div>

        <input
          type="text"
          id="quick-add-task-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="បន្ថែមការងារថ្មីរហ័សសម្រាប់ថ្ងៃនេះ..."
          className="flex-1 text-xs sm:text-sm bg-transparent border-none focus:outline-none placeholder-slate-400 dark:placeholder-slate-500 font-medium text-slate-800 dark:text-slate-100"
        />

        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="hidden sm:block text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none font-semibold cursor-pointer hover:border-indigo-300 transition-colors"
          >
            {Object.values(CATEGORIES_CONFIG).map((c) => (
              <option key={c.id} value={c.id}>
                {c.labelKm}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!title.trim()}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 ${
              title.trim()
                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-sm hover:shadow-purple-500/25 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            + បន្ថែម
          </button>
        </div>
      </div>
    </form>
  );
};
