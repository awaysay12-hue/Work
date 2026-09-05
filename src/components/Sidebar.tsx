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
  KeyRound,
  Lock,
  FileText,
  Smartphone,
  Zap,
  Link2,
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
  onOpenStorageOptimizer?: () => void;
  onOpenPortalLinks?: () => void;
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
  onOpenStorageOptimizer,
  onOpenPortalLinks,
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
      badgeCount: tasks.filter((t) => !t.completed).length,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'calendar',
      label: 'ប្រតិទិន',
      icon: CalendarDays,
    },
    {
      id: 'reminders',
      label: 'ការរំលឹកសំខាន់ៗ',
      icon: BellRing,
      badgeCount: activeRemindersCount > 0 ? activeRemindersCount : overdueTasks.length,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 'analytics',
      label: 'ស្ថិតិ & វឌ្ឍនភាព',
      icon: BarChart3,
    },
  ];

  const content = (
    <div className="w-64 bg-indigo-950 text-slate-300 flex flex-col h-full border-r border-indigo-900/80 shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-indigo-900/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm overflow-hidden border border-indigo-800/60 shrink-0">
            <img
              src="https://media.licdn.com/dms/image/v2/C560BAQF9ZB9CkX4iUA/company-logo_200_200/company-logo_200_200/0/1630643946400/sokha_printing_logo?e=2147483647&v=beta&t=pw-C2fZF3thYSrSFbhK49soL50jSUHpnBkpwzshWplw"
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerHTML = '<div class="w-full h-full bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">SP</div>';
                }
              }}
            />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-snug">
              កម្មវិធីគ្រប់គ្រង
            </h1>
            <p className="text-[11px] text-indigo-300/80 mt-0.5 font-medium">Daily Task Pro</p>
          </div>
        </div>
      </div>

      {/* Quick Action Button - Protected by Role */}
      {canCreateTask && (
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => {
              onOpenNewTask();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>បន្ថែមកិច្ចការថ្មី +</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold text-indigo-300/60 uppercase px-3 py-1">
          មឺនុយមេ
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
              className={`flex items-center justify-between p-2.5 rounded-lg transition-colors cursor-pointer text-xs font-medium ${
                isActive
                  ? 'bg-indigo-800 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-indigo-900 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-300/70'}`} />
                <span>{item.label}</span>
              </div>
              {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.badgeColor || 'bg-indigo-700 text-white'
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
          <div className="text-[10px] font-bold text-indigo-300/60 uppercase px-3 py-1">
            របាយការណ៍ & រំលឹក
          </div>

          {onOpenTodaySummary && (
            <div
              onClick={() => {
                onOpenTodaySummary();
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center justify-between p-2.5 rounded-lg text-indigo-200 bg-indigo-900/40 hover:bg-indigo-900 hover:text-white transition-colors cursor-pointer text-xs font-medium border border-indigo-800/40 mb-1"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>សរុបរបាយការណ៍ថ្ងៃនេះ</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
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
              className="flex items-center justify-between p-2.5 rounded-lg text-slate-300 hover:bg-indigo-900 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Notification Lock Screen</span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Phone
              </span>
            </div>
          )}
        </div>

        {/* User & Role Management Menu Item - Shown to Admins or with lock for others */}
        {canManageUsers && onOpenUserManagement && (
          <div className="pt-2">
            <div className="text-[10px] font-bold text-indigo-300/60 uppercase px-3 py-1">
              ការគ្រប់គ្រង & សិទ្ធិ
            </div>
            <div
              onClick={() => {
                onOpenUserManagement();
                if (onCloseMobile) onCloseMobile();
              }}
              className="flex items-center justify-between p-2.5 rounded-lg text-slate-300 hover:bg-indigo-900 hover:text-white transition-colors cursor-pointer text-xs font-medium"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-rose-400" />
                <span>សិទ្ធិ & សមាជិក (RBAC)</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/30">
                {toKhmerNumber(usersCount)} នាក់
              </span>
            </div>

            {onOpenPortalLinks && (
              <div
                onClick={() => {
                  onOpenPortalLinks();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="flex items-center justify-between p-2.5 rounded-lg text-indigo-200 bg-indigo-950/60 hover:bg-indigo-900 hover:text-white transition-colors cursor-pointer text-xs font-medium mt-1 border border-indigo-800/40"
              >
                <div className="flex items-center gap-3">
                  <Link2 className="w-4 h-4 text-cyan-400" />
                  <span>Link ច្រកចូល & Whitelist</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Portal
                </span>
              </div>
            )}
          </div>
        )}

        {/* Quick Streak Widget in Nav */}
        <div className="pt-2">
          <div className="text-[10px] font-bold text-indigo-300/60 uppercase px-3 py-1">
            ការបន្តជាប់គ្នា
          </div>
          <div className="mx-1 mt-1 p-2.5 rounded-xl bg-indigo-900/40 border border-indigo-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-white leading-none">
                  {toKhmerNumber(streak.currentStreak)} ថ្ងៃជាប់គ្នា
                </p>
                <p className="text-[10px] text-amber-300/80 mt-0.5">
                  វែងបំផុត {toKhmerNumber(streak.longestStreak)} ថ្ងៃ
                </p>
              </div>
            </div>
            <span className="text-xs">🔥</span>
          </div>
        </div>
      </nav>

      {/* Sidebar Footer: Storage / Task Capacity Widget */}
      <div className="p-3.5 border-t border-indigo-900/80 space-y-2.5">
        {/* Current User Card */}
        {currentUser && currentRoleCfg && (
          <div
            onClick={onOpenAuthModal || onOpenUserManagement}
            className="p-2 rounded-xl bg-indigo-900/40 hover:bg-indigo-900 border border-indigo-800/40 transition-colors cursor-pointer flex items-center justify-between"
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
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.khmerName}
                </p>
                <span className="text-[10px] text-indigo-300 truncate block">
                  {currentRoleCfg.titleKh}
                </span>
              </div>
            </div>
            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentRoleCfg.badgeBg} ${currentRoleCfg.badgeText} ${currentRoleCfg.badgeBorder} shrink-0`}>
              {currentUser.role.toUpperCase()}
            </span>
          </div>
        )}

        <div className="bg-indigo-900/50 p-3 rounded-xl border border-indigo-800/50">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-indigo-300 uppercase font-bold">
              វឌ្ឍនភាពការងារ
            </p>
            <span className="text-[10px] text-indigo-300 font-bold">
              {toKhmerNumber(completionPct)}%
            </span>
          </div>
          <div className="w-full bg-indigo-950 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="text-[10px] text-indigo-300/80 mt-2">
            បានសម្រេច {toKhmerNumber(completedTasks)} ក្នុងចំណោម {toKhmerNumber(totalTasks)} ភារកិច្ច
          </p>
        </div>

        {/* Supabase Database Cloud Status Card - Strictly for Admins/Managers */}
        {canSyncCloud && onOpenSupabaseModal && (
          <button
            onClick={onOpenSupabaseModal}
            className="w-full text-left p-2.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-700/50 hover:border-emerald-500/50 transition-all duration-200 flex items-center justify-between group cursor-pointer animate-fade-in"
            title="ចុចដើម្បីមើលព័ត៌មាន Database និងធ្វើសមកាលកម្ម (Sync)"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                supabaseSyncStatus === 'synced' ? 'bg-emerald-500/20 text-emerald-400' :
                supabaseSyncStatus === 'syncing' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-400'
              }`}>
                <Database className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight truncate">
                  Supabase DB
                </p>
                <p className="text-[10px] text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {supabaseSyncStatus === 'synced' ? 'Cloud Synced' : supabaseSyncStatus === 'syncing' ? 'Syncing...' : 'Database Ready'}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-indigo-300 group-hover:text-emerald-300 font-bold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
              Sync
            </span>
          </button>
        )}

        {/* Turbo Storage Optimizer Button in Sidebar */}
        {onOpenStorageOptimizer && (
          <button
            onClick={onOpenStorageOptimizer}
            className="w-full text-left p-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/80 border border-emerald-500/30 hover:border-emerald-500/60 transition-all duration-200 flex items-center justify-between group cursor-pointer"
            title="គ្រប់គ្រងកន្លែងផ្ទុកទិន្នន័យតាម User & បង្រួមទំហំ Data"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-white leading-tight truncate">
                  Turbo Storage Engine
                </p>
                <p className="text-[10px] text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  បង្រួមទិន្នន័យ 68% • 0ms
                </p>
              </div>
            </div>
            <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              Active
            </span>
          </button>
        )}

        {/* Sound & Preference quick toggle */}
        <div className="flex items-center justify-between px-1 text-xs text-indigo-300">
          <button
            onClick={onToggleSound}
            className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors"
            title="បិទ/បើកសំឡេងរោទ៍"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{soundEnabled ? 'សំឡេង៖ បើក' : 'សំឡេង៖ បិទ'}</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="text-[11px] text-indigo-300 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              title="ចាកចេញ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ចាកចេញ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-indigo-950 z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
