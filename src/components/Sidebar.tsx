import React from 'react';
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  BellRing,
  BarChart3,
  Flame,
  CheckCircle2,
  HardDrive,
  Settings,
  Plus,
  Volume2,
  VolumeX,
  Database,
  RefreshCw,
  Shield,
  Users,
  LogOut,
  ArrowRightLeft,
  KeyRound,
  Lock,
  FileText,
  Smartphone,
  Zap,
  Link2,
  Wrench,
  Sun,
  Moon,
  Archive,
  PanelLeftClose,
  X,
} from 'lucide-react';
import { ViewFilterPeriod, DailyStreak, Task, UserAccount } from '../types';
import { toKhmerNumber } from '../utils/translations';
import { getTodayDateString } from '../utils/khmerDates';
import { ROLE_CONFIGS } from '../utils/userPermissions';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  currentView: ViewFilterPeriod | 'reminders';
  onNavigate: (view: ViewFilterPeriod | 'reminders') => void;
  streak: DailyStreak;
  tasks: Task[];
  activeRemindersCount: number;
  onOpenNewTask: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onOpenSupabaseModal?: () => void;
  supabaseSyncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  currentUser?: UserAccount;
  usersCount?: number;
  onOpenUserManagement?: () => void;
  onOpenTodaySummary?: () => void;
  onOpenPhoneNotificationModal?: () => void;
  canCreateTask?: boolean;
  canManageUsers?: boolean;
  canSyncCloud?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  onOpenStorageOptimizer?: () => void;
  onOpenPortalLinks?: () => void;
  itExpensesCount?: number;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  streak,
  tasks,
  activeRemindersCount,
  onOpenNewTask,
  soundEnabled,
  onToggleSound,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  onOpenSupabaseModal,
  supabaseSyncStatus = 'synced',
  currentUser,
  usersCount = 5,
  onOpenUserManagement,
  onOpenTodaySummary,
  onOpenPhoneNotificationModal,
  canCreateTask = true,
  canManageUsers = false,
  canSyncCloud = false,
  onOpenAuthModal,
  onLogout,
  onSwitchAccount,
  onOpenStorageOptimizer,
  onOpenPortalLinks,
  itExpensesCount = 0,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const todayStr = getTodayDateString();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate < todayStr);

  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const currentRoleCfg = currentUser ? ROLE_CONFIGS[currentUser.role] : null;

  const navItems: Array<{
    id: ViewFilterPeriod | 'reminders';
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeColor?: string;
  }> = [
    {
      id: 'today',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badgeCount: todayTasks.filter((t) => !t.completed).length,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'all',
      label: 'ភារកិច្ចទាំងអស់',
      icon: ListTodo,
      badgeCount: tasks.filter((t) => !t.archived && !t.completed).length,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'archived',
      label: 'ប័ណ្ណសារ (Archived)',
      icon: Archive,
      badgeCount: tasks.filter((t) => t.archived).length,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'calendar',
      label: 'ប្រតិទិន',
      icon: CalendarDays,
    },
    {
      id: 'it_expenses',
      label: 'កត់ត្រាចំណាយ IT Support',
      icon: Wrench,
      badgeCount: itExpensesCount,
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'analytics',
      label: 'ស្ថិតិ & វឌ្ឍនភាព',
      icon: BarChart3,
    },
  ];

  const content = (
    <div
      className={`w-64 flex flex-col h-full shrink-0 select-none transition-all duration-200 ${
        isDarkMode
          ? 'bg-gradient-to-b from-[#1b0833] via-[#140526] to-[#0d0219] text-purple-100 border-r border-purple-900/50 shadow-2xl shadow-purple-950/60'
          : 'bg-gradient-to-b from-[#fcfaff] via-[#f7f0fe] to-[#f2e6fc] text-slate-800 border-r border-purple-200/90 shadow-sm'
      }`}
    >
      {/* Brand Header */}
      <div
        className={`p-3.5 sm:p-4 border-b flex items-center justify-between transition-colors ${
          isDarkMode
            ? 'border-purple-900/50 bg-[#1b0833]/95 backdrop-blur-md'
            : 'border-purple-200/90 bg-white/85 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center p-1 shadow-sm overflow-hidden border shrink-0 ${
              isDarkMode
                ? 'bg-purple-950 border-purple-700/60 shadow-purple-900/50 ring-1 ring-purple-600/30'
                : 'bg-white border-purple-200 shadow-purple-200/60 ring-1 ring-purple-200/50'
            }`}
          >
            <img
              src="https://media.licdn.com/dms/image/v2/C560BAQF9ZB9CkX4iUA/company-logo_200_200/company-logo_200_200/0/1630643946400/sokha_printing_logo?e=2147483647&v=beta&t=pw-C2fZF3thYSrSFbhK49soL50jSUHpnBkpwzshWplw"
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs">SP</div>';
                }
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className={`font-extrabold text-sm leading-snug tracking-tight truncate ${isDarkMode ? 'text-white' : 'text-purple-950'}`}>
              កម្មវិធីគ្រប់គ្រង
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md truncate inline-flex items-center gap-1 ${
                isDarkMode
                  ? 'bg-purple-900/70 text-purple-200 border border-purple-700/60'
                  : 'bg-purple-100 text-purple-700 border border-purple-200'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                Daily Task Pro
              </span>
            </div>
          </div>
        </div>

        {/* Collapse / Close Button on Desktop and Mobile */}
        <button
          type="button"
          onClick={onToggleCollapse || onCloseMobile}
          className={`p-1.5 rounded-xl transition-all cursor-pointer shrink-0 border ${
            isDarkMode
              ? 'text-purple-300 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border-purple-800/50'
              : 'text-purple-600 hover:text-purple-900 bg-purple-50/80 hover:bg-purple-100 border-purple-200'
          }`}
          title="បង្រួមមឺនុយ (Collapse Sidebar - មើលទំហំធំជាងមុន)"
          aria-label="Collapse sidebar menu"
        >
          <PanelLeftClose className="w-4.5 h-4.5 hidden lg:block" />
          <X className="w-4.5 h-4.5 lg:hidden" />
        </button>
      </div>

      {/* Quick Action Button - Protected by Role */}
      {canCreateTask && (
        <div className="px-3.5 pt-3.5 pb-2">
          <button
            onClick={() => {
              onOpenNewTask();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-600/40 active:scale-[0.98] border border-purple-300/30"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>បន្ថែមកិច្ចការថ្មី +</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400"></span>
            <span>មឺនុយមេ (Main Menu)</span>
          </div>
          <span className="text-[9px] font-mono text-purple-400/80 dark:text-purple-400/70">MENU</span>
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer text-xs group relative overflow-hidden hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-md shadow-purple-700/35 font-bold border border-purple-400/40'
                  : isDarkMode
                  ? 'text-purple-200/85 hover:bg-purple-900/45 hover:text-white font-medium'
                  : 'text-slate-700 hover:bg-purple-100/70 hover:text-purple-950 font-medium'
              }`}
            >
              {/* Left active glowing indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-purple-200 shadow-xs" />
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDarkMode
                      ? 'bg-purple-950/60 text-purple-400 group-hover:text-purple-200'
                      : 'bg-purple-100/70 text-purple-700 group-hover:bg-purple-200/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className={isActive ? 'font-bold' : 'font-semibold'}>{item.label}</span>
              </div>
              {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white border border-white/30 backdrop-blur-xs'
                      : item.id === 'today'
                      ? 'bg-purple-100 dark:bg-purple-900/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/60'
                      : item.id === 'all'
                      ? isDarkMode
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        : 'bg-purple-100/90 text-purple-800 border border-purple-200'
                      : item.id === 'it_expenses'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-purple-900 text-purple-200'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {toKhmerNumber(item.badgeCount)}
                </span>
              )}
            </div>
          );
        })}

        {/* Special Daily Report & Notification Lockscreen Tools */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <span>របាយការណ៍ & រំលឹក</span>
            <span className="text-[9px] font-mono text-purple-400/80 dark:text-purple-400/70">TOOLS</span>
          </div>

          {onOpenTodaySummary && (
            <div
              onClick={() => {
                onOpenTodaySummary();
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-xs font-medium mb-1.5 border group ${
                isDarkMode
                  ? 'text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 hover:text-white border-purple-800/50 shadow-xs'
                  : 'text-purple-950 bg-white/90 hover:bg-purple-100/70 hover:text-purple-900 border-purple-200/90 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100/80 text-purple-700'}`}>
                  <FileText className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="font-semibold">សរុបរបាយការណ៍ថ្ងៃនេះ</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                    : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}
              >
                Daily
              </span>
            </div>
          )}

          {onOpenPhoneNotificationModal && (
            <div
              onClick={() => {
                onOpenPhoneNotificationModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-xs font-medium border group ${
                isDarkMode
                  ? 'text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 hover:text-white border-purple-800/50 shadow-xs'
                  : 'text-purple-950 bg-white/90 hover:bg-purple-100/70 hover:text-purple-900 border-purple-200/90 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100/80 text-purple-700'}`}>
                  <Smartphone className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="font-semibold">Notification Lock Screen</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                  isDarkMode
                    ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                    : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}
              >
                Phone
              </span>
            </div>
          )}
        </div>

        {/* User & Role Management Menu Item - Super Admin Only */}
        {currentUser?.role === 'admin' && onOpenUserManagement && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              <span>ការគ្រប់គ្រង & សិទ្ធិ</span>
              <span className="text-[9px] font-mono text-purple-400/80 dark:text-purple-400/70">ADMIN</span>
            </div>
            <div
              onClick={() => {
                onOpenUserManagement();
                if (onCloseMobile) onCloseMobile();
              }}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-xs font-medium border group ${
                isDarkMode
                  ? 'text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 hover:text-white border-purple-800/50 shadow-xs'
                  : 'text-purple-950 bg-white/90 hover:bg-purple-100/70 hover:text-purple-900 border-purple-200/90 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100/80 text-purple-700'}`}>
                  <Shield className="w-3.5 h-3.5 stroke-[2.2]" />
                </div>
                <span className="font-semibold">សិទ្ធិ & សមាជិក (RBAC)</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                  isDarkMode
                    ? 'bg-purple-500/30 text-purple-300 border-purple-400/30'
                    : 'bg-purple-100 text-purple-700 border-purple-200'
                }`}
              >
                {toKhmerNumber(usersCount)} នាក់
              </span>
            </div>

            {onOpenPortalLinks && (
              <div
                onClick={() => {
                  onOpenPortalLinks();
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer text-xs font-medium mt-1.5 border group ${
                  isDarkMode
                    ? 'text-purple-200 bg-purple-950/40 hover:bg-purple-900/60 hover:text-white border-purple-800/50 shadow-xs'
                    : 'text-purple-950 bg-white/90 hover:bg-purple-100/70 hover:text-purple-900 border-purple-200/90 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100/80 text-purple-700'}`}>
                    <Link2 className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>
                  <span className="font-semibold">Link ច្រកចូល & Whitelist</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                    isDarkMode
                      ? 'bg-purple-500/20 text-purple-300 border-purple-400/30'
                      : 'bg-purple-100 text-purple-700 border-purple-200'
                  }`}
                >
                  Portal
                </span>
              </div>
            )}
          </div>
        )}

        {/* Quick Streak Widget in Nav */}
        <div className="pt-2">
          <div className="flex items-center justify-between px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <span>ការបន្តជាប់គ្នា</span>
            <span className="text-[9px] font-mono text-purple-400/80 dark:text-purple-400/70">STREAK</span>
          </div>
          <div
            className={`mx-1 mt-1 p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              isDarkMode
                ? 'bg-purple-950/50 border-purple-800/50 text-white shadow-xs'
                : 'bg-white/90 border-purple-200/90 text-purple-950 shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                }`}
              >
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <p className={`text-[11px] font-bold leading-none ${isDarkMode ? 'text-white' : 'text-purple-950'}`}>
                  {toKhmerNumber(streak.currentStreak)} ថ្ងៃជាប់គ្នា
                </p>
                <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-purple-300/80' : 'text-purple-600'}`}>
                  វែងបំផុត {toKhmerNumber(streak.longestStreak)} ថ្ងៃ
                </p>
              </div>
            </div>
            <span className="text-xs">🔥</span>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer: Storage / Task Capacity Widget */}
      <div
        className={`p-3.5 border-t space-y-2.5 transition-colors ${
          isDarkMode ? 'border-purple-900/50 bg-[#140525]/90 backdrop-blur-md' : 'border-purple-200/90 bg-white/80 backdrop-blur-md'
        }`}
      >
        {/* Current User Card */}
        {currentUser && currentRoleCfg && (
          <div
            onClick={onOpenAuthModal || onOpenUserManagement}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
              isDarkMode
                ? 'bg-purple-950/60 hover:bg-purple-900/60 border-purple-800/60 text-white shadow-xs'
                : 'bg-white hover:bg-purple-50/80 border-purple-200 text-slate-800 shadow-2xs'
            }`}
            title="ចុចដើម្បីប្តូរគណនី ឬចូលប្រើប្រាស់"
          >
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar
                avatarUrl={currentUser.avatarUrl}
                avatarColor={currentUser.avatarColor}
                avatarInitial={currentUser.avatarInitial}
                name={currentUser.khmerName}
                role={currentUser.role}
                size="sm"
                showBadge={true}
              />
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate leading-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {currentUser.khmerName}
                </p>
                <span className={`text-[10px] truncate block font-medium ${isDarkMode ? 'text-purple-300/80' : 'text-slate-500'}`}>
                  {currentRoleCfg.titleKh}
                </span>
              </div>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentRoleCfg.badgeBg} ${currentRoleCfg.badgeText} ${currentRoleCfg.badgeBorder} shrink-0`}>
              {currentUser.role.toUpperCase()}
            </span>
          </div>
        )}

        {/* Global Dark Mode / Light Mode Toggle Button */}
        {onToggleDarkMode && (
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
              isDarkMode
                ? 'bg-purple-950/60 border-purple-800/60 text-white shadow-xs'
                : 'bg-white/90 border-purple-200/90 shadow-2xs text-purple-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDarkMode
                    ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30'
                    : 'bg-amber-100 text-amber-800 ring-1 ring-amber-200'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-amber-300 fill-amber-300/30" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-600 fill-amber-500/20" />
                )}
              </div>
              <div>
                <p className={`text-[11px] font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-purple-950'}`}>
                  {isDarkMode ? 'ទម្រង់ងងឹត (Dark)' : 'ទម្រង់ពន្លឺ (Light)'}
                </p>
                <p className={`text-[10px] font-medium ${isDarkMode ? 'text-purple-300/80' : 'text-purple-600'}`}>
                  {isDarkMode ? 'Dark Mode សកម្ម' : 'Light Mode សកម្ម'}
                </p>
              </div>
            </div>
            <button
              id="sidebar-dark-mode-toggle"
              type="button"
              onClick={onToggleDarkMode}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isDarkMode
                  ? 'bg-purple-600 border-purple-500 shadow-sm shadow-purple-600/50'
                  : 'bg-purple-200 border-purple-300'
              }`}
              title={isDarkMode ? 'ប្តូរទៅទម្រង់ពន្លឺ (Switch to Light Mode)' : 'ប្តូរទៅទម្រង់ងងឹត (Switch to Dark Mode)'}
              aria-label="Toggle dark mode theme"
            >
              <span
                className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isDarkMode ? 'translate-x-5 text-purple-900' : 'translate-x-0 text-purple-600'
                }`}
              >
                {isDarkMode ? (
                  <Moon className="w-3 h-3 text-purple-700" />
                ) : (
                  <Sun className="w-3 h-3 text-amber-500" />
                )}
              </span>
            </button>
          </div>
        )}

        {/* Sound & Preference quick toggle */}
        <div className={`flex items-center justify-between px-1 text-xs ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${
              isDarkMode ? 'text-purple-300 hover:text-white' : 'text-purple-700 hover:text-purple-950'
            }`}
            title="បិទ/បើកសំឡេងរោទ៍"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-semibold">{soundEnabled ? 'សំឡេង៖ បើក' : 'សំឡេង៖ បិទ'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onSwitchAccount && (
              <button
                onClick={onSwitchAccount}
                className={`text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  isDarkMode ? 'text-purple-300 hover:text-indigo-300' : 'text-purple-700 hover:text-indigo-600'
                }`}
                title="ប្តូរគណនី / ចូលគណនីផ្សេង"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>ប្តូរគណនី</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className={`text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  isDarkMode ? 'text-purple-300 hover:text-rose-300' : 'text-purple-700 hover:text-rose-600'
                }`}
                title="ចាកចេញ"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>ចាកចេញ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent & Collapsible Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out z-20 ${
          isCollapsed ? 'w-0 opacity-0 overflow-hidden pointer-events-none' : 'w-64 opacity-100'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-purple-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#fcfaff] dark:bg-[#1b0833] z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
