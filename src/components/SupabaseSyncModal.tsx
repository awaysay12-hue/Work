import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  X,
  Sparkles,
  Server,
  KeyRound,
  ShieldCheck,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_STORAGE_KEYS,
  initSupabaseClient,
  testSupabaseHealthCheck,
  DbHealthReport,
} from '../lib/supabase';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  syncMessage: string;
  onManualSync: () => Promise<void>;
  onPushLocalToCloud: () => Promise<void>;
  onPullCloudToLocal: () => Promise<void>;
  tasksCount: number;
  usersCount?: number;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  syncMessage,
  onManualSync,
  onPushLocalToCloud,
  onPullCloudToLocal,
  tasksCount,
  usersCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'config'>('status');
  const [copied, setCopied] = useState(false);
  const [isOperating, setIsOperating] = useState(false);
  const [opMessage, setOpMessage] = useState<string | null>(null);

  // Custom Supabase Credentials state
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [configSavedMessage, setConfigSavedMessage] = useState<string | null>(null);

  // Health report
  const [healthReport, setHealthReport] = useState<DbHealthReport | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        setCustomUrl(localStorage.getItem(SUPABASE_STORAGE_KEYS.CUSTOM_URL) || '');
        setCustomKey(localStorage.getItem(SUPABASE_STORAGE_KEYS.CUSTOM_KEY) || '');
      } catch {
        // Ignore
      }
      runHealthCheck();
    }
  }, [isOpen]);

  const runHealthCheck = async () => {
    setIsCheckingHealth(true);
    try {
      const report = await testSupabaseHealthCheck();
      setHealthReport(report);
    } catch {
      // Ignore
    } finally {
      setIsCheckingHealth(false);
    }
  };

  if (!isOpen) return null;

  const sqlSchema = `-- =========================================================================
-- TASKMATE KHMER PRO - COMPLETE DATABASE INITIALIZATION SCRIPT FOR SUPABASE
-- =========================================================================
-- Copy and run this script in Supabase Dashboard -> SQL Editor (New Query)

-- 1. TASKS TABLE (កិច្ចការ និងភារកិច្ច)
create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text default '',
  category text not null default 'other',
  priority text not null default 'medium',
  due_date text not null,
  due_time text,
  reminder_timing text default 'none',
  reminder_triggered boolean default false,
  reminder_snoozed_until text,
  completed boolean default false,
  completed_at text,
  created_at text not null default now()::text,
  subtasks jsonb default '[]'::jsonb,
  estimated_minutes integer default 25,
  spent_minutes integer default 0,
  recurring text default 'none',
  tags jsonb default '[]'::jsonb,
  assignee_id text,
  assignee_name text,
  creator_id text,
  creator_name text
);

-- 2. USERS TABLE (គណនី និងសិទ្ធិអ្នកប្រើប្រាស់ RBAC)
create table if not exists public.users (
  id text primary key,
  name text not null,
  khmer_name text not null,
  email text not null,
  password text default '',
  phone text default '',
  role text not null default 'member',
  department text default 'ទូទៅ',
  avatar_color text default 'from-indigo-500 to-cyan-500',
  avatar_initial text default 'U',
  avatar_url text,
  visibility_scope text default 'all',
  bio text default '',
  status text default 'active',
  joined_date text default now()::text,
  custom_permissions jsonb default '{}'::jsonb
);

-- 3. USER STREAK TABLE (ស្ថិតិ និងថ្ងៃជាប់ៗគ្នា)
create table if not exists public.user_streak (
  id text primary key default 'main',
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date text,
  total_completed_all_time integer default 0,
  total_focus_minutes_all_time integer default 0
);

-- 4. ACTIVITY LOGS TABLE (កំណត់ត្រាសកម្មភាព)
create table if not exists public.activity_logs (
  id text primary key,
  user_id text not null,
  user_name text not null,
  user_role text not null default 'member',
  action text not null,
  target_title text not null,
  details text default '',
  timestamp text not null default now()::text
);

-- 5. ROLE PERMISSIONS TABLE (ម៉ាទ្រីសសិទ្ធិ Role Matrix)
create table if not exists public.role_permissions (
  id text primary key default 'matrix',
  matrix jsonb not null,
  updated_at text not null default now()::text
);

-- 6. CREATE INDEXES FOR FAST QUERYING
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_tasks_completed on public.tasks(completed);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_activity_logs_time on public.activity_logs(timestamp desc);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) & ALLOW ACCESS
alter table public.tasks enable row level security;
drop policy if exists "Public tasks access" on public.tasks;
create policy "Public tasks access" on public.tasks for all using (true) with check (true);

alter table public.users enable row level security;
drop policy if exists "Public users access" on public.users;
create policy "Public users access" on public.users for all using (true) with check (true);

alter table public.user_streak enable row level security;
drop policy if exists "Public streak access" on public.user_streak;
create policy "Public streak access" on public.user_streak for all using (true) with check (true);

alter table public.activity_logs enable row level security;
drop policy if exists "Public logs access" on public.activity_logs;
create policy "Public logs access" on public.activity_logs for all using (true) with check (true);

alter table public.role_permissions enable row level security;
drop policy if exists "Public role permissions access" on public.role_permissions;
create policy "Public role permissions access" on public.role_permissions for all using (true) with check (true);

-- 8. ENABLE REALTIME SYNC (ALLOW REALTIME BROADCAST ACROSS DEVICES)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'users') then
    alter publication supabase_realtime add table public.users;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'activity_logs') then
    alter publication supabase_realtime add table public.activity_logs;
  end if;
exception
  when others then null;
end $$;

-- 9. SEED DEFAULT SUPER ADMIN ACCOUNT
insert into public.users (id, name, khmer_name, email, password, phone, role, department, avatar_color, avatar_initial, avatar_url, status, joined_date)
values
  ('user-admin-1', 'PUNLEU (Admin)', 'ពន្លឺ (Super Admin)', 'sunpunleu168@gmail.com', '123', '012 000 000', 'admin', 'បច្ចេកវិទ្យា & IT', 'from-rose-500 to-indigo-600', 'ព', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', 'active', now()::text)
on conflict (id) do update set
  email = excluded.email,
  password = excluded.password,
  khmer_name = excluded.khmer_name,
  role = excluded.role;

-- 10. SEED DEFAULT ROLE PERMISSIONS
insert into public.role_permissions (id, matrix, updated_at)
values ('matrix', '{
  "admin": {"canCreateTask": true, "canEditTask": true, "canDeleteTask": true, "canAssignTask": true, "canCompleteTask": true, "canManageUsers": true, "canExportData": true, "canImportData": true, "canSyncCloud": true},
  "manager": {"canCreateTask": true, "canEditTask": true, "canDeleteTask": true, "canAssignTask": true, "canCompleteTask": true, "canManageUsers": false, "canExportData": true, "canImportData": true, "canSyncCloud": true},
  "member": {"canCreateTask": true, "canEditTask": true, "canDeleteTask": false, "canAssignTask": false, "canCompleteTask": true, "canManageUsers": false, "canExportData": true, "canImportData": false, "canSyncCloud": false},
  "viewer": {"canCreateTask": false, "canEditTask": false, "canDeleteTask": false, "canAssignTask": false, "canCompleteTask": false, "canManageUsers": false, "canExportData": true, "canImportData": false, "canSyncCloud": false}
}'::jsonb, now()::text)
on conflict (id) do update set
  matrix = excluded.matrix,
  updated_at = now()::text;
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCustomConfig = () => {
    try {
      if (customUrl.trim()) {
        localStorage.setItem(SUPABASE_STORAGE_KEYS.CUSTOM_URL, customUrl.trim());
      } else {
        localStorage.removeItem(SUPABASE_STORAGE_KEYS.CUSTOM_URL);
      }

      if (customKey.trim()) {
        localStorage.setItem(SUPABASE_STORAGE_KEYS.CUSTOM_KEY, customKey.trim());
      } else {
        localStorage.removeItem(SUPABASE_STORAGE_KEYS.CUSTOM_KEY);
      }

      initSupabaseClient(customUrl.trim(), customKey.trim());
      setConfigSavedMessage('បានរក្សាទុក និងភ្ជាប់ឡើងវិញជោគជ័យ! ✅');
      setTimeout(() => setConfigSavedMessage(null), 3500);
      runHealthCheck();
      onManualSync();
    } catch {
      setConfigSavedMessage('មានបញ្ហាក្នុងការរក្សាទុក!');
    }
  };

  const handleResetToDefault = () => {
    try {
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.CUSTOM_URL);
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.CUSTOM_KEY);
      setCustomUrl('');
      setCustomKey('');
      initSupabaseClient();
      setConfigSavedMessage('បានកំណត់ទៅ Default Supabase Project វិញរួចរាល់! 🔄');
      setTimeout(() => setConfigSavedMessage(null), 3500);
      runHealthCheck();
      onManualSync();
    } catch {
      // Ignore
    }
  };

  const handlePush = async () => {
    setIsOperating(true);
    setOpMessage('កំពុងបញ្ជូនទិន្នន័យទាំងអស់ (Tasks, Users, Logs) ទៅ Cloud Database...');
    try {
      await onPushLocalToCloud();
      setOpMessage('បានបញ្ជូនទិន្នន័យទៅ Supabase ជោគជ័យ! ✅');
      await runHealthCheck();
    } catch (err: any) {
      setOpMessage(`មានបញ្ហា៖ ${err.message || 'មិនអាចបញ្ជូនបាន'}`);
    } finally {
      setIsOperating(false);
      setTimeout(() => setOpMessage(null), 4000);
    }
  };

  const handlePull = async () => {
    setIsOperating(true);
    setOpMessage('កំពុងទាញទិន្នន័យពី Cloud Database...');
    try {
      await onPullCloudToLocal();
      setOpMessage('បានទាញទិន្នន័យពី Supabase ជោគជ័យ! ✅');
      await runHealthCheck();
    } catch (err: any) {
      setOpMessage(`មានបញ្ហា៖ ${err.message || 'មិនអាចទាញបាន'}`);
    } finally {
      setIsOperating(false);
      setTimeout(() => setOpMessage(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-md">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight flex items-center gap-2">
                <span>ការគ្រប់គ្រង Supabase Database</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  PostgreSQL Cloud
                </span>
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                ការកំណត់តារាងទិន្នន័យ, សមកាលកម្ម Real-time & ការធ្វើរោគវិនិច្ឆ័យ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="បិទ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'status'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>ស្ថានភាព & Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>SQL Script បង្កើត Tables</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-teal-600" />
            <span>ការកំណត់ API Credentials</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-slate-800">
          {/* TAB 1: STATUS & DIAGNOSTICS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Status Header */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    ស្ថានភាពតភ្ជាប់ទូទៅ (Global Connection)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {healthReport?.connected || syncStatus === 'synced' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ភ្ជាប់ជោគជ័យ (Cloud Connected)
                      </span>
                    ) : syncStatus === 'syncing' || isCheckingHealth ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> កំពុងពិនិត្យការតភ្ជាប់...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5" /> តម្រូវការកំណត់ Credentials & Tables
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {healthReport?.errorMessage || syncMessage}
                </p>

                {opMessage && (
                  <div className="mt-2 text-xs font-bold p-3 bg-indigo-50 text-indigo-800 rounded-xl border border-indigo-200 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>{opMessage}</span>
                  </div>
                )}
              </div>

              {/* Quick Setup Recommendation Banner when not fully connected */}
              {(!healthReport?.connected || !healthReport?.tasksTableOk) && (
                <div className="bg-gradient-to-br from-indigo-50 to-emerald-50 border border-indigo-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        របៀបរៀបចំ Supabase Database ឱ្យដំណើរការ ១០០%៖
                      </h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        អនុវត្តតែ ២ ជំហានងាយៗដើម្បីឱ្យទិន្នន័យ Sync ឆ្លងកាត់ឧបករណ៍ (PC & ទូរស័ព្ទ) ដោយស្វ័យប្រវត្តិ៖
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setActiveTab('config')}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:shadow-xs transition-all text-left cursor-pointer group"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase">ជំហានទី ១</span>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          បញ្ចូល Project URL & Anon Key
                        </p>
                      </div>
                      <KeyRound className="w-4 h-4 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      onClick={() => setActiveTab('sql')}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 hover:shadow-xs transition-all text-left cursor-pointer group"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">ជំហានទី ២</span>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                          ចម្លង SQL យកទៅ Run ក្នុង Supabase
                        </p>
                      </div>
                      <Copy className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {/* Table Diagnostics Card */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-white shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>ការពិនិត្យស្ថានភាពតារាង Database Tables (Health Check)</span>
                  </h3>
                  <button
                    onClick={runHealthCheck}
                    disabled={isCheckingHealth}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 p-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                    <span>Refresh Check</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Table: tasks */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="font-mono font-medium text-slate-700">1. public.tasks</span>
                    {healthReport?.tasksTableOk ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready ({tasksCount})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </div>

                  {/* Table: users */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="font-mono font-medium text-slate-700">2. public.users</span>
                    {healthReport?.usersTableOk ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready ({usersCount})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </div>

                  {/* Table: user_streak */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="font-mono font-medium text-slate-700">3. public.user_streak</span>
                    {healthReport?.streakTableOk ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </div>

                  {/* Table: activity_logs */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="font-mono font-medium text-slate-700">4. public.activity_logs</span>
                    {healthReport?.activityLogsTableOk ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" /> Missing
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Migration Push/Pull Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handlePush}
                  disabled={isOperating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>បញ្ជូនទិន្នន័យក្នុងម៉ាស៊ីន ទៅ Cloud</span>
                </button>
                <button
                  onClick={handlePull}
                  disabled={isOperating}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <DownloadCloud className="w-4 h-4" />
                  <span>ទាញយកទិន្នន័យពី Cloud មកវិញ</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SQL SCRIPT */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>SQL Script បង្កើត Table & RLS Policy ពេញលេញ</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ចម្លងកូដនេះ ចូល Supabase Dashboard &gt; SQL Editor &gt; New Query រួចចុច <strong>RUN</strong>
                  </p>
                </div>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> បានចម្លងរួចរាល់!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> ចម្លងកូដ SQL (Copy)
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                <pre className="bg-slate-950 text-emerald-400 p-4 text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed selection:bg-indigo-500 selection:text-white">
                  {sqlSchema}
                </pre>
              </div>

              <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Script នេះបង្កើតតារាងទាំង 5, បង្កើត Index សម្រាប់បង្កើនល្បឿន និងបើកសិទ្ធិ RLS យ៉ាងត្រឹមត្រូវ។</span>
              </div>
            </div>
          )}

          {/* TAB 3: API CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-600" />
                    <span>ព័ត៌មានគណនី Supabase Project ផ្ទាល់ខ្លួន (Free Tier)</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    Settings ➔ API
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> របៀបស្វែងរក Credentials ក្នុង Supabase៖
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 pl-1">
                    <li>
                      ចូលទៅកាន់ <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">supabase.com/dashboard</a> រួចបើក Project របស់អ្នក
                    </li>
                    <li>
                      ចូលទៅកាន់ <strong>Project Settings</strong> (រូបកង់ធ្មេញ) ➔ ជ្រើសរើសម៉ឺនុយ <strong>API</strong>
                    </li>
                    <li>
                      ចម្លង <strong>Project URL</strong> (ឧ. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">https://abcdefg.supabase.co</code>)
                    </li>
                    <li>
                      ចម្លង <strong>anon public API key</strong> (ជាកូដ <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">eyJhbGci...</code>)
                    </li>
                  </ol>
                </div>

                {configSavedMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{configSavedMessage}</span>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Project URL (e.g. https://your-project.supabase.co)
                    </label>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder={SUPABASE_URL || 'https://your-id.supabase.co'}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Anon Public API Key (eyJhbGci...)
                    </label>
                    <input
                      type="password"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                    <button
                      onClick={handleSaveCustomConfig}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>រក្សាទុក & ភ្ជាប់ឡើងវិញ</span>
                    </button>
                    <button
                      onClick={handleResetToDefault}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>កំណត់ឡើងវិញ (Clear)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Next step hint */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>បន្ទាប់ពីរៀបចំរួច សូមចូលទៅកាន់ផ្ទាំង <strong>"SQL Script បង្កើត Tables"</strong> ដើម្បី Run កូដក្នុង Supabase SQL Editor។</span>
                </div>
                <button
                  onClick={() => setActiveTab('sql')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer shadow-xs"
                >
                  មើល SQL Script ➔
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={async () => {
              await onManualSync();
              await runHealthCheck();
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> ផ្ទៀងផ្ទាត់ការតភ្ជាប់ម្តងទៀត
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            បិទផ្ទាំង
          </button>
        </div>
      </div>
    </div>
  );
};
