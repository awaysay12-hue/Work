import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Task, DailyStreak, UserAccount, ActivityLog, RolePermissions, UserRole } from '../types';

// Storage keys for custom Supabase credentials
export const SUPABASE_STORAGE_KEYS = {
  CUSTOM_URL: 'taskmate_custom_supabase_url',
  CUSTOM_KEY: 'taskmate_custom_supabase_anon_key',
};

// Default Supabase project configuration
const DEFAULT_PROJECT_REF = 'rjkxjgqmnvv30fl0o4';
const DEFAULT_SUPABASE_URL = `https://${DEFAULT_PROJECT_REF}.supabase.co`;
const DEFAULT_ANON_KEY = 'sb_publishable_rJKxJgQMNVV30FL0o4_S3w_hNdajzYw';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};

export function isCustomSupabaseConfigured(): boolean {
  try {
    const customUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.CUSTOM_URL);
    const customKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.CUSTOM_KEY);
    if (customUrl && customKey && customUrl.trim() && customKey.trim()) {
      return true;
    }
  } catch {
    // Ignore
  }
  if (metaEnv.VITE_SUPABASE_URL && metaEnv.VITE_SUPABASE_ANON_KEY) {
    return true;
  }
  return false;
}

export function getEffectiveSupabaseConfig(): { url: string; key: string; isCustom: boolean } {
  let customUrl = '';
  let customKey = '';
  try {
    customUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.CUSTOM_URL) || '';
    customKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.CUSTOM_KEY) || '';
  } catch {
    // Ignore localStorage errors
  }

  const isCustom = Boolean((customUrl && customKey) || (metaEnv.VITE_SUPABASE_URL && metaEnv.VITE_SUPABASE_ANON_KEY));
  const url = (customUrl || metaEnv.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
  const key = (customKey || metaEnv.VITE_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY).trim();
  return { url, key, isCustom };
}

export let supabase: SupabaseClient | null = null;

export function initSupabaseClient(customUrl?: string, customKey?: string): SupabaseClient | null {
  try {
    const config = getEffectiveSupabaseConfig();
    const targetUrl = (customUrl !== undefined ? customUrl : config.url).trim();
    const targetKey = (customKey !== undefined ? customKey : config.key).trim();

    if (targetUrl && targetKey) {
      supabase = createClient(targetUrl, targetKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabase;
    }
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
  }
  supabase = null;
  return null;
}

// Initial client creation
initSupabaseClient();

export const SUPABASE_URL = getEffectiveSupabaseConfig().url;
export const SUPABASE_ANON_KEY = getEffectiveSupabaseConfig().key;

/* ==========================================================================
   TASK CONVERTERS & CRUD
   ========================================================================== */

export function taskToDbRow(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description || '',
    category: task.category,
    priority: task.priority,
    due_date: task.dueDate,
    due_time: task.dueTime || null,
    reminder_timing: task.reminderTiming || 'none',
    reminder_triggered: Boolean(task.reminderTriggered),
    reminder_snoozed_until: task.reminderSnoozedUntil || null,
    completed: Boolean(task.completed),
    completed_at: task.completedAt || null,
    created_at: task.createdAt,
    subtasks: task.subtasks || [],
    estimated_minutes: task.estimatedMinutes || 25,
    spent_minutes: task.spentMinutes || 0,
    recurring: task.recurring || 'none',
    tags: task.tags || [],
    assignee_id: task.assigneeId || null,
    assignee_name: task.assigneeName || null,
    creator_id: task.creatorId || null,
    creator_name: task.creatorName || null,
  };
}

export function dbRowToTask(row: any): Task {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    description: row.description || undefined,
    category: row.category || 'other',
    priority: row.priority || 'medium',
    dueDate: row.due_date || new Date().toISOString().split('T')[0],
    dueTime: row.due_time || undefined,
    reminderTiming: row.reminder_timing || 'none',
    reminderTriggered: Boolean(row.reminder_triggered),
    reminderSnoozedUntil: row.reminder_snoozed_until || undefined,
    completed: Boolean(row.completed),
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
    estimatedMinutes: Number(row.estimated_minutes) || 25,
    spentMinutes: Number(row.spent_minutes) || 0,
    recurring: row.recurring || 'none',
    tags: Array.isArray(row.tags) ? row.tags : [],
    assigneeId: row.assignee_id || undefined,
    assigneeName: row.assignee_name || undefined,
    creatorId: row.creator_id || undefined,
    creatorName: row.creator_name || undefined,
  };
}

