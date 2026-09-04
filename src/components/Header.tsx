import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Flame,
  Plus,
  Menu,
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
  systemConfig?: SystemConfig;
  onToggleMaintenance?: () => void;
  onOpenReleaseVersion?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  activeRemindersCount,
  soundEnabled,
  onToggleSound,
  onOpenNewTask,
  onToggleMobileSidebar,
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
  systemConfig,
  onToggleMaintenance,
  onOpenReleaseVersion,
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

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-30 shrink-0 select-none">
      {/* Left: Hamburger on mobile + Greeting & Status Pill */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* User Greeting - Optimized for Phone */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-base font-bold text-slate-800 truncate">
                សួស្តី, {currentUser.khmerName}
              </span>
              <span className={`inline-flex items-center gap-1 text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold border shrink-0 ${currentRoleCfg.badgeBg} ${currentRoleCfg.badgeText} ${currentRoleCfg.badgeBorder}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentRoleCfg.dotColor}`}></span>
                <span className="hidden xs:inline">{currentRoleCfg.titleKh}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium sm:hidden truncate">
              {formatKhmerDate(todayStr, false)}
            </p>
          </div>
        </div>

        <div className="hidden xl:flex items-center text-xs text-slate-500 pl-2 border-l border-slate-200">
          <span>{formatKhmerDate(todayStr, true)}</span>
          {currentTime && <span className="ml-1.5 font-medium">• ម៉ោង {toKhmerNumber(currentTime)}</span>}
        </div>
      </div>

      {/* Right: Sound, Notifications, Streak & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Cloud Database Sync Pill */}
        {onOpenSupabaseModal && (
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              supabaseSyncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : supabaseSyncStatus === 'syncing'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
            title="Supabase Database Status & Sync"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {supabaseSyncStatus === 'synced' ? 'Cloud DB' : supabaseSyncStatus === 'syncing' ? 'Syncing...' : 'DB Ready'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        )}

        {/* Today's Summary Report Button */}
        {onOpenTodaySummary && (
          <button
            onClick={onOpenTodaySummary}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="ចុចដើម្បីមើល ឬចម្លងរបាយការណ៍សរុបថ្ងៃនេះ (Today's Summary Report)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">របាយការណ៍ថ្ងៃនេះ</span>
          </button>
        )}

        {/* Streak Pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs"
          title={`បន្តជាប់គ្នា ${streak.currentStreak} ថ្ងៃ`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
          <span>{toKhmerNumber(streak.currentStreak)} ថ្ងៃ</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 sm:p-2 rounded-lg border text-xs transition-colors ${
            soundEnabled
              ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
          }`}
          title={soundEnabled ? 'បិទសំឡេង' : 'បើកសំឡេង'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Phone Lock Screen Notification & Bell */}
        <button
          onClick={onOpenPhoneNotificationModal || handleRequestNotification}
          className="relative p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Notification លើទូរស័ព្ទ & Lock Screen"
        >
          {activeRemindersCount > 0 ? (
            <BellRing className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 animate-bounce" />
          ) : (
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          {activeRemindersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 text-white rounded-full text-[8px] sm:text-[9px] font-black flex items-center justify-center border-2 border-white shadow-2xs">
              {toKhmerNumber(activeRemindersCount)}
            </span>
          )}
        </button>

        {/* New Task Button - Hidden on mobile because MobileBottomNav has FAB */}
        {canCreateTask && (
          <button
            onClick={onOpenNewTask}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>កិច្ចការថ្មី +</span>
          </button>
        )}

        {/* Super Admin Maintenance Trigger Button */}
        {currentUser.role === 'admin' && onToggleMaintenance && (
          <button
            onClick={onToggleMaintenance}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              systemConfig?.isMaintenance
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 shadow-xs animate-pulse'
                : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800 border border-slate-200'
            }`}
            title={systemConfig?.isMaintenance ? "ប្រព័ន្ធកំពុងស្ថិតក្នុងការកែប្រែដោយ Super Admin" : "បើក Maintenance Mode កែប្រែប្រព័ន្ធ"}
          >
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>{systemConfig?.isMaintenance ? '🛠️ កំពុងកែប្រែ' : 'កែប្រែប្រព័ន្ធ'}</span>
          </button>
        )}

        {/* User Profile Pill & Dropdown Switcher */}
        <div className="relative border-l pl-1.5 sm:pl-3 border-slate-200" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-0.5 sm:p-1 rounded-xl hover:bg-slate-100 transition-all cursor-pointer text-left"
            aria-label="User profile menu"
          >
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser.khmerName}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
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
            <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu - Fixed positioning on mobile so it never overflows */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
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
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.khmerName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold border mt-1 ${currentRoleCfg.badgeBg} ${currentRoleCfg.badgeText} ${currentRoleCfg.badgeBorder}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentRoleCfg.dotColor}`}></span>
                      {currentRoleCfg.titleKh}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                  ផ្នែក៖ <span className="font-semibold text-slate-700">{currentUser.department}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 space-y-1 border-b border-slate-100">
                {onOpenTodaySummary && (
                  <button
                    onClick={() => {
                      onOpenTodaySummary();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>សរុបរបាយការណ៍ថ្ងៃនេះ (Daily Report)</span>
                  </button>
                )}

                {onOpenPhoneNotificationModal && (
                  <button
                    onClick={() => {
                      onOpenPhoneNotificationModal();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>Notification & Lock Screen ទូរស័ព្ទ</span>
                  </button>
                )}

                {onOpenProfileModal && (
                  <button
                    onClick={() => {
                      onOpenProfileModal();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>កែប្រែ Profile & រូបថត (Edit Profile)</span>
                  </button>
                )}

                {canManageUsers && (
                  <button
                    onClick={() => {
                      onOpenUserManagement();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>គ្រប់គ្រងសិទ្ធិ & សមាជិក (RBAC Pro)</span>
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

              {/* Quick Switch Profiles - Super Admin Only */}
              {currentUser.role === 'admin' && users.length > 1 && (
                <div className="p-2 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 flex items-center justify-between">
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors text-xs ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-900 font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
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

              {/* Auth / Logout */}
              <div className="p-2 space-y-1">
                {onOpenAuthModal && (
                  <button
                    onClick={() => {
                      onOpenAuthModal();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-slate-500" />
                    <span>ផ្ទាំង Login & Password ទំនើប</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
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


