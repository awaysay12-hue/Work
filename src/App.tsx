import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Task,
  TaskFilterState,
  DailyStreak,
  ViewFilterPeriod,
  UserAccount,
  UserRole,
  RolePermissions,
  ActivityLog,
} from './types';
import { getInitialTasks, getInitialStreak } from './utils/initialData';
import { soundFx } from './utils/sound';
import { checkDueReminders, triggerTaskAlert, registerServiceWorker } from './utils/notifications';
import { getTodayDateString } from './utils/khmerDates';
import {
  DEFAULT_USERS,
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_ACTIVITY_LOGS,
  hasPermission,
  canUserViewTask,
} from './utils/userPermissions';
import {
  supabase,
  fetchTasksFromSupabase,
  saveTaskToSupabase,
  syncAllTasksToSupabase,
  deleteTaskFromSupabase,
  fetchStreakFromSupabase,
  saveStreakToSupabase,
  fetchUsersFromSupabase,
  saveUserToSupabase,
  syncAllUsersToSupabase,
  deleteUserFromSupabase,
  fetchActivityLogsFromSupabase,
  saveActivityLogToSupabase,
  syncAllActivityLogsToSupabase,
  fetchRolePermissionsFromSupabase,
  saveRolePermissionsToSupabase,
  dbRowToTask,
  dbRowToUser,
} from './lib/supabase';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DailyProgressCard } from './components/DailyProgressCard';
import { TaskFilterTabs } from './components/TaskFilterTabs';
import { TaskList } from './components/TaskList';
import { RightSidebarWidgets } from './components/RightSidebarWidgets';
import { TaskModal } from './components/TaskModal';
import { FocusTimerModal } from './components/FocusTimerModal';
import { CalendarView } from './components/CalendarView';
import { ProgressAnalyticsView } from './components/ProgressAnalyticsView';
import { ReminderAlertBanner } from './components/ReminderAlertBanner';
import { QuickAddBar } from './components/QuickAddBar';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AuthModal } from './components/AuthModal';
import { PersonalUserBanner } from './components/PersonalUserBanner';
import { ProfileModal } from './components/ProfileModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { TodaySummaryModal } from './components/TodaySummaryModal';
import { PhoneNotificationModal } from './components/PhoneNotificationModal';

const STORAGE_KEYS = {
  TASKS: 'kh_daily_tasks_data_v1',
  STREAK: 'kh_daily_streak_data_v1',
  SOUND: 'kh_daily_sound_enabled_v1',
  USERS: 'kh_daily_users_data_v1',
  CURRENT_USER_ID: 'kh_daily_current_user_id_v1',
  ROLE_PERMISSIONS: 'kh_daily_role_permissions_v1',
  ACTIVITY_LOGS: 'kh_daily_activity_logs_v1',
  AUTH_AUTHENTICATED: 'kh_daily_auth_authenticated_v1',
};

