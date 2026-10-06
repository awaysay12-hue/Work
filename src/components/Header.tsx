import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Flame,
  Plus,
  Menu,
  PanelLeftOpen,
  PanelLeftClose,
  Database,
  Shield,
  Users,
  ChevronDown,
  ArrowRightLeft,
  Crown,
  CheckCircle2,
  LogOut,
  LogIn,
  KeyRound,
  User,
  Settings,
  FileText,
  Smartphone,
  Wrench,
  Rocket,
  Zap,
  HardDrive,
  Link2,
  Sun,
  Moon,
} from 'lucide-react';
import { formatKhmerDate, formatKhmerTime, getTodayDateString } from '../utils/khmerDates';
import { toKhmerNumber } from '../utils/translations';
import { soundFx } from '../utils/sound';
import { DailyStreak, Task, UserAccount, SystemConfig } from '../types';
import { ROLE_CONFIGS } from '../utils/userPermissions';
import { requestNotificationPermission } from '../utils/notifications';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  streak: DailyStreak;
  activeRemindersCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenNewTask: () => void;
  onToggleMobileSidebar?: () => void;
  tasks: Task[];
  onOpenSupabaseModal?: () => void;
  supabaseSyncStatus?: 'synced' | 'syncing' | 'error' | 'offline';
  currentUser: UserAccount;
  users: UserAccount[];
  onSwitchUser: (user: UserAccount) => void;
  onOpenUserManagement: () => void;
  onOpenProfileModal?: () => void;
  onOpenTodaySummary?: () => void;
  onOpenPhoneNotificationModal?: () => void;
  canCreateTask?: boolean;
  canManageUsers?: boolean;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onSwitchAccount?: () => void;
  systemConfig?: SystemConfig;
  onToggleMaintenance?: () => void;
  onOpenReleaseVersion?: () => void;
  onOpenStorageOptimizer?: () => void;
  onOpenPortalLinks?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  activeRemindersCount,
  soundEnabled,
  onToggleSound,
  onOpenNewTask,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleSidebar,
  tasks,
  onOpenSupabaseModal,
  supabaseSyncStatus = 'synced',
  currentUser,
  users,
  onSwitchUser,
  onOpenUserManagement,
  onOpenProfileModal,
  onOpenTodaySummary,
  onOpenPhoneNotificationModal,
  canCreateTask = true,
  canManageUsers = false,
  onOpenAuthModal,
  onLogout,
  onSwitchAccount,
  systemConfig,
  onToggleMaintenance,
  onOpenReleaseVersion,
  onOpenStorageOptimizer,
  onOpenPortalLinks,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRequestNotification = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      soundFx.playReminderChime();
    }
  };

  const todayStr = getTodayDateString();
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const currentRoleCfg = ROLE_CONFIGS[currentUser.role] || ROLE_CONFIGS.member;

  const handleToggleThemeInternal = () => {
    if (onToggleDarkMode) {
      onToggleDarkMode();
    } else {
      const root = document.documentElement;
      const willBeDark = !root.classList.contains('dark');
      if (willBeDark) {
        root.classList.add('dark');
        document.body.classList.add('dark');
        localStorage.setItem('kh_daily_theme_mode_v1', 'dark');
        localStorage.setItem('theme_mode', 'dark');
      } else {
        root.classList.remove('dark');
        document.body.classList.remove('dark');
        localStorage.setItem('kh_daily_theme_mode_v1', 'light');
        localStorage.setItem('theme_mode', 'light');
      }
      soundFx.playClick();
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-30 shrink-0 select-none transition-colors">
      {/* Left: Hamburger on mobile + Greeting & Status Pill */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
        {/* Show/Hide Menu Toggle (Desktop & Mobile) - Allows collapsing sidebar to view larger workspace */}
        <button
          id="main-nav-menu-toggle"
          type="button"
          onClick={() => {
            if (onToggleSidebar) {
              onToggleSidebar();
            } else if (onToggleMobileSidebar) {
              onToggleMobileSidebar();
            }
          }}
          className={`flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs select-none active:scale-95 shrink-0 ${
            isSidebarCollapsed
              ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-sm shadow-purple-600/30'
              : 'bg-purple-50/80 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 dark:text-purple-300 border-purple-200/90 dark:border-purple-800/80'
          }`}
          title={
            isSidebarCollapsed
              ? 'ចុចដើម្បីបើកមឺនុយចំហៀង (Show Sidebar Menu)'
              : 'ចុចដើម្បីបិទមឺនុយចំហៀង ដើម្បីមើលទំហំធំជាងមុន (Hide/Collapse Menu for Wider View)'
          }
          aria-label={isSidebarCollapsed ? 'Show Sidebar Menu' : 'Collapse Sidebar Menu'}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-white" />
          ) : (
            <Menu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          )}
          <span className="hidden sm:inline font-bold text-[11px]">
            {isSidebarCollapsed ? 'បើកមឺនុយ' : 'មឺនុយ'}
          </span>
        </button>

        {/* User Greeting - Optimized for Phone */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                សួស្តី, {currentUser.khmerName}
              </span>
              <span className={`inline-flex items-center gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold border shrink-0 ${currentRoleCfg.badgeBg} ${currentRoleCfg.badgeText} ${currentRoleCfg.badgeBorder}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentRoleCfg.dotColor}`}></span>
                <span className="hidden xs:inline">{currentRoleCfg.titleKh}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium sm:hidden truncate">
              {formatKhmerDate(todayStr, false)}
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
          <span>{formatKhmerDate(todayStr, true)}</span>
          {currentTime && <span className="ml-1.5 font-medium">• ម៉ោង {toKhmerNumber(currentTime)}</span>}
        </div>
      </div>

      {/* Right: Sound, Notifications, Streak, Theme & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Today's Summary Report Button */}
        {onOpenTodaySummary && (
          <button
            onClick={onOpenTodaySummary}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            title="ចុចដើម្បីមើល ឬចម្លងរបាយការណ៍សរុបថ្ងៃនេះ (Today's Summary Report)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">របាយការណ៍</span>
          </button>
        )}

        {/* Streak Pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-yellow-500/15 border border-amber-300/80 dark:border-amber-700/60 text-amber-900 dark:text-amber-300 font-bold text-xs shadow-2xs hover:scale-105 transition-transform cursor-default"
          title={`បន្តជាប់គ្នា ${streak.currentStreak} ថ្ងៃ`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
          <span>{toKhmerNumber(streak.currentStreak)} ថ្ងៃ</span>
        </div>

        {/* Dedicated Theme Toggle Button (Dark / Light Mode) */}
        <button
          id="main-nav-theme-toggle"
          type="button"
          role="switch"
          aria-checked={isDarkMode}
          onClick={handleToggleThemeInternal}
          className={`group relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs select-none active:scale-95 ${
            isDarkMode
              ? 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-slate-700 hover:border-amber-400/50 shadow-inner'
              : 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
          title={isDarkMode ? 'ប្តូរទៅទម្រង់ពន្លឺ (Switch to Light Mode)' : 'ប្តូរទៅទម្រង់ងងឹត (Switch to Dark Mode)'}
          aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div
            className={`flex items-center justify-center w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-lg transition-transform duration-300 group-hover:rotate-12 ${
              isDarkMode ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-500/15 text-amber-600'
            }`}
          >
            {isDarkMode ? (
              <Moon className="w-3.5 h-3.5 fill-amber-300/30 text-amber-300" />
            ) : (
              <Sun className="w-3.5 h-3.5 fill-amber-500/30 text-amber-600" />
            )}
          </div>

          <span className="hidden sm:inline font-bold text-[11px] tracking-tight">
            {isDarkMode ? 'ងងឹត' : 'ពន្លឺ'}
          </span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 sm:p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
            soundEnabled
              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title={soundEnabled ? 'បិទសំឡេង' : 'បើកសំឡេង'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Phone Lock Screen Notification & Bell */}
        <button
          onClick={onOpenPhoneNotificationModal || handleRequestNotification}
          className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          title="Notification លើទូរស័ព្ទ & Lock Screen"
        >
          {activeRemindersCount > 0 ? (
            <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400 animate-bounce" />
          ) : (
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          {activeRemindersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white rounded-full text-[8px] sm:text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-2xs">
              {toKhmerNumber(activeRemindersCount)}
            </span>
          )}
        </button>

        {/* Primary Action Button: Create Task */}
        {canCreateTask && (
          <button
            onClick={onOpenNewTask}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md hover:shadow-purple-500/25 hover:scale-105 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>កិច្ចការថ្មី +</span>
          </button>
        )}

        {/* User Profile Pill & Dropdown Switcher */}
        <div className="relative border-l pl-1.5 sm:pl-3 border-slate-200 dark:border-slate-800" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-0.5 sm:p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-left"
            aria-label="User profile menu"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                {currentUser.khmerName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {currentRoleCfg.titleKh}
              </p>
            </div>
            <UserAvatar
              avatarUrl={currentUser.avatarUrl}
              avatarColor={currentUser.avatarColor}
              avatarInitial={currentUser.avatarInitial}
              name={currentUser.khmerName}
              role={currentUser.role}
              size="sm"
              showBadge={true}
            />
            <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu - Fixed positioning on mobile so it never overflows */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    avatarUrl={currentUser.avatarUrl}
                    avatarColor={currentUser.avatarColor}
                    avatarInitial={currentUser.avatarInitial}
                    name={currentUser.khmerName}
                    role={currentUser.role}
                    size="lg"
                    showBadge={true}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.khmerName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold border mt-1 ${currentRoleCfg.badgeBg} ${currentRoleCfg.badgeText} ${currentRoleCfg.badgeBorder}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentRoleCfg.dotColor}`}></span>
                      {currentRoleCfg.titleKh}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-white dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  ផ្នែក៖ <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser.department}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 space-y-1 border-b border-slate-100 dark:border-slate-800">
                {/* Theme Mode Toggle inside Menu */}
                <button
                  type="button"
                  onClick={handleToggleThemeInternal}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isDarkMode ? (
                      <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                    ) : (
                      <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                    )}
                    <span>{isDarkMode ? 'ទម្រង់ងងឹត (Dark Mode)' : 'ទម្រង់ពន្លឺ (Light Mode)'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {isDarkMode ? 'ON' : 'OFF'}
                  </span>
                </button>

                {onOpenTodaySummary && (
                  <button
                    onClick={() => {
                      onOpenTodaySummary();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>សរុបរបាយការណ៍ថ្ងៃនេះ (Daily Report)</span>
                  </button>
                )}

                {onOpenPhoneNotificationModal && (
                  <button
                    onClick={() => {
                      onOpenPhoneNotificationModal();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Notification & Lock Screen ទូរស័ព្ទ</span>
                  </button>
                )}

                {onOpenProfileModal && (
                  <button
                    onClick={() => {
                      onOpenProfileModal();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>កែប្រែ Profile & រូបថត (Edit Profile)</span>
                  </button>
                )}

                {currentUser.role === 'admin' && onOpenUserManagement && (
                  <button
                    onClick={() => {
                      onOpenUserManagement();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 rounded-xl transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>គ្រប់គ្រងសិទ្ធិ & សមាជិក (RBAC Pro)</span>
                  </button>
                )}

                {/* Portal Links & Whitelist in Menu - Super Admin Only */}
                {currentUser.role === 'admin' && onOpenPortalLinks && (
                  <button
                    onClick={() => {
                      onOpenPortalLinks();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-900 bg-gradient-to-r from-indigo-50 to-cyan-50 hover:from-indigo-100 hover:to-cyan-100 border border-indigo-200/80 rounded-xl transition-colors cursor-pointer"
                  >
                    <Link2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold leading-tight">Link ច្រកចូល & Whitelist User</p>
                      <p className="text-[10px] text-indigo-600/90 font-medium leading-tight mt-0.5">
                        បង្កើត Link & កំណត់អ្នកមានសិទ្ធិចូល
                      </p>
                    </div>
                  </button>
                )}

                {/* Turbo Storage Optimizer in Menu - Super Admin Only */}
                {currentUser.role === 'admin' && onOpenStorageOptimizer && (
                  <button
                    onClick={() => {
                      onOpenStorageOptimizer();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>គ្រប់គ្រង & បង្រួមទិន្នន័យ (Turbo Storage)</span>
                  </button>
                )}

                {/* Super Admin Maintenance Mode Toggle */}
                {currentUser.role === 'admin' && onToggleMaintenance && (
                  <button
                    onClick={() => {
                      onToggleMaintenance();
                      setIsProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                      systemConfig?.isMaintenance
                        ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-amber-600" />
                    <span>
                      {systemConfig?.isMaintenance
                        ? 'បញ្ចប់ការកែប្រែ (Exit Maintenance)'
                        : '🛠️ កែប្រែប្រព័ន្ធ (Maintenance Mode)'}
                    </span>
                  </button>
                )}

                {/* Super Admin Release New Version */}
                {currentUser.role === 'admin' && onOpenReleaseVersion && (
                  <button
                    onClick={() => {
                      onOpenReleaseVersion();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Rocket className="w-4 h-4 text-orange-600" />
                    <span>បញ្ចេញ Version ថ្មី (Update to New Version)</span>
                  </button>
                )}
              </div>

              {/* Quick Switch Profiles */}
              {users.length > 1 && (
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-2 py-1 flex items-center justify-between">
                    <span>ប្តូរគណនីប្រើប្រាស់ភ្លាមៗ</span>
                    <ArrowRightLeft className="w-3 h-3 text-indigo-500" />
                  </div>
                  <div className="space-y-1 mt-1 max-h-36 overflow-y-auto">
                    {users.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      const rCfg = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.member;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setIsProfileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors text-xs cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <UserAvatar
                              avatarUrl={u.avatarUrl}
                              avatarColor={u.avatarColor}
                              avatarInitial={u.avatarInitial}
                              name={u.khmerName}
                              size="xs"
                            />
                            <span className="truncate">{u.khmerName}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${rCfg.badgeBg} ${rCfg.badgeText} ${rCfg.badgeBorder}`}>
                            {rCfg.titleKh}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Auth / Switch Account / Logout */}
              <div className="p-2 space-y-1">
                {(onSwitchAccount || onOpenAuthModal) && (
                  <button
                    onClick={() => {
                      if (onSwitchAccount) {
                        onSwitchAccount();
                      } else if (onOpenAuthModal) {
                        onOpenAuthModal();
                      }
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
                    <span>ប្តូរគណនី / ចូលគណនីផ្សេង (Switch Account)</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                    <span>ចាកចេញពីគណនី (Sign Out)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


