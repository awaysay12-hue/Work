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
    if (!title.trim()) return;

    const todayStr = getTodayDateString();
    const isRegularMember = currentUser?.role === 'member' || currentUser?.role === 'viewer';

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
      creatorId: currentUser ? currentUser.id : undefined,
      creatorName: currentUser ? (currentUser.khmerName || currentUser.name) : undefined,
      assigneeId: isRegularMember && currentUser ? currentUser.id : undefined,
      assigneeName: isRegularMember && currentUser ? (currentUser.khmerName || currentUser.name) : undefined,
    };

    soundFx.playClick();
    onAddTask(newTask);
    setTitle('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-xs hover:border-slate-300 transition-all focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500"
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 ml-1">
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>

        <input
          type="text"
          id="quick-add-task-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="បន្ថែមការងារថ្មីរហ័សសម្រាប់ថ្ងៃនេះ..."
          className="flex-1 text-xs bg-transparent border-none focus:outline-none placeholder-slate-400 font-medium text-slate-800"
        />

        <div className="flex items-center space-x-1.5 shrink-0">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            className="hidden sm:block text-[11px] bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-600 focus:outline-none"
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
            className={`px-3 py-1 rounded-md font-bold text-xs transition-all ${
              title.trim()
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            + បន្ថែម
          </button>
        </div>
      </div>
    </form>
  );
};