export async function fetchTasksFromSupabase(): Promise<{ tasks: Task[] | null; error: Error | null }> {
  if (!supabase) {
    return { tasks: null, error: new Error('Supabase client not initialized') };
  }
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data) return { tasks: [], error: null };

    const tasks = data.map(dbRowToTask);
    return { tasks, error: null };
  } catch (err: any) {
    return { tasks: null, error: err };
  }
}

export async function saveTaskToSupabase(task: Task): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const row = taskToDbRow(task);
    const { error } = await supabase.from('tasks').upsert(row);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function syncAllTasksToSupabase(tasks: Task[]): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const rows = tasks.map(taskToDbRow);
    const { error } = await supabase.from('tasks').upsert(rows);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function deleteTaskFromSupabase(taskId: string): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/* ==========================================================================
   USER ACCOUNTS CONVERTERS & CRUD
   ========================================================================== */

export function userToDbRow(user: UserAccount) {
  return {
    id: user.id,
    name: user.name,
    khmer_name: user.khmerName,
    email: user.email,
    password: user.password || '',
    phone: user.phone || '',
    role: user.role,
    department: user.department,
    avatar_color: user.avatarColor,
    avatar_initial: user.avatarInitial,
    avatar_url: user.avatarUrl || null,
    visibility_scope: user.visibilityScope || 'all',
    bio: user.bio || '',
    status: user.status,
    joined_date: user.joinedDate,
    custom_permissions: user.customPermissions || {},
  };
}

export function dbRowToUser(row: any): UserAccount {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    khmerName: String(row.khmer_name || row.khmerName || row.name || ''),
    email: String(row.email || ''),
    password: row.password || '',
    phone: row.phone || '',
    role: (row.role || 'member') as UserRole,
    department: row.department || 'ទូទៅ',
    avatarColor: row.avatar_color || 'from-indigo-500 to-cyan-500',
    avatarInitial: row.avatar_initial || row.name?.charAt(0) || 'U',
    avatarUrl: row.avatar_url || undefined,
    visibilityScope: row.visibility_scope || 'all',
    bio: row.bio || '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    joinedDate: row.joined_date || new Date().toISOString().split('T')[0],
    customPermissions: row.custom_permissions || {},
  };
}

export async function fetchUsersFromSupabase(): Promise<{ users: UserAccount[] | null; error: Error | null }> {
  if (!supabase) {
    return { users: null, error: new Error('Supabase client not initialized') };
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('joined_date', { ascending: true });

    if (error) throw error;
    if (!data) return { users: [], error: null };

    const users = data.map(dbRowToUser);
    return { users, error: null };
  } catch (err: any) {
    return { users: null, error: err };
  }
}

export async function saveUserToSupabase(user: UserAccount): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const row = userToDbRow(user);
    const { error } = await supabase.from('users').upsert(row);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function syncAllUsersToSupabase(users: UserAccount[]): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const rows = users.map(userToDbRow);
    const { error } = await supabase.from('users').upsert(rows);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/* ==========================================================================
   DAILY STREAK CONVERTERS & CRUD (Per-User Scoped)
   ========================================================================== */

export function streakToDbRow(streak: DailyStreak, userId: string = 'main') {
  return {
    id: userId || 'main',
    current_streak: streak.currentStreak,
    longest_streak: streak.longestStreak,
    last_active_date: streak.lastActiveDate,
    total_completed_all_time: streak.totalCompletedAllTime,
    total_focus_minutes_all_time: streak.totalFocusMinutesAllTime,
  };
}

