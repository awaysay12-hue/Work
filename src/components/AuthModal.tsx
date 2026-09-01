import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  User,
  Building,
  Shield,
  Sparkles,
  RefreshCw,
  Database,
  KeyRound,
  Check,
  Smartphone,
} from 'lucide-react';
import { UserAccount, UserRole, TaskVisibilityScope } from '../types';
import { verifyUserLogin, ROLE_CONFIGS } from '../utils/userPermissions';
import { fetchUsersFromSupabase, saveUserToSupabase, supabase } from '../lib/supabase';
import { soundFx } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterUser?: (newUser: UserAccount) => void;
  users?: UserAccount[];
  currentUser?: UserAccount;
  forceLoginScreen?: boolean;
  isFullScreen?: boolean;
}

const AVATAR_COLORS = [
  'from-rose-500 to-indigo-600',
  'from-indigo-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-pink-600',
  'from-blue-600 to-indigo-700',
  'from-teal-500 to-emerald-700',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onRegisterUser,
  users = [],
  forceLoginScreen = false,
  isFullScreen = false,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'enroll'>('login');
  const [currentUsersList, setCurrentUsersList] = useState<UserAccount[]>(() => {
    return Array.isArray(users) ? users : [];
  });

  // Login form state
  const [emailOrName, setEmailOrName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Enroll form state (Point 4)
  const [enrollKhmerName, setEnrollKhmerName] = useState<string>('');
  const [enrollName, setEnrollName] = useState<string>('');
  const [enrollEmail, setEnrollEmail] = useState<string>('');
  const [enrollPhone, setEnrollPhone] = useState<string>('');
  const [enrollPassword, setEnrollPassword] = useState<string>('');
  const [enrollDepartment, setEnrollDepartment] = useState<string>('បច្ចេកវិទ្យា & IT');
  const [enrollRole, setEnrollRole] = useState<UserRole>('member');
  const [showEnrollPassword, setShowEnrollPassword] = useState<boolean>(false);

  // Status & Notifications
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudSyncedCount, setCloudSyncedCount] = useState<number | null>(null);

  // Sync prop users if changed
  useEffect(() => {
    if (Array.isArray(users) && users.length > 0) {
      setCurrentUsersList((prev) => {
        const map = new Map<string, UserAccount>();
        prev.forEach((u) => { if (u && u.id) map.set(u.id, u); });
        users.forEach((u) => { if (u && u.id) map.set(u.id, u); });
        return Array.from(map.values());
      });
    }
  }, [users]);

  // Point 3: Auto-sync with Supabase Cloud Database on Mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const autoSyncCloud = async () => {
      if (!supabase) return;
      setIsSyncingCloud(true);
      try {
        const { users: remoteUsers, error } = await fetchUsersFromSupabase();
        if (!error && remoteUsers && remoteUsers.length > 0 && isMounted) {
          setCurrentUsersList((prev) => {
            const map = new Map<string, UserAccount>();
            prev.forEach((u) => { if (u && u.id) map.set(u.id, u); });
            remoteUsers.forEach((u) => { if (u && u.id) map.set(u.id, u); });
            const merged = Array.from(map.values());

            try {
              localStorage.setItem('taskmate_users', JSON.stringify(merged));
              localStorage.setItem('kh_daily_users_data_v1', JSON.stringify(merged));
            } catch {
              // Ignore storage limits
            }
            return merged;
          });
          setCloudSyncedCount(remoteUsers.length);
        }
      } catch (err) {
        console.warn('Auto Cloud Sync info:', err);
      } finally {
        if (isMounted) setIsSyncingCloud(false);
      }
    };

    autoSyncCloud();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Manual Trigger for Point 3: Sync Cloud Database
  const handleManualSyncCloud = async () => {
    soundFx.playClick();
    setIsSyncingCloud(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { users: remoteUsers, error } = await fetchUsersFromSupabase();
      if (error) {
        setErrorMessage(`មិនអាចទាញទិន្នន័យពី Cloud: ${error.message || 'សូមពិនិត្យអ៊ីនធឺណិត'}`);
      } else if (remoteUsers) {
        setCurrentUsersList((prev) => {
          const map = new Map<string, UserAccount>();
          prev.forEach((u) => { if (u && u.id) map.set(u.id, u); });
          remoteUsers.forEach((u) => { if (u && u.id) map.set(u.id, u); });
          const merged = Array.from(map.values());

          try {
            localStorage.setItem('taskmate_users', JSON.stringify(merged));
            localStorage.setItem('kh_daily_users_data_v1', JSON.stringify(merged));
          } catch {
            // Ignore
          }
          return merged;
        });

        soundFx.playTaskCompleteFanfare();
        setCloudSyncedCount(remoteUsers.length);
        setSuccessMessage(`បានធ្វើសមកាលកម្ម ${remoteUsers.length} គណនីពី Supabase Cloud Database ជោគជ័យ!`);
      }
    } catch {
      setErrorMessage('មានបញ្ហាក្នុងការភ្ជាប់ទៅកាន់ Supabase Cloud');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Point 1: Handle Sign In for Existing & Enrolled Users
  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      let candidatePool = [...currentUsersList];

      // Point 3: Fetch fresh remote users on login attempt
      try {
        if (supabase) {
          const { users: remoteUsers } = await fetchUsersFromSupabase();
          if (remoteUsers && remoteUsers.length > 0) {
            const map = new Map<string, UserAccount>();
            candidatePool.forEach((u) => { if (u && u.id) map.set(u.id, u); });
            remoteUsers.forEach((u) => { if (u && u.id) map.set(u.id, u); });
            candidatePool = Array.from(map.values());
            setCurrentUsersList(candidatePool);
          }
        }
      } catch {
        // Fallback to local
      }

      // Point 1: Verify Credentials strictly
      const result = verifyUserLogin(emailOrName, password, candidatePool);

      setIsLoading(false);

      if (result.success && result.user) {
        soundFx.playCelebration();
        setSuccessMessage(`ស្វាគមន៍! សួស្តី ${result.user.khmerName || result.user.name}`);

        // Persist session if rememberMe is enabled
        if (rememberMe) {
          try {
            localStorage.setItem('taskmate_current_user_id', result.user.id);
            localStorage.setItem('kh_daily_current_user_id_v1', result.user.id);
            localStorage.setItem('taskmate_auth_authenticated', 'true');
            localStorage.setItem('kh_daily_auth_authenticated_v1', 'true');
          } catch {
            // Ignore
          }
        }

        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 300);
      } else {
        soundFx.playAlert();
        setErrorMessage(
          result.message ||
            'ការចូលប្រើប្រាស់មិនជោគជ័យ! សូមពិនិត្យអ៊ីមែល ឬពាក្យសម្ងាត់ (Default: 123456 ឬ 123)'
        );
      }
    } catch {
      setIsLoading(false);
      soundFx.playAlert();
      setErrorMessage('មានបញ្ហាបច្ចេកទេសក្នុងការផ្ទៀងផ្ទាត់គណនី សូមសាកល្បងម្តងទៀត');
    }
  };

  // Point 4: Handle User Enrollment / Registration
  const handleEnrollUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = enrollEmail.trim().toLowerCase();
    const cleanKhmerName = enrollKhmerName.trim();
    const cleanName = enrollName.trim() || cleanKhmerName;
    const cleanPassword = enrollPassword.trim();
    const cleanPhone = enrollPhone.trim();

    if (!cleanKhmerName) {
      setErrorMessage('សូមបញ្ចូលឈ្មោះពេញជាភាសាខ្មែរ');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលឱ្យបានត្រឹមត្រូវ (ឧ. name@company.com)');
      return;
    }
    if (!cleanPassword || cleanPassword.length < 3) {
      setErrorMessage('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៣ តួអក្សរឡើងទៅ');
      return;
    }

    setIsLoading(true);

    try {
      // Check existing users from local and cloud
      let allUsers = [...currentUsersList];
      try {
        if (supabase) {
          const { users: remoteUsers } = await fetchUsersFromSupabase();
          if (remoteUsers && remoteUsers.length > 0) {
            const map = new Map<string, UserAccount>();
            allUsers.forEach((u) => { if (u && u.id) map.set(u.id, u); });
            remoteUsers.forEach((u) => { if (u && u.id) map.set(u.id, u); });
            allUsers = Array.from(map.values());
          }
        }
      } catch {
        // Continue
      }

      const emailExists = allUsers.some(
        (u) => u && u.email && u.email.trim().toLowerCase() === cleanEmail
      );

      if (emailExists) {
        setIsLoading(false);
        setErrorMessage('អ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ! សូមប្រើប្រាស់អ៊ីមែលផ្សេង ឬចុចចូលប្រើប្រាស់ (Sign In)');
        return;
      }

      // Generate avatar initial and color
      const initial = cleanKhmerName.charAt(0) || cleanName.charAt(0) || 'U';
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
      const defaultScope: TaskVisibilityScope =
        enrollRole === 'admin'
          ? 'all'
          : enrollRole === 'manager'
          ? 'department'
          : 'assigned_only';

      const newUser: UserAccount = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: cleanName,
        khmerName: cleanKhmerName,
        email: cleanEmail,
        password: cleanPassword,
        phone: cleanPhone || '',
        role: enrollRole,
        department: enrollDepartment.trim() || 'បច្ចេកវិទ្យា & IT',
        visibilityScope: defaultScope,
        avatarColor: randomColor,
        avatarInitial: initial,
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
      };

      // 1. Save to state & notify parent
      if (onRegisterUser) {
        onRegisterUser(newUser);
      }

      // 2. Point 3: Save directly to Supabase Cloud Database
      saveUserToSupabase(newUser).catch((err) => {
        console.warn('Failed to sync new user to Supabase Cloud:', err);
      });

      // 3. Update Local Storage and component state
      const updatedList = [newUser, ...allUsers.filter((u) => u.id !== newUser.id)];
      setCurrentUsersList(updatedList);

      try {
        localStorage.setItem('taskmate_users', JSON.stringify(updatedList));
        localStorage.setItem('kh_daily_users_data_v1', JSON.stringify(updatedList));
        localStorage.setItem('taskmate_current_user_id', newUser.id);
        localStorage.setItem('kh_daily_current_user_id_v1', newUser.id);
        localStorage.setItem('taskmate_auth_authenticated', 'true');
        localStorage.setItem('kh_daily_auth_authenticated_v1', 'true');
      } catch {
        // Ignore
      }

      setIsLoading(false);
      soundFx.playCelebration();
      setSuccessMessage(`បានចុះឈ្មោះគណនី "${cleanKhmerName}" និងរក្សាទុកក្នុង Cloud ជោគជ័យ!`);

      // Point 4: Automatically log in the newly enrolled user
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 400);
    } catch {
      setIsLoading(false);
      setErrorMessage('មានបញ្ហាក្នុងការចុះឈ្មោះ សូមសាកល្បងម្តងទៀត');
    }
  };

  const content = (
    <div
      id="auth-modal-card"
      className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-scale-in"
    >
      {/* Top Decorative Header */}
      <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-indigo-900/40">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-2 ring-white/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>{activeTab === 'login' ? 'ប្រព័ន្ធចូលប្រើប្រាស់' : 'ចុះឈ្មោះគណនីថ្មី'}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                  {activeTab === 'login' ? 'ចំណុចទី ១' : 'ចំណុចទី ៤'}
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                {activeTab === 'login'
                  ? 'ផ្ទៀងផ្ទាត់គណនី និង Cloud Database'
                  : 'បង្កើតគណនីថ្មី រក្សាទុកក្នុង Cloud ភ្លាមៗ'}
              </p>
            </div>
          </div>

          {onClose && !forceLoginScreen && !isFullScreen && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors text-sm cursor-pointer"
              title="បិទ"
            >
              ✕
            </button>
          )}
        </div>

        {/* Tab Switcher: Login (Point 1) vs Enroll (Point 4) */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-indigo-500/30 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>ចូលប្រើប្រាស់ (Sign In)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('enroll');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'enroll'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>ចុះឈ្មោះថ្មី (Enroll)</span>
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        {/* Point 3 Status Banner */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Database className="w-4 h-4 text-indigo-600" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="text-[11px]">
              <span className="font-bold text-slate-800">Supabase Cloud Database</span>
              <span className="text-slate-500 block text-[10px]">
                {cloudSyncedCount !== null
                  ? `បាន Sync ជោគជ័យ (${cloudSyncedCount} Users)`
                  : 'ភ្ជាប់សមកាលកម្មទិន្នន័យស្វ័យប្រវត្តិ'}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSyncingCloud}
            onClick={handleManualSyncCloud}
            className="px-2.5 py-1 bg-white hover:bg-indigo-50 active:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-[10px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="ទាញទិន្នន័យពី Cloud ម្តងទៀត (Point 3)"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncingCloud ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isSyncingCloud ? 'កំពុង Sync...' : 'Sync Cloud'}</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* 1. SIGN IN FORM (Point 1) */}
        {activeTab === 'login' && (
          <form onSubmit={handleSignIn} className="space-y-3.5">
            {/* Identifier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                អ៊ីមែល, ឈ្មោះ ឬ លេខទូរស័ព្ទ (Email / Username / Phone)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={emailOrName}
                  onChange={(e) => setEmailOrName(e.target.value)}
                  placeholder="បញ្ចូល sunpunleu168@gmail.com ឬ ឈ្មោះ..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  ពាក្យសម្ងាត់ (Password)
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Admin: <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded font-bold font-mono">123</code> | Default: <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono">123456</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="បញ្ចូលពាក្យសម្ងាត់..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                />
                <span>ចងចាំការចូលប្រើប្រាស់នេះ (Remember me)</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>ចូលទៅកាន់ផ្ទាំងការងារ (Sign In)</span>
                </>
              )}
            </button>

            {/* Quick One-Click Accounts Selector */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>គណនីក្នុងប្រព័ន្ធ ({currentUsersList.length}) - ចុចដើម្បីបំពេញស្វ័យប្រវត្តិ៖</span>
                </span>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {currentUsersList.map((u) => {
                  const roleCfg = ROLE_CONFIGS[u.role] || ROLE_CONFIGS.member;
                  const isSelected = emailOrName === u.email || emailOrName === u.name;
                  const defaultPass = u.password || (u.role === 'admin' ? '123' : '123456');

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setEmailOrName(u.email || u.name);
                        setPassword(defaultPass);
                        soundFx.playClick();
                      }}
                      className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                            u.avatarColor || 'from-indigo-500 to-cyan-500'
                          } text-white text-[11px] font-bold flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {u.avatarInitial || u.khmerName?.charAt(0) || 'U'}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">
                              {u.khmerName || u.name}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate font-mono">
                            {u.email || u.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
                        >
                          {roleCfg.titleKh}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                          <KeyRound className="w-2.5 h-2.5 text-slate-400" />
                          <span>{u.password ? '●●●' : defaultPass}</span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        )}

        {/* 2. ENROLL / REGISTER NEW USER FORM (Point 4) */}
        {activeTab === 'enroll' && (
          <form onSubmit={handleEnrollUser} className="space-y-3.5">
            {/* Khmer Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ឈ្មោះពេញជាភាសាខ្មែរ (Khmer Full Name) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={enrollKhmerName}
                  onChange={(e) => setEnrollKhmerName(e.target.value)}
                  placeholder="ឧ. សុខា គង់, វិចិត្រ ម៉ៅ..."
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium"
                />
              </div>
            </div>

            {/* English / Latin Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ឈ្មោះជាភាសាអង់គ្លេស (Latin / English Name)
              </label>
              <input
                type="text"
                value={enrollName}
                onChange={(e) => setEnrollName(e.target.value)}
                placeholder="ឧ. Sokha Kong, Vichetr Mao..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  អ៊ីមែលគណនី (Email) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={enrollEmail}
                    onChange={(e) => setEnrollEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="w-full pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  លេខទូរស័ព្ទ (Phone Number)
                </label>
                <div className="relative">
                  <Smartphone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={enrollPhone}
                    onChange={(e) => setEnrollPhone(e.target.value)}
                    placeholder="012 345 678"
                    className="w-full pl-8 pr-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                កំណត់ពាក្យសម្ងាត់ (Set Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showEnrollPassword ? 'text' : 'password'}
                  required
                  value={enrollPassword}
                  onChange={(e) => setEnrollPassword(e.target.value)}
                  placeholder="យ៉ាងហោចណាស់ ៣ តួអក្សរ..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-900 placeholder-slate-400 font-medium tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowEnrollPassword(!showEnrollPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  title={showEnrollPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                >
                  {showEnrollPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Department and Role Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  នាយកដ្ឋាន / ផ្នែក
                </label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={enrollDepartment}
                    onChange={(e) => setEnrollDepartment(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="បច្ចេកវិទ្យា & IT">បច្ចេកវិទ្យា & IT</option>
                    <option value="គ្រប់គ្រងគម្រោង / PMO">គ្រប់គ្រងគម្រោង / PMO</option>
                    <option value="រចនា & Design">រចនា & Design</option>
                    <option value="ទីផ្សារ & Sale">ទីផ្សារ & Sale</option>
                    <option value="រដ្ឋបាល & HR">រដ្ឋបាល & HR</option>
                    <option value="គណនេយ្យ & ហិរញ្ញវត្ថុ">គណនេយ្យ & ហិរញ្ញវត្ថុ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  តួនាទី និងសិទ្ធិ (Role)
                </label>
                <div className="relative">
                  <Shield className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={enrollRole}
                    onChange={(e) => setEnrollRole(e.target.value as UserRole)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="member">សមាជិក (Member) - កិច្ចការផ្ទាល់ខ្លួន</option>
                    <option value="manager">អ្នកចាត់ការ (Manager) - គ្រប់គ្រងផ្នែក</option>
                    <option value="viewer">អ្នកមើល (Viewer) - មើលរបាយការណ៍</option>
                    <option value="admin">អ្នកគ្រប់គ្រង (Admin) - សិទ្ធិពេញលេញ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Enroll Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>ចុះឈ្មោះ រក្សាទុក Cloud & ចូលប្រើប្រាស់</span>
                </>
              )}
            </button>

            {/* Back to sign in */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>មានគណនីរួចហើយ? ចូលប្រើប្រាស់នៅទីនេះ (Sign In)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  if (isFullScreen) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto transition-all animate-fade-in">
      {content}
    </div>
  );
};