export default function App() {
  // Load tasks from localStorage or initial
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return getInitialTasks();
  });

  // Load streak metrics
  const [streak, setStreak] = useState<DailyStreak>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return getInitialStreak();
  });

  // Legacy mock IDs to prune so system starts fresh with only Super Admin and newly enrolled users
  const LEGACY_MOCK_USER_IDS = new Set(['user-mgr-1', 'user-mem-1', 'user-mem-2', 'user-view-1']);

  // User Management & RBAC States
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((u) => u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id));
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch {
      // Ignore
    }
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const savedUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
      const usersList: UserAccount[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : DEFAULT_USERS;
      const validUsers = usersList.filter((u) => u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id));
      if (savedId && !LEGACY_MOCK_USER_IDS.has(savedId)) {
        const found = validUsers.find((u) => u.id === savedId) || DEFAULT_USERS.find((u) => u.id === savedId);
        if (found) return found;
      }
      if (validUsers.length > 0) return validUsers[0];
    } catch {
      // Ignore
    }
    return DEFAULT_USERS[0]; // Default to Super Admin
  });

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLE_PERMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
      if (saved) {
        const parsed: ActivityLog[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const uniqueLogs: ActivityLog[] = [];
          parsed.forEach((log, index) => {
            const safeId =
              log.id && !seen.has(log.id)
                ? log.id
                : `log-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;
            seen.add(safeId);
            uniqueLogs.push({ ...log, id: safeId });
          });
          return uniqueLogs;
        }
      }
    } catch {
      // Ignore
    }
    return INITIAL_ACTIVITY_LOGS;
  });

  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_AUTHENTICATED);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return false; // Default to false so opening the link prompts login screen immediately
  });

  // Supabase Sync States
  const [supabaseSyncStatus, setSupabaseSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string>('បានភ្ជាប់ជាមួយ Supabase Database រួចរាល់');
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      if (saved !== null) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return true;
  });

  // Filter State
  const [filters, setFilters] = useState<TaskFilterState>({
    period: 'today',
    category: 'all',
    priority: 'all',
    searchQuery: '',
    sortBy: 'dueAsc',
  });

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Active reminders to show banner
  const [activeAlerts, setActiveAlerts] = useState<Task[]>([]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState<boolean>(false);
  const [focusTimerTask, setFocusTimerTask] = useState<Task | null>(null);

  // Daily Summary & Lockscreen Phone Notification Modals
  const [isTodaySummaryOpen, setIsTodaySummaryOpen] = useState<boolean>(false);
  const [isPhoneNotificationModalOpen, setIsPhoneNotificationModalOpen] = useState<boolean>(false);

  // Register PWA Service Worker for Mobile Notifications
  useEffect(() => {
    registerServiceWorker().catch(() => {});
  }, []);

  // Persistence for Users & Permissions
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {
      // Ignore
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    } catch {
      // Ignore
    }
  }, [currentUser]);

  // Load per-user streak when currentUser switches
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    try {
      const userStreakKey = `taskmate_streak_${currentUser.id}`;
      const savedUserStreak = localStorage.getItem(userStreakKey);
      if (savedUserStreak) {
        setStreak(JSON.parse(savedUserStreak));
      } else {
        fetchStreakFromSupabase(currentUser.id)
          .then((res) => {
            if (res.streak) {
              setStreak(res.streak);
              localStorage.setItem(userStreakKey, JSON.stringify(res.streak));
            } else {
              setStreak(getInitialStreak());
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, [currentUser?.id]);

  // Persist current active streak for this specific user
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    try {
      localStorage.setItem(`taskmate_streak_${currentUser.id}`, JSON.stringify(streak));
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
    } catch {
      // Ignore
    }
  }, [streak, currentUser?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE_PERMISSIONS, JSON.stringify(rolePermissions));
    } catch {
      // Ignore
    }
  }, [rolePermissions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
    } catch {
      // Ignore
    }
  }, [activityLogs]);

  // Log activity helper
  const logActivity = useCallback(
    (action: ActivityLog['action'], targetTitle: string, details?: string) => {
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newLog: ActivityLog = {
        id: `log-${uniqueSuffix}`,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.khmerName,
        userRole: currentUser.role,
        action,
        targetTitle,
        details,
      };
      setActivityLogs((prev) => {
        const seen = new Set<string>([newLog.id]);
        const deduped: ActivityLog[] = [newLog];
        for (const item of prev) {
          let safeId = item.id;
          if (seen.has(safeId)) {
            safeId = `${safeId}-${Math.random().toString(36).substring(2, 6)}`;
          }
          seen.add(safeId);
          deduped.push({ ...item, id: safeId });
        }
        return deduped.slice(0, 100);
      });
    },
    [currentUser]
  );

  // RBAC Permission checks for currently logged in user
  const canCreateTask = hasPermission(currentUser.role, 'canCreateTask', rolePermissions);
  const canEditTask = hasPermission(currentUser.role, 'canEditTask', rolePermissions);
  const canDeleteTask = hasPermission(currentUser.role, 'canDeleteTask', rolePermissions);
  const canAssignTask = hasPermission(currentUser.role, 'canAssignTask', rolePermissions);
  const canToggleComplete = hasPermission(currentUser.role, 'canCompleteTask', rolePermissions);
  const canManageUsers = hasPermission(currentUser.role, 'canManageUsers', rolePermissions);
  const canExportData = hasPermission(currentUser.role, 'canExportData', rolePermissions);
  const canImportData = hasPermission(currentUser.role, 'canImportData', rolePermissions);
  const canSyncCloud = hasPermission(currentUser.role, 'canSyncCloud', rolePermissions);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_AUTHENTICATED, JSON.stringify(isAuthenticated));
    } catch {
      // Ignore
    }
  }, [isAuthenticated]);

  // User management handlers
  const handleSwitchUser = (user: UserAccount) => {
    soundFx.playClick();
    setCurrentUser(user);
    if (user.role === 'member' || user.role === 'viewer') {
      setFilters((prev) => ({ ...prev, assigneeFilter: user.id }));
    }
    logActivity('update_role', user.khmerName, `បានប្តូរទៅកាន់គណនី៖ ${user.khmerName} (${user.role})`);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    soundFx.playTaskCompleteFanfare();
    setCurrentUser(user);
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    if (user.role === 'member' || user.role === 'viewer') {
      setFilters((prev) => ({ ...prev, assigneeFilter: user.id }));
    } else {
      setFilters((prev) => ({ ...prev, assigneeFilter: 'all' }));
    }
    logActivity('update_role', user.khmerName, `បានចូលប្រើប្រាស់គណនីជោគជ័យ (${user.role})`);
  };

  const handleLogout = () => {
    soundFx.playClick();
    logActivity('update_role', currentUser.khmerName, 'បានចាកចេញពីគណនី');
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
  };

  // Merge helper for user lists across devices and cloud
  const mergeUserLists = (remoteUsers: UserAccount[], localUsers: UserAccount[]): UserAccount[] => {
    const map = new Map<string, UserAccount>();

    // 1. Initial/Default seed users
    DEFAULT_USERS.forEach((u) => {
      if (u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id)) map.set(u.id, u);
    });

    // 2. Local users (skip legacy mock demo IDs)
    (Array.isArray(localUsers) ? localUsers : []).forEach((u) => {
      if (u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id)) map.set(u.id, u);
    });

    // 3. Remote Cloud users (highest authority, skip legacy mock demo IDs)
    (Array.isArray(remoteUsers) ? remoteUsers : []).forEach((u) => {
      if (u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id)) map.set(u.id, u);
    });

    return Array.from(map.values());
  };

  const handleSaveUser = (savedUser: UserAccount) => {
    soundFx.playClick();
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === savedUser.id);
      let updated: UserAccount[];
      if (exists) {
        logActivity('update_role', savedUser.khmerName, `បានកែប្រែគណនី៖ ${savedUser.khmerName}`);
        updated = prev.map((u) => (u.id === savedUser.id ? savedUser : u));
      } else {
        logActivity('add_user', savedUser.khmerName, `បានបង្កើតគណនី៖ ${savedUser.khmerName} (${savedUser.role})`);
        updated = [...prev, savedUser];
      }

      try {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
        localStorage.setItem('taskmate_users', JSON.stringify(updated));
      } catch {
        // Ignore
      }

      return updated;
    });

    // Save to Supabase Cloud immediately
    saveUserToSupabase(savedUser).catch((err) =>
      console.warn('Failed to save user to Supabase:', err)
    );

    // If updating current user's profile
    if (savedUser.id === currentUser.id) {
      setCurrentUser(savedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    soundFx.playClick();
    const userToDelete = users.find((u) => u.id === userId);
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);

    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      localStorage.setItem('taskmate_users', JSON.stringify(updatedUsers));
    } catch {
      // Ignore
    }

    if (currentUser.id === userId) {
      if (updatedUsers.length > 0) {
        setCurrentUser(updatedUsers[0]);
      } else {
        setCurrentUser(DEFAULT_USERS[0]);
      }
    }
    logActivity('delete_user', userToDelete?.khmerName || userId, `បានលុបគណនីចេញពីប្រព័ន្ធ`);

    // Delete in Supabase Cloud
    deleteUserFromSupabase(userId).catch((err) =>
      console.warn('Failed to delete user in Supabase:', err)
    );
  };

  const handleUpdateRolePermissions = (newPermissions: Record<UserRole, RolePermissions>) => {
    soundFx.playClick();
    setRolePermissions(newPermissions);
    logActivity('update_role', 'RBAC Matrix', 'បានកែសម្រួលម៉ាទ្រីសសិទ្ធិ & វិសាលភាព');

    // Save Role Matrix in Supabase Cloud
    saveRolePermissionsToSupabase(newPermissions).catch((err) =>
      console.warn('Failed to save role permissions to Supabase:', err)
    );
  };

  // Initial Sync from Supabase (Tasks, Users, Streak, Logs, Role Matrix)
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseData() {
      if (!supabase) return;
      setSupabaseSyncStatus('syncing');
      setSupabaseSyncMessage('កំពុងទាញទិន្នន័យពី Cloud Database...');

      try {
        const [tasksRes, usersRes, streakRes, logsRes, rbacRes] = await Promise.all([
          fetchTasksFromSupabase(),
          fetchUsersFromSupabase(),
          fetchStreakFromSupabase(currentUser?.id),
          fetchActivityLogsFromSupabase(),
          fetchRolePermissionsFromSupabase(),
        ]);

        if (!isMounted) return;

        // 1. Sync Tasks
        if (tasksRes.tasks && tasksRes.tasks.length > 0) {
          setTasks(tasksRes.tasks);
        } else if (!tasksRes.error && tasks.length > 0) {
          // If remote is empty, push local initial tasks to Supabase
          syncAllTasksToSupabase(tasks).catch(() => {});
        }

        // 2. Sync Users (Merge seamlessly across devices)
        const mergedUsers = mergeUserLists(usersRes.users || [], users);
        setUsers(mergedUsers);
        try {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));
          localStorage.setItem('taskmate_users', JSON.stringify(mergedUsers));
        } catch {
          // Ignore
        }

        // If remote database had fewer users or was missing default accounts, push full list
        if (!usersRes.error && (!usersRes.users || usersRes.users.length < mergedUsers.length)) {
          syncAllUsersToSupabase(mergedUsers).catch(() => {});
        }

        // Keep current logged-in user in sync with updated profile
        const matchedUser = mergedUsers.find((u) => u.id === currentUser.id);
        if (matchedUser) setCurrentUser(matchedUser);

        // 3. Sync Streak
        if (streakRes.streak) {
          setStreak(streakRes.streak);
        } else if (!streakRes.error) {
          saveStreakToSupabase(streak, currentUser?.id).catch(() => {});
        }

        // 4. Sync Activity Logs
        if (logsRes.logs && logsRes.logs.length > 0) {
          setActivityLogs(logsRes.logs);
        } else if (!logsRes.error && activityLogs.length > 0) {
          syncAllActivityLogsToSupabase(activityLogs).catch(() => {});
        }

        // 5. Sync Role Permissions Matrix
        if (rbacRes.permissions) {
          setRolePermissions(rbacRes.permissions);
        } else if (!rbacRes.error) {
          saveRolePermissionsToSupabase(rolePermissions).catch(() => {});
        }

        if (tasksRes.error || usersRes.error) {
          setSupabaseSyncStatus('error');
          setSupabaseSyncMessage('ត្រូវការ Run SQL Script ក្នុង Supabase Dashboard ដើម្បីបង្កើត Tables');
        } else {
          setSupabaseSyncStatus('synced');
          setSupabaseSyncMessage(`បានធ្វើសមកាលកម្មទិន្នន័យ (${tasksRes.tasks?.length || tasks.length} កិច្ចការ, ${mergedUsers.length} គណនី)`);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setSupabaseSyncStatus('error');
        setSupabaseSyncMessage(`បរាជ័យក្នុងការ Sync ជាមួយ Database៖ ${err?.message || 'Error'}`);
      }
    }

    initSupabaseData();

    // Supabase Real-time listeners
    let tasksChannel: any = null;
    let usersChannel: any = null;

    try {
      if (supabase) {
        // Real-time listener for tasks
        tasksChannel = supabase
          .channel('public:tasks_stream')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tasks' },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                const newTask = dbRowToTask(payload.new);
                setTasks((prev) => {
                  if (prev.some((t) => t.id === newTask.id)) return prev;
                  return [newTask, ...prev];
                });
              } else if (payload.eventType === 'UPDATE') {
                const updatedTask = dbRowToTask(payload.new);
                setTasks((prev) =>
                  prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
                );
              } else if (payload.eventType === 'DELETE') {
                const deletedId = payload.old?.id;
                if (deletedId) {
                  setTasks((prev) => prev.filter((t) => t.id !== String(deletedId)));
                }
              }
            }
          )
          .subscribe();

        // Real-time listener for users
        usersChannel = supabase
          .channel('public:users_stream')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'users' },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                const updatedUser = dbRowToUser(payload.new);
                setUsers((prev) => {
                  const exists = prev.some((u) => u.id === updatedUser.id);
                  let nextUsers: UserAccount[];
                  if (exists) {
                    nextUsers = prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
                  } else {
                    nextUsers = [...prev, updatedUser];
                  }
                  try {
                    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
                    localStorage.setItem('taskmate_users', JSON.stringify(nextUsers));
                  } catch {
                    // Ignore
                  }
                  return nextUsers;
                });
              } else if (payload.eventType === 'DELETE') {
                const deletedId = payload.old?.id;
                if (deletedId) {
                  setUsers((prev) => {
                    const nextUsers = prev.filter((u) => u.id !== String(deletedId));
                    try {
                      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(nextUsers));
                      localStorage.setItem('taskmate_users', JSON.stringify(nextUsers));
                    } catch {
                      // Ignore
                    }
                    return nextUsers;
                  });
                }
              }
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn('Realtime channels error:', err);
    }

    // Auto-polling & Tab focus listener for multi-device sync
    const handleWindowFocus = () => {
      fetchUsersFromSupabase().then((res) => {
        if (res.users && res.users.length > 0) {
          setUsers((prev) => {
            const merged = mergeUserLists(res.users!, prev);
            try {
              localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(merged));
              localStorage.setItem('taskmate_users', JSON.stringify(merged));
            } catch {
              // Ignore
            }
            return merged;
          });
        }
      }).catch(() => {});

      fetchTasksFromSupabase().then((res) => {
        if (res.tasks && res.tasks.length > 0) {
          setTasks(res.tasks);
        }
      }).catch(() => {});
    };

    const pollingInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        handleWindowFocus();
      }
    }, 10000);

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleWindowFocus);

    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleWindowFocus);
      if (tasksChannel && supabase) {
        supabase.removeChannel(tasksChannel);
      }
      if (usersChannel && supabase) {
        supabase.removeChannel(usersChannel);
      }
    };
  }, []);

  // Manual Re-sync from Supabase
  const handleManualSync = async () => {
    setSupabaseSyncStatus('syncing');
    setSupabaseSyncMessage('កំពុងទាញទិន្នន័យពី Cloud Database...');
    try {
      const [tasksRes, usersRes, streakRes] = await Promise.all([
        fetchTasksFromSupabase(),
        fetchUsersFromSupabase(),
        fetchStreakFromSupabase(currentUser?.id),
      ]);

      if (tasksRes.error || usersRes.error) {
        setSupabaseSyncStatus('error');
        setSupabaseSyncMessage(`បញ្ហា៖ ${(tasksRes.error || usersRes.error)?.message}`);
      } else {
        if (tasksRes.tasks && tasksRes.tasks.length > 0) {
          setTasks(tasksRes.tasks);
        }
        if (usersRes.users) {
          const mergedUsers = mergeUserLists(usersRes.users, users);
          setUsers(mergedUsers);
          try {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mergedUsers));
            localStorage.setItem('taskmate_users', JSON.stringify(mergedUsers));
          } catch {
            // Ignore
          }
        }
        if (streakRes.streak) {
          setStreak(streakRes.streak);
        }
        setSupabaseSyncStatus('synced');
        setSupabaseSyncMessage('បានធ្វើសមកាលកម្មជាមួយ Database ជោគជ័យ! ✅');
      }
    } catch (err: any) {
      setSupabaseSyncStatus('error');
      setSupabaseSyncMessage(`បរាជ័យក្នុងការ Sync៖ ${err?.message || 'Error'}`);
    }
  };

  // Push local state to Cloud
  const handlePushLocalToCloud = async () => {
    setSupabaseSyncStatus('syncing');
    const [tasksRes, usersRes, streakRes, logsRes, rbacRes] = await Promise.all([
      syncAllTasksToSupabase(tasks),
      syncAllUsersToSupabase(users),
      saveStreakToSupabase(streak),
      syncAllActivityLogsToSupabase(activityLogs),
      saveRolePermissionsToSupabase(rolePermissions),
    ]);

    if (!tasksRes.success || tasksRes.error) {
      setSupabaseSyncStatus('error');
      throw tasksRes.error || new Error('មិនអាចបញ្ជូនទិន្នន័យ Tasks បាន');
    }
    setSupabaseSyncStatus('synced');
    setSupabaseSyncMessage(`បានបញ្ជូន ${tasks.length} ភារកិច្ច និង ${users.length} គណនីទៅ Supabase រួចរាល់ ✅`);
  };

  // Pull Cloud to local
  const handlePullCloudToLocal = async () => {
    setSupabaseSyncStatus('syncing');
    const [tasksRes, usersRes, streakRes, logsRes, rbacRes] = await Promise.all([
      fetchTasksFromSupabase(),
      fetchUsersFromSupabase(),
      fetchStreakFromSupabase(),
      fetchActivityLogsFromSupabase(),
      fetchRolePermissionsFromSupabase(),
    ]);

    if (tasksRes.error || !tasksRes.tasks) {
      setSupabaseSyncStatus('error');
      throw tasksRes.error || new Error('មិនអាចទាញទិន្នន័យបាន');
    }

    setTasks(tasksRes.tasks);
    if (usersRes.users && usersRes.users.length > 0) setUsers(usersRes.users);
    if (streakRes.streak) setStreak(streakRes.streak);
    if (logsRes.logs && logsRes.logs.length > 0) setActivityLogs(logsRes.logs);
    if (rbacRes.permissions) setRolePermissions(rbacRes.permissions);

    setSupabaseSyncStatus('synced');
    setSupabaseSyncMessage(`បានទាញ ${tasksRes.tasks.length} ភារកិច្ច និង ${usersRes.users?.length || 0} គណនីពី Cloud ជោគជ័យ ✅`);
  };

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch {
      // Ignore
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streak));
    } catch {
      // Ignore
    }
  }, [streak]);

  useEffect(() => {
    soundFx.soundEnabled = soundEnabled;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(soundEnabled));
    } catch {
      // Ignore
    }
  }, [soundEnabled]);

  // Periodic Reminder Checker (runs every 15 seconds)
  useEffect(() => {
    const runReminderCheck = () => {
      const triggered = checkDueReminders(tasks);
      if (triggered.length > 0) {
        const newTriggeredIds = new Set(triggered.map((t) => t.id));
        setActiveAlerts((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const toAdd = triggered.filter((t) => !existingIds.has(t.id));

          toAdd.forEach((task) => {
            triggerTaskAlert(task);
          });

          return [...prev.filter((t) => newTriggeredIds.has(t.id)), ...toAdd];
        });
      }
    };

    runReminderCheck();
    const interval = setInterval(runReminderCheck, 15000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Handle task completion toggle with confetti & streak update
  const handleToggleComplete = useCallback((task: Task) => {
    const willBeCompleted = !task.completed;
    const completedAt = willBeCompleted ? new Date().toISOString() : undefined;

    if (willBeCompleted) {
      soundFx.playTaskCompleteFanfare();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore
      }
    } else {
      soundFx.playClick();
    }

    const updatedTask: Task = {
      ...task,
      completed: willBeCompleted,
      completedAt,
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? updatedTask : t))
    );

    // Save to Supabase
    saveTaskToSupabase(updatedTask).catch((err) =>
      console.warn('Failed to sync completed task to Supabase:', err)
    );

    if (willBeCompleted) {
      setActiveAlerts((prev) => prev.filter((a) => a.id !== task.id));
      logActivity('complete_task', task.title, 'បានគូសបញ្ចប់កិច្ចការដោយជោគជ័យ');
    } else {
      logActivity('uncomplete_task', task.title, 'បានប្តូរស្ថានភាពទៅមិនទាន់រួចរាល់');
    }

    if (willBeCompleted) {
      const todayStr = getTodayDateString();
      setStreak((prev) => {
        const isNewDay = prev.lastActiveDate !== todayStr;
        const currentStreak = isNewDay ? prev.currentStreak + 1 : prev.currentStreak;
        const longestStreak = Math.max(currentStreak, prev.longestStreak);

        const newStreak: DailyStreak = {
          ...prev,
          currentStreak,
          longestStreak,
          lastActiveDate: todayStr,
          totalCompletedAllTime: prev.totalCompletedAllTime + 1,
        };

        saveStreakToSupabase(newStreak, currentUser.id).catch((err) =>
          console.warn('Failed to sync streak to Supabase:', err)
        );

        return newStreak;
      });
    }
  }, [currentUser]);

  // Subtask completion toggle
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    soundFx.playClick();
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const updatedSubtasks = task.subtasks.map((sub) =>
          sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
        );
        const allCompleted =
          updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.completed);

        const updatedTask: Task = {
          ...task,
          subtasks: updatedSubtasks,
          completed: allCompleted ? true : task.completed,
        };

        saveTaskToSupabase(updatedTask).catch((err) =>
          console.warn('Failed to sync subtask update to Supabase:', err)
        );

        return updatedTask;
      })
    );
  };

  // Add / Save Task
  const handleSaveTask = (savedTask: Task) => {
    soundFx.playClick();
    const isRegular = currentUser.role === 'member' || currentUser.role === 'viewer';
    const finalTask: Task = {
      ...savedTask,
      creatorId: savedTask.creatorId || currentUser.id,
      creatorName: savedTask.creatorName || (currentUser.khmerName || currentUser.name),
      assigneeId: savedTask.assigneeId || (isRegular ? currentUser.id : undefined),
      assigneeName: savedTask.assigneeName || (isRegular ? (currentUser.khmerName || currentUser.name) : undefined),
    };

    setTasks((prev) => {
      const exists = prev.some((t) => t.id === finalTask.id);
      if (exists) {
        logActivity('edit_task', finalTask.title, finalTask.assigneeName ? `ចាត់តាំងឱ្យ៖ ${finalTask.assigneeName}` : undefined);
        return prev.map((t) => (t.id === finalTask.id ? finalTask : t));
      }
      logActivity('create_task', finalTask.title, finalTask.assigneeName ? `ចាត់តាំងឱ្យ៖ ${finalTask.assigneeName}` : undefined);
      return [finalTask, ...prev];
    });

    // Persist to Supabase
    saveTaskToSupabase(finalTask).catch((err) =>
      console.warn('Failed to save task to Supabase:', err)
    );
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    soundFx.playClick();
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setActiveAlerts((prev) => prev.filter((a) => a.id !== taskId));

    logActivity('delete_task', taskToDelete?.title || taskId, 'បានលុបកិច្ចការចេញពីបញ្ជី');

    // Delete in Supabase
    deleteTaskFromSupabase(taskId).catch((err) =>
      console.warn('Failed to delete task in Supabase:', err)
    );
  };

  // Snooze Reminder
  const handleSnoozeReminder = (taskId: string, minutes: number) => {
    soundFx.playClick();
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, reminderSnoozedUntil: snoozeTime };
          saveTaskToSupabase(updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );
    setActiveAlerts((prev) => prev.filter((a) => a.id !== taskId));
  };

  // Dismiss Reminder
  const handleDismissReminder = (taskId: string) => {
    soundFx.playClick();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, reminderTriggered: true };
          saveTaskToSupabase(updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );
    setActiveAlerts((prev) => prev.filter((a) => a.id !== taskId));
  };

  // Add Focus Minutes to Task
  const handleAddFocusMinutes = (taskId: string, minutes: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, spentMinutes: (t.spentMinutes || 0) + minutes };
          saveTaskToSupabase(updated).catch(() => {});
          return updated;
        }
        return t;
      })
    );
    setStreak((prev) => {
      const updatedStreak = {
        ...prev,
        totalFocusMinutesAllTime: prev.totalFocusMinutesAllTime + minutes,
      };
      saveStreakToSupabase(updatedStreak, currentUser.id).catch(() => {});
      return updatedStreak;
    });
  };

  // Export Data JSON
  const handleExportData = () => {
    soundFx.playClick();
    const exportPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      streak,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-tasks-backup-${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Data JSON
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
          if (data.streak) setStreak(data.streak);
          soundFx.playTaskCompleteFanfare();
          // Sync imported data to Supabase
          await syncAllTasksToSupabase(data.tasks);
          if (data.streak) await saveStreakToSupabase(data.streak);
        }
      } catch {
        // Parse error
      }
    };
    reader.readAsText(file);
  };

  // Modals & triggers
  const handleStartFocusTimer = (task: Task) => {
    setFocusTimerTask(task);
    setIsFocusTimerOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenNewTaskWithDate = (dateStr: string) => {
    setEditingTask({
      id: `task-${Date.now()}`,
      title: '',
      category: 'work',
      priority: 'medium',
      dueDate: dateStr,
      dueTime: '09:00',
      reminderTiming: '15m_before',
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: [],
      recurring: 'none',
      tags: [],
    });
    setIsTaskModalOpen(true);
  };

  // Handle navigation from Sidebar
  const handleSidebarNavigate = (view: ViewFilterPeriod | 'reminders') => {
    if (view === 'reminders') {
      setFilters((prev) => ({ ...prev, period: 'overdue' }));
    } else {
      setFilters((prev) => ({ ...prev, period: view }));
    }
  };

  // Tasks count by user for RBAC stats
  const tasksCountByUser = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.assigneeId) {
        counts[t.assigneeId] = (counts[t.assigneeId] || 0) + 1;
      }
    });
    return counts;
  }, [tasks]);

  // Is regular user (member or viewer) who should only see their own tasks
  const isRegularUser = currentUser.role === 'member' || currentUser.role === 'viewer';

  // Visible tasks: calculated based on user role, visibility scope (all, department, assigned_only)
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => canUserViewTask(t, currentUser, users, rolePermissions));
  }, [tasks, currentUser, users, rolePermissions]);

  const todayStr = getTodayDateString();
  const mobileTodayPending = useMemo(() => {
    return visibleTasks.filter((t) => t.dueDate === todayStr && !t.completed).length;
  }, [visibleTasks, todayStr]);

  const mobileOverduePending = useMemo(() => {
    return visibleTasks.filter((t) => t.dueDate < todayStr && !t.completed).length;
  }, [visibleTasks, todayStr]);

  // If user is not yet logged in, render the dedicated high-performance Login View directly
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 antialiased">
        <AuthModal
          isOpen={true}
          isFullScreen={true}
          forceLoginScreen={true}
          onLoginSuccess={handleLoginSuccess}
          onRegisterUser={handleSaveUser}
          users={users}
          currentUser={currentUser}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans overflow-hidden antialiased text-slate-900">
      {/* High Density Dark Indigo Sidebar */}
      <Sidebar
        currentView={filters.period}
        onNavigate={handleSidebarNavigate}
        streak={streak}
        tasks={visibleTasks}
        activeRemindersCount={activeAlerts.length}
        onOpenNewTask={handleOpenNewTask}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenSupabaseModal={canSyncCloud ? () => setIsSupabaseModalOpen(true) : undefined}
        supabaseSyncStatus={supabaseSyncStatus}
        currentUser={currentUser}
        usersCount={users.length}
        onOpenUserManagement={canManageUsers ? () => setIsUserManagementOpen(true) : undefined}
        onOpenTodaySummary={() => setIsTodaySummaryOpen(true)}
        onOpenPhoneNotificationModal={() => setIsPhoneNotificationModalOpen(true)}
        canCreateTask={canCreateTask}
        canManageUsers={canManageUsers}
        canSyncCloud={canSyncCloud}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-100">
        {/* High Density Top Header */}
        <Header
          streak={streak}
          activeRemindersCount={activeAlerts.length}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          onOpenNewTask={handleOpenNewTask}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          tasks={visibleTasks}
          onOpenSupabaseModal={canSyncCloud ? () => setIsSupabaseModalOpen(true) : undefined}
          supabaseSyncStatus={supabaseSyncStatus}
          currentUser={currentUser}
          users={users}
          onSwitchUser={handleSwitchUser}
          onOpenUserManagement={canManageUsers ? () => setIsUserManagementOpen(true) : undefined}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenTodaySummary={() => setIsTodaySummaryOpen(true)}
          onOpenPhoneNotificationModal={() => setIsPhoneNotificationModalOpen(true)}
          canManageUsers={canManageUsers}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Scrollable Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-24 lg:pb-6 space-y-4 sm:space-y-5">
          {/* Personalized Workspace Banner for Regular Members/Viewers */}
          {isRegularUser && (
            <PersonalUserBanner
              currentUser={currentUser}
              tasks={visibleTasks}
              streak={streak}
              onFilterMyTasks={() => setFilters((f) => ({ ...f, assigneeFilter: currentUser.id }))}
              onFilterAllTasks={() => setFilters((f) => ({ ...f, assigneeFilter: currentUser.id }))}
              isMyTasksActive={true}
              onStartFocusTimer={handleStartFocusTimer}
            />
          )}

          {/* Top 4-Metric Grid */}
          <DailyProgressCard
            tasks={visibleTasks}
            streak={streak}
            onViewAnalytics={() => setFilters((f) => ({ ...f, period: 'analytics' }))}
            onOpenTodaySummary={() => setIsTodaySummaryOpen(true)}
            onOpenPhoneNotificationModal={() => setIsPhoneNotificationModalOpen(true)}
          />

          {/* Conditional Layouts based on Active View */}
          {filters.period === 'analytics' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
              <ProgressAnalyticsView
                tasks={visibleTasks}
                streak={streak}
                onExportData={handleExportData}
                onImportData={handleImportData}
              />
            </div>
          ) : filters.period === 'calendar' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-xs">
              <CalendarView
                tasks={visibleTasks}
                onSelectDate={(dateStr) => console.log('Selected date:', dateStr)}
                onOpenNewTaskWithDate={handleOpenNewTaskWithDate}
                onToggleComplete={handleToggleComplete}
                onEditTask={handleOpenEditTask}
              />
            </div>
          ) : (
            /* High Density 12-Column Grid: 8 Cols Main Content + 4 Cols Widgets */
            <div className="grid grid-cols-12 gap-5 items-start">
              {/* Left 8 Cols (or 12 on mobile/tablet): Filters, Quick Add, Task Table */}
              <div className="col-span-12 xl:col-span-8 space-y-4">
                {/* Compact Filter Tabs */}
                <TaskFilterTabs
                  filters={filters}
                  onFilterChange={(newFilters) =>
                    setFilters((prev) => ({ ...prev, ...newFilters }))
                  }
                  tasks={visibleTasks}
                  currentUser={currentUser}
                  users={users}
                />

                {/* Quick Add Bar */}
                {filters.period === 'today' && canCreateTask && (
                  <QuickAddBar onAddTask={handleSaveTask} currentUser={currentUser} />
                )}

                {/* High Density Task Table / List */}
                <TaskList
                  tasks={visibleTasks}
                  filters={filters}
                  onToggleComplete={handleToggleComplete}
                  onToggleSubtask={handleToggleSubtask}
                  onEdit={handleOpenEditTask}
                  onDelete={handleDeleteTask}
                  onStartFocusTimer={handleStartFocusTimer}
                  onOpenNewTask={handleOpenNewTask}
                  canEditTask={canEditTask}
                  canDeleteTask={canDeleteTask}
                  canToggleComplete={canToggleComplete}
                  canCreateTask={canCreateTask}
                />
              </div>

              {/* Right 4 Cols: Progress Ring & Reminders List */}
              <div className="col-span-12 xl:col-span-4">
                <RightSidebarWidgets
                  tasks={visibleTasks}
                  streak={streak}
                  onToggleComplete={handleToggleComplete}
                  onStartFocusTimer={handleStartFocusTimer}
                  onOpenNewTask={handleOpenNewTask}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Active Reminder Alerts */}
      <ReminderAlertBanner
        alerts={activeAlerts}
        onComplete={handleToggleComplete}
        onSnooze={handleSnoozeReminder}
        onDismiss={handleDismissReminder}
        onStartFocusTimer={handleStartFocusTimer}
      />

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        editingTask={editingTask}
        users={users}
        currentUser={currentUser}
        canAssignTask={canAssignTask}
      />

      {/* Focus Timer Modal */}
      <FocusTimerModal
        isOpen={isFocusTimerOpen}
        onClose={() => setIsFocusTimerOpen(false)}
        task={focusTimerTask}
        onAddFocusMinutes={handleAddFocusMinutes}
        onCompleteTask={handleToggleComplete}
      />

      {/* Supabase Cloud Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        syncStatus={supabaseSyncStatus}
        syncMessage={supabaseSyncMessage}
        onManualSync={handleManualSync}
        onPushLocalToCloud={handlePushLocalToCloud}
        onPullCloudToLocal={handlePullCloudToLocal}
        tasksCount={tasks.length}
        usersCount={users.length}
      />

      {/* User Management & Role Permissions (RBAC) Modal */}
      <UserManagementModal
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={currentUser}
        users={users}
        rolePermissions={rolePermissions}
        activityLogs={activityLogs}
        tasksCountByUser={tasksCountByUser}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
        onUpdateRolePermissions={handleUpdateRolePermissions}
        onSwitchUser={handleSwitchUser}
        onManualSync={handleManualSync}
        isSyncing={supabaseSyncStatus === 'syncing'}
      />

      {/* User Profile Modal (Avatar Customizer & Bio) */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        user={currentUser}
        onSaveProfile={handleSaveUser}
      />

      {/* Modern Authentication Login / Password Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || !isAuthenticated}
        onClose={() => {
          if (isAuthenticated) {
            setIsAuthModalOpen(false);
          }
        }}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleSaveUser}
        users={users}
        currentUser={currentUser}
      />

      {/* Mobile App Bottom Navigation Bar (Phone Form Factor) */}
      <MobileBottomNav
        currentView={filters.period}
        onNavigate={handleSidebarNavigate}
        onOpenNewTask={handleOpenNewTask}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        todayCount={mobileTodayPending}
        overdueCount={mobileOverduePending}
        canCreateTask={canCreateTask}
      />

      {/* Daily Summary & Report Export Modal */}
      <TodaySummaryModal
        isOpen={isTodaySummaryOpen}
        onClose={() => setIsTodaySummaryOpen(false)}
        tasks={tasks}
        currentUser={currentUser}
      />

      {/* Phone Lock Screen Notification & Setup Modal */}
      <PhoneNotificationModal
        isOpen={isPhoneNotificationModalOpen}
        onClose={() => setIsPhoneNotificationModalOpen(false)}
        tasks={tasks}
      />
    </div>
  );
}