export function dbRowToStreak(row: any): DailyStreak {
  return {
    currentStreak: Number(row.current_streak) || 0,
    longestStreak: Number(row.longest_streak) || 0,
    lastActiveDate: row.last_active_date || new Date().toISOString().split('T')[0],
    totalCompletedAllTime: Number(row.total_completed_all_time) || 0,
    totalFocusMinutesAllTime: Number(row.total_focus_minutes_all_time) || 0,
  };
}

export async function fetchStreakFromSupabase(userId: string = 'main'): Promise<{ streak: DailyStreak | null; error: Error | null }> {
  if (!supabase) {
    return { streak: null, error: new Error('Supabase client not initialized') };
  }
  try {
    const { data, error } = await supabase
      .from('user_streak')
      .select('*')
      .eq('id', userId || 'main')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    if (!data) return { streak: null, error: null };
    return { streak: dbRowToStreak(data), error: null };
  } catch (err: any) {
    return { streak: null, error: err };
  }
}

export async function saveStreakToSupabase(streak: DailyStreak, userId: string = 'main'): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const row = streakToDbRow(streak, userId || 'main');
    const { error } = await supabase.from('user_streak').upsert(row);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/* ==========================================================================
   ACTIVITY LOGS CONVERTERS & CRUD
   ========================================================================== */

export function activityLogToDbRow(log: ActivityLog) {
  return {
    id: log.id,
    user_id: log.userId,
    user_name: log.userName,
    user_role: log.userRole,
    action: log.action,
    target_title: log.targetTitle,
    details: log.details || '',
    timestamp: log.timestamp,
  };
}

export function dbRowToActivityLog(row: any): ActivityLog {
  return {
    id: String(row.id),
    userId: String(row.user_id || ''),
    userName: String(row.user_name || ''),
    userRole: row.user_role || 'member',
    action: row.action || 'create_task',
    targetTitle: row.target_title || '',
    details: row.details || undefined,
    timestamp: row.timestamp || new Date().toISOString(),
  };
}

export async function fetchActivityLogsFromSupabase(): Promise<{ logs: ActivityLog[] | null; error: Error | null }> {
  if (!supabase) {
    return { logs: null, error: new Error('Supabase client not initialized') };
  }
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    if (!data) return { logs: [], error: null };

    const logs = data.map(dbRowToActivityLog);
    return { logs, error: null };
  } catch (err: any) {
    return { logs: null, error: err };
  }
}

export async function saveActivityLogToSupabase(log: ActivityLog): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const row = activityLogToDbRow(log);
    const { error } = await supabase.from('activity_logs').upsert(row);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

export async function syncAllActivityLogsToSupabase(logs: ActivityLog[]): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const rows = logs.map(activityLogToDbRow);
    const { error } = await supabase.from('activity_logs').upsert(rows);
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/* ==========================================================================
   ROLE PERMISSIONS CONVERTERS & CRUD
   ========================================================================== */

export async function fetchRolePermissionsFromSupabase(): Promise<{ permissions: Record<UserRole, RolePermissions> | null; error: Error | null }> {
  if (!supabase) {
    return { permissions: null, error: new Error('Supabase client not initialized') };
  }
  try {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('id', 'matrix')
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    if (!data || !data.matrix) return { permissions: null, error: null };
    return { permissions: data.matrix, error: null };
  } catch (err: any) {
    return { permissions: null, error: err };
  }
}

