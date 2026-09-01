import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Bell,
  Repeat,
  Sparkles,
  Tag,
  CheckCircle2,
  ListTodo,
  User,
  Users,
} from 'lucide-react';
import { Task, TaskCategory, PriorityLevel, ReminderTiming, RecurrenceType, Subtask, UserAccount } from '../types';
import {
  CATEGORIES_CONFIG,
  PRIORITIES_CONFIG,
  REMINDER_OPTIONS,
  RECURRING_OPTIONS,
  toKhmerNumber,
} from '../utils/translations';
import { getTodayDateString, getTomorrowDateString } from '../utils/khmerDates';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  editingTask: Task | null;
  users?: UserAccount[];
  currentUser?: UserAccount;
  canAssignTask?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTask,
  users = [],
  currentUser,
  canAssignTask = true,
}) => {
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('09:00');
  const [reminderTiming, setReminderTiming] = useState<ReminderTiming>('15m_before');
  const [recurring, setRecurring] = useState<RecurrenceType>('none');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>(currentUser ? currentUser.id : '');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate || todayStr);
      setDueTime(editingTask.dueTime || '09:00');
      setReminderTiming(editingTask.reminderTiming || '15m_before');
      setRecurring(editingTask.recurring || 'none');
      setEstimatedMinutes(editingTask.estimatedMinutes || 30);
      setSubtasks(editingTask.subtasks || []);
      setTags(editingTask.tags || []);
      setAssigneeId(editingTask.assigneeId || (currentUser ? currentUser.id : ''));
    } else {
      setTitle('');
      setDescription('');
      setCategory('work');
      setPriority('medium');
      setDueDate(todayStr);
      setDueTime('09:00');
      setReminderTiming('15m_before');
      setRecurring('none');
      setEstimatedMinutes(30);
      setSubtasks([]);
      setTags([]);
      setAssigneeId(currentUser ? currentUser.id : '');
    }
  }, [editingTask, isOpen, todayStr, currentUser]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `sub-${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const cleanTag = newTag.trim().replace(/^#/, '');
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = users.find((u) => u.id === assigneeId);

    const taskData: Task = {
      id: editingTask ? editingTask.id : `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate,
      dueTime: dueTime || undefined,
      reminderTiming,
      completed: editingTask ? editingTask.completed : false,
      completedAt: editingTask ? editingTask.completedAt : undefined,
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      subtasks,
      estimatedMinutes: Number(estimatedMinutes) || 0,
      spentMinutes: editingTask ? editingTask.spentMinutes || 0 : 0,
      recurring,
      tags,
      assigneeId: assignedUser ? assignedUser.id : (currentUser ? currentUser.id : undefined),
      assigneeName: assignedUser ? assignedUser.khmerName : (currentUser ? currentUser.khmerName : undefined),
      creatorId: editingTask ? editingTask.creatorId : (currentUser ? currentUser.id : undefined),
      creatorName: editingTask ? editingTask.creatorName : (currentUser ? currentUser.khmerName : undefined),
    };

    onSave(taskData);
    onClose();
  };

  // Quick template suggestions in Khmer
  const quickTemplates = [
    { title: 'កិច្ចប្រជុំក្រុមការងារប្រចាំសប្តាហ៍', cat: 'work' as TaskCategory, prio: 'high' as PriorityLevel },
    { title: 'ហាត់ប្រាណ រត់ ៣០ នាទី', cat: 'health' as TaskCategory, prio: 'medium' as PriorityLevel },
    { title: 'អានសៀវភៅ ឬអត្ថបទបច្ចេកទេស', cat: 'study' as TaskCategory, prio: 'low' as PriorityLevel },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <ListTodo className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {editingTask ? 'កែសម្រួលកិច្ចការ' : 'បង្កើតកិច្ចការថ្មី'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Quick suggestions when creating new task */}
          {!editingTask && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 shrink-0 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-indigo-500" /> គំរូកិច្ចការ៖
              </span>
              {quickTemplates.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTitle(item.title);
                    setCategory(item.cat);
                    setPriority(item.prio);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs whitespace-nowrap transition-colors"
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ចំណងជើងកិច្ចការ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="task-title-input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ឧ. បញ្ចប់របាយការណ៍គម្រោង, រៀនភាសា..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium placeholder-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ខ្លឹមសារលម្អិត (ស្រេចចិត្ត)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="កត់ត្រាចំណុចសំខាន់ៗដែលត្រូវបំពេញ..."
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ប្រភេទកិច្ចការ
              </label>
              <select
                id="task-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {Object.values(CATEGORIES_CONFIG).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.labelKm} ({c.labelEn})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                កម្រិតអាទិភាព
              </label>
              <select
                id="task-priority-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {Object.values(PRIORITIES_CONFIG).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.labelKm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Assignment (RBAC Integration) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>អ្នកទទួលខុសត្រូវកិច្ចការ (Assignee)</span>
              </span>
              {editingTask && editingTask.creatorName && (
                <span className="text-[10px] text-slate-400 font-normal">
                  បង្កើតដោយ៖ {editingTask.creatorName}
                </span>
              )}
            </label>
            <select
              id="task-assignee-select"
              value={assigneeId}
              disabled={!canAssignTask}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {users.length === 0 && currentUser && (
                <option value={currentUser.id}>{currentUser.khmerName} ({currentUser.department})</option>
              )}
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.khmerName} — {u.department} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
            {!canAssignTask && (
              <p className="text-[10px] text-amber-600 mt-1">
                * អ្នកគ្មានសិទ្ធិប្តូរអ្នកទទួលខុសត្រូវកិច្ចការទេ (Permission Required)
              </p>
            )}
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" /> កាលបរិច្ឆេទកំណត់
                </label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setDueDate(todayStr)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    ថ្ងៃនេះ
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setDueDate(tomorrowStr)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    ថ្ងៃស្អែក
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                id="task-duedate-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> ម៉ោងកំណត់
                </label>
                <div className="flex space-x-1">
                  {['09:00', '14:00', '18:00'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDueTime(t)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="time"
                id="task-duetime-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Reminder Timing & Recurrence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                <Bell className="w-3.5 h-3.5 mr-1 text-indigo-500" /> មុខងាររំលឹកកាលកំណត់
              </label>
              <select
                id="task-reminder-select"
                value={reminderTiming}
                onChange={(e) => setReminderTiming(e.target.value as ReminderTiming)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.labelKm}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
                <Repeat className="w-3.5 h-3.5 mr-1 text-purple-500" /> ភាពកើតឡើងវិញ
              </label>
              <select
                id="task-recurring-select"
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as RecurrenceType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              >
                {RECURRING_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.labelKm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated Focus Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" /> រយៈពេលប៉ាន់ស្មាន (នាទី)
              </label>
              <div className="flex items-center space-x-1.5">
                {[15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setEstimatedMinutes(m)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      estimatedMinutes === m
                        ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {toKhmerNumber(m)} នាទី
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              អនុការងារ / បញ្ជីពិនិត្យ (Checklist)
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="បន្ថែមកិច្ចការតូចៗ..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>បន្ថែម</span>
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <span className="text-slate-700">{sub.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1 text-slate-400" /> ស្លាកសម្គាល់ (Tags)
            </label>
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="វាយស្លាក រួចចុច Enter (ឧ. ប្រជុំ, បន្ទាន់)..."
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                + ស្លាក
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center space-x-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              id="save-task-submit-btn"
              className="px-5 py-2 text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingTask ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតកិច្ចការ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
