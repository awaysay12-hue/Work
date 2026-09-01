import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Calendar,
  Share2,
  Copy,
  Check,
  Printer,
  Download,
  X,
  Sparkles,
  PieChart,
  User,
  Building,
  Layers,
  ChevronRight,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Task, UserAccount } from '../types';
import { getTodayKhmerFormatted } from '../utils/khmerDates';
import { soundFx } from '../utils/sound';

interface TodaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  currentUser?: UserAccount;
  allUsers?: UserAccount[];
}

export const TodaySummaryModal: React.FC<TodaySummaryModalProps> = ({
  isOpen,
  onClose,
  tasks,
  currentUser,
  allUsers = [],
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'text' | 'breakdown'>('overview');

  // Filter tasks for today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayKhmerDate = useMemo(() => getTodayKhmerFormatted(), []);

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Is due today or created today
      const isDueToday = t.dueDate === todayStr;
      const isCreatedToday = t.createdAt && t.createdAt.startsWith(todayStr);
      return isDueToday || isCreatedToday;
    });
  }, [tasks, todayStr]);

  // Statistics
  const stats = useMemo(() => {
    const total = todayTasks.length;
    const completedTasks = todayTasks.filter((t) => t.completed);
    const pendingTasks = todayTasks.filter((t) => !t.completed);
    const urgentTasks = todayTasks.filter((t) => t.priority === 'urgent' && !t.completed);
    const highTasks = todayTasks.filter((t) => t.priority === 'high' && !t.completed);

    const completedCount = completedTasks.length;
    const pendingCount = pendingTasks.length;
    const rate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    const totalEstMinutes = todayTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
    const totalSpentMinutes = todayTasks.reduce((acc, t) => acc + (t.spentMinutes || 0), 0);

    // Categories breakdown
    const categoryMap: Record<string, { total: number; completed: number }> = {};
    todayTasks.forEach((t) => {
      const cat = t.category || 'other';
      if (!categoryMap[cat]) categoryMap[cat] = { total: 0, completed: 0 };
      categoryMap[cat].total += 1;
      if (t.completed) categoryMap[cat].completed += 1;
    });

    return {
      total,
      completedCount,
      pendingCount,
      urgentCount: urgentTasks.length,
      highCount: highTasks.length,
      rate,
      totalEstMinutes,
      totalSpentMinutes,
      categoryMap,
      completedTasks,
      pendingTasks,
    };
  }, [todayTasks]);

  // Generate Khmer Text Report for Telegram / WhatsApp / Manager
  const generatedReportText = useMemo(() => {
    const userName = currentUser?.khmerName || currentUser?.name || 'សមាជិកក្រុមការងារ';
    const dept = currentUser?.department || 'ផ្នែកទូទៅ';
    const completionIcon = stats.rate >= 80 ? '🌟' : stats.rate >= 50 ? '⚡' : '📌';

    let text = `📊 របាយការណ៍កិច្ចការប្រចាំថ្ងៃ (Daily Work Summary)\n`;
    text += `📅 កាលបរិច្ឆេទ៖ ${todayKhmerDate}\n`;
    text += `👤 អ្នករាយការណ៍៖ ${userName} (${dept})\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📈 វឌ្ឍនភាពសរុប៖ ${stats.rate}% (${stats.completedCount}/${stats.total} កិច្ចការ) ${completionIcon}\n`;
    text += `⏱️ រយៈពេល Focus សរុប៖ ${stats.totalSpentMinutes} នាទី\n\n`;

    if (stats.completedTasks.length > 0) {
      text += `✅ កិច្ចការដែលបានបញ្ចប់ (${stats.completedTasks.length})៖\n`;
      stats.completedTasks.forEach((t, i) => {
        const time = t.dueTime ? ` [ម៉ោង ${t.dueTime}]` : '';
        text += `  ${i + 1}. ${t.title}${time}\n`;
      });
      text += `\n`;
    }

    if (stats.pendingTasks.length > 0) {
      text += `⏳ កិច្ចការកំពុងបន្ត / មិនទាន់បញ្ចប់ (${stats.pendingTasks.length})៖\n`;
      stats.pendingTasks.forEach((t, i) => {
        const priorityTag = t.priority === 'urgent' ? ' [បន្ទាន់]' : t.priority === 'high' ? ' [សំខាន់]' : '';
        const time = t.dueTime ? ` [កំណត់ម៉ោង ${t.dueTime}]` : '';
        text += `  ${i + 1}. ${t.title}${priorityTag}${time}\n`;
      });
      text += `\n`;
    }

    text += `📝 ការវាយតម្លៃសង្ខេប៖ `;
    if (stats.total === 0) {
      text += `ថ្ងៃនេះមិនទាន់មានកិច្ចការក្នុងបញ្ជីនៅឡើយ។`;
    } else if (stats.rate === 100) {
      text += `អស្ចារ្យណាស់! បានសម្រេចកិច្ចការ ១០០% តាមផែនការដែលបានគ្រោងទុក។ 🎉`;
    } else if (stats.rate >= 70) {
      text += `ការងារដំណើរការបានល្អប្រសើរ សម្រេចបានភាគច្រើននៃគោលដៅប្រចាំថ្ងៃ។ 👍`;
    } else {
      text += `កំពុងបន្តសម្រុកលើកិច្ចការដែលនៅសេសសល់ដើម្បីសម្រេចតាមកាលកំណត់។ 💪`;
    }

    return text;
  }, [currentUser, todayKhmerDate, stats]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    soundFx.playClick();
    navigator.clipboard.writeText(generatedReportText);
    setCopied(true);
    soundFx.playCelebration();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTelegram = () => {
    soundFx.playClick();
    const encoded = encodeURIComponent(generatedReportText);
    window.open(`https://t.me/share/url?url=&text=${encoded}`, '_blank');
  };

  const handlePrint = () => {
    soundFx.playClick();
    window.print();
  };

  const handleDownloadTxt = () => {
    soundFx.playClick();
    const element = document.createElement('a');
    const file = new Blob([generatedReportText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `daily_report_${todayStr}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto transition-all animate-fade-in print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-scale-in print:shadow-none print:border-none print:max-w-full">
        {/* Modal Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/40 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-2 ring-white/20 shrink-0 print:hidden">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white print:text-slate-900">
                    សរុបរបាយការណ៍ថ្ងៃនេះ
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 print:border-slate-400 print:text-slate-700">
                    Daily Report
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-200/80 mt-0.5 print:text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{todayKhmerDate}</span>
                  {currentUser && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-white print:text-slate-900">
                        {currentUser.khmerName || currentUser.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm cursor-pointer print:hidden"
              title="បិទ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 flex gap-1 p-1 bg-slate-900/80 rounded-2xl border border-indigo-500/20 text-xs shadow-inner print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>ទិដ្ឋភាពទូទៅ (Overview)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>អត្ថបទរបាយការណ៍ (Text)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('breakdown')}
              className={`flex-1 py-1.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'breakdown'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>បញ្ជីកិច្ចការលម្អិត ({stats.total})</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              {/* Top 4 Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Total */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 block">កិច្ចការសរុបថ្ងៃនេះ</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                    <span className="text-xs text-slate-500">កិច្ចការ</span>
                  </div>
                </div>

                {/* 2. Completed */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700 block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>បានបញ្ចប់</span>
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-emerald-700">{stats.completedCount}</span>
                    <span className="text-xs font-bold text-emerald-600">({stats.rate}%)</span>
                  </div>
                </div>

                {/* 3. Pending */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-700 block flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>កំពុងបន្ត / នៅសល់</span>
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-amber-800">{stats.pendingCount}</span>
                    <span className="text-xs text-amber-600">កិច្ចការ</span>
                  </div>
                </div>

                {/* 4. Focus Time */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200">
                  <span className="text-[11px] font-bold text-indigo-700 block flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ម៉ោង Focus សរុប</span>
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-indigo-800">{stats.totalSpentMinutes}</span>
                    <span className="text-xs text-indigo-600">នាទី</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Rate Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="relative flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">អត្រាសម្រេចកិច្ចការថ្ងៃនេះ (Completion Rate)</span>
                  </div>
                  <span className="text-lg font-black text-emerald-400">{stats.rate}%</span>
                </div>

                {/* Progress bar container */}
                <div className="w-full bg-slate-800/80 rounded-full h-3.5 p-0.5 border border-white/10 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, stats.rate))}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-300 mt-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {stats.rate === 100
                      ? 'អស្ចារ្យណាស់! អ្នកបានសម្រេចកិច្ចការទាំងអស់ ១០០% សម្រាប់ថ្ងៃនេះ។'
                      : stats.rate >= 50
                      ? `បានសម្រេច ${stats.completedCount} ក្នុងចំណោម ${stats.total} កិច្ចការ។ នៅសល់តែ ${stats.pendingCount} ទៀតប៉ុណ្ណោះ!`
                      : `នៅសល់ ${stats.pendingCount} កិច្ចការទៀត។ សូមបន្តប្រឹងប្រែងដើម្បីសម្រេចគោលដៅថ្ងៃនេះ!`}
                  </span>
                </p>
              </div>

              {/* Category Breakdown Chips */}
              <div>
                <span className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>បែងចែកតាមប្រភេទកិច្ចការ (Category Distribution)</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.entries(stats.categoryMap) as [string, { total: number; completed: number }][]).map(([catKey, data]) => {
                    const catRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
                    return (
                      <div key={catKey} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800 capitalize">{catKey}</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {data.completed}/{data.total}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${catRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT REPORT FORMAT (FOR COPYING & TELEGRAM) */}
          {activeTab === 'text' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>អត្ថបទរបាយការណ៍ស្រង់រួច (Ready to Copy/Share)</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-200 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'បានចម្លងរួចរាល់!' : 'ចម្លងអត្ថបទ (Copy)'}</span>
                </button>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  readOnly
                  rows={12}
                  value={generatedReportText}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 select-all"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DETAILED TASK BREAKDOWN */}
          {activeTab === 'breakdown' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-slate-800">បញ្ជីកិច្ចការថ្ងៃនេះ ({todayTasks.length})</span>
                <span>
                  បានបញ្ចប់: <strong className="text-emerald-600">{stats.completedCount}</strong> | នៅសល់:{' '}
                  <strong className="text-amber-600">{stats.pendingCount}</strong>
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {todayTasks.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    មិនទាន់មានកិច្ចការសម្រាប់ថ្ងៃនេះនៅឡើយទេ
                  </div>
                ) : (
                  todayTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                        t.completed
                          ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-600'
                          : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            t.completed
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {t.completed && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="truncate">
                          <span
                            className={`text-xs font-bold block truncate ${
                              t.completed ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {t.title}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                            {t.dueTime && <span>⏰ {t.dueTime}</span>}
                            {t.category && <span className="capitalize font-medium">🏷️ {t.category}</span>}
                            {t.assigneeName && <span>👤 {t.assigneeName}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            t.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : t.priority === 'high'
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : t.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center gap-2">
            {/* Share to Telegram */}
            <button
              type="button"
              onClick={handleShareTelegram}
              className="px-3.5 py-2 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>ផ្ញើទៅ Telegram</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            {/* Download Text */}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hidden sm:flex"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ទាញយក .TXT</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'បានចម្លង!' : 'ចម្លងរបាយការណ៍ (Copy)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