export async function saveRolePermissionsToSupabase(matrix: Record<UserRole, RolePermissions>): Promise<{ success: boolean; error: Error | null }> {
  if (!supabase) {
    return { success: false, error: new Error('Supabase client not initialized') };
  }
  try {
    const { error } = await supabase.from('role_permissions').upsert({
      id: 'matrix',
      matrix,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}

/* ==========================================================================
   DATABASE DIAGNOSTIC & HEALTH CHECK
   ========================================================================== */

export interface DbHealthReport {
  connected: boolean;
  tasksTableOk: boolean;
  usersTableOk: boolean;
  streakTableOk: boolean;
  activityLogsTableOk: boolean;
  rolePermissionsTableOk: boolean;
  errorMessage?: string;
  tasksCount?: number;
  usersCount?: number;
}

export async function testSupabaseHealthCheck(): Promise<DbHealthReport> {
  const report: DbHealthReport = {
    connected: false,
    tasksTableOk: false,
    usersTableOk: false,
    streakTableOk: false,
    activityLogsTableOk: false,
    rolePermissionsTableOk: false,
  };

  // Re-verify client instance
  if (!supabase) {
    initSupabaseClient();
  }

  if (!supabase) {
    const isCustom = isCustomSupabaseConfigured();
    report.errorMessage = isCustom
      ? 'មិនអាចបង្កើតការតភ្ជាប់ Supabase Client បានទេ (សូមពិនិត្យមើលទម្រង់ Project URL និង Key)'
      : 'មិនទាន់បានកំណត់ API Credentials ផ្ទាល់ខ្លួននៅឡើយ។ សូមចូលទៅកាន់ផ្ទាំង "ការកំណត់ API Credentials" ដើម្បីភ្ជាប់។';
    return report;
  }

  try {
    // 1. Test Tasks
    const { data: tasksData, error: tasksErr } = await supabase.from('tasks').select('id', { count: 'exact', head: true });
    report.tasksTableOk = !tasksErr;
    if (tasksData !== null) report.tasksCount = tasksData.length;

    // 2. Test Users
    const { data: usersData, error: usersErr } = await supabase.from('users').select('id', { count: 'exact', head: true });
    report.usersTableOk = !usersErr;
    if (usersData !== null) report.usersCount = usersData.length;

    // 3. Test Streak
    const { error: streakErr } = await supabase.from('user_streak').select('id', { head: true });
    report.streakTableOk = !streakErr;

    // 4. Test Activity Logs
    const { error: logsErr } = await supabase.from('activity_logs').select('id', { head: true });
    report.activityLogsTableOk = !logsErr;

    // 5. Test Role Permissions
    const { error: rbacErr } = await supabase.from('role_permissions').select('id', { head: true });
    report.rolePermissionsTableOk = !rbacErr;

    report.connected = report.tasksTableOk || report.usersTableOk || report.streakTableOk;

    if (!report.connected) {
      const errMessage = tasksErr?.message || usersErr?.message || streakErr?.message || '';
      if (errMessage.includes('relation') || errMessage.includes('does not exist') || errMessage.includes('42P01')) {
        report.errorMessage = 'តារាងមិនទាន់ត្រូវបានបង្កើតក្នុង Supabase ទេ។ សូម Copy កូដ SQL ពីផ្ទាំង "SQL Script" យកទៅ Run ក្នុង Supabase Dashboard > SQL Editor';
      } else if (errMessage.includes('Failed to fetch') || errMessage.includes('NetworkError') || errMessage.includes('fetch')) {
        report.errorMessage = 'មិនអាចទាក់ទង Supabase Server បានទេ (សូមពិនិត្យមើល URL & Key ឬការតភ្ជាប់ Internet ក្នុងផ្ទាំង "ការកំណត់ API Credentials")';
      } else if (errMessage.includes('JWT') || errMessage.includes('apikey') || errMessage.includes('Invalid API key') || errMessage.includes('unauthorized')) {
        report.errorMessage = 'Anon Key មិនត្រឹមត្រូវ។ សូមចម្លង anon public key ពី Supabase Project Settings > API មកដាក់ក្នុងផ្ទាំង "ការកំណត់ API Credentials"';
      } else if (errMessage) {
        report.errorMessage = `បញ្ហា៖ ${errMessage}`;
      } else if (!isCustomSupabaseConfigured()) {
        report.errorMessage = 'សូមបញ្ចូល Project URL និង Anon Key ផ្ទាល់ខ្លួនរបស់អ្នកក្នុងផ្ទាំង "ការកំណត់ API Credentials" រួច Run SQL Script ក្នុង Supabase Dashboard';
      }
    }
  } catch (err: any) {
    report.errorMessage = err.message || 'មានបញ្ហាក្នុងការពិនិត្យស្ថានភាព Supabase Database';
  }

  return report;
}
