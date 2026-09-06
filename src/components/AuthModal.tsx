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
  Zap,
  ArrowRight,
  Trash2,
  Crown,
  Briefcase,
  Info,
} from 'lucide-react';
import { UserAccount, UserRole, TaskVisibilityScope, SystemConfig } from '../types';
import { verifyUserLogin, ROLE_CONFIGS, LEGACY_MOCK_USER_IDS } from '../utils/userPermissions';
import { fetchUsersFromSupabase, saveUserToSupabase, verifyUserWithSupabaseDatabase, supabase } from '../lib/supabase';
import { soundFx } from '../utils/sound';
import { initUserPartition } from '../utils/storageOptimizer';
import {
  PortalMode,
  getPortalModeFromUrl,
  getAuthTokenFromUrl,
  cleanUrlTokens,
  checkUserAuthorization,
} from '../utils/portalLinks';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterUser?: (newUser: UserAccount) => void;
  users?: UserAccount[];
  currentUser?: UserAccount;
  forceLoginScreen?: boolean;
  isFullScreen?: boolean;
  systemConfig?: SystemConfig;
  portalMode?: PortalMode;
  onSwitchPortalMode?: (mode: PortalMode) => void;
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
  systemConfig,
  portalMode,
  onSwitchPortalMode,
}) => {
  const [internalPortalMode, setInternalPortalMode] = useState<PortalMode>(() => {
    return portalMode || getPortalModeFromUrl();
  });

  const [activeTab, setActiveTab] = useState<'login' | 'enroll'>('login');
  const [currentUsersList, setCurrentUsersList] = useState<UserAccount[]>(() => {
    return Array.isArray(users) ? users : [];
  });

  useEffect(() => {
    if (portalMode) {
      setInternalPortalMode(portalMode);
    }
  }, [portalMode]);

  // Device-Private Saved Account (For 1-click Auto-login of this device's own user only)
  const [savedDeviceAccount, setSavedDeviceAccount] = useState<UserAccount | null>(() => {
    try {
      const raw = localStorage.getItem('kh_daily_saved_device_account_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return null;
  });

  const [showManualLoginForm, setShowManualLoginForm] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('kh_daily_saved_device_account_v1');
      return !raw;
    } catch {
      return true;
    }
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
          const cleanedRemote = remoteUsers.filter(u => u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id));
          setCurrentUsersList((prev) => {
            const map = new Map<string, UserAccount>();
            prev.filter(u => u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id)).forEach((u) => map.set(u.id, u));
            cleanedRemote.forEach((u) => map.set(u.id, u));
            const merged = Array.from(map.values());

            try {
              localStorage.setItem('taskmate_users', JSON.stringify(merged));
              localStorage.setItem('kh_daily_users_data_v1', JSON.stringify(merged));
            } catch {
              // Ignore storage limits
            }
            return merged;
          });
          setCloudSyncedCount(cleanedRemote.length);
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

  // Cross-device Instant Magic Access Link Processing
  useEffect(() => {
    if (!isOpen) return;
    const token = getAuthTokenFromUrl();
    if (token) {
      setIsLoading(true);
      const authorizedUser: UserAccount = {
        id: token.id,
        name: token.name,
        khmerName: token.khmerName,
        email: token.email,
        phone: token.phone,
        password: token.password || '123',
        role: (token.role as UserRole) || 'member',
        department: token.department || 'ទូទៅ',
        avatarColor: 'from-indigo-600 to-cyan-500',
        avatarInitial: (token.khmerName || token.name || 'U').charAt(0),
        status: 'active',
        joinedDate: new Date().toISOString().split('T')[0],
      };

      setCurrentUsersList((prev) => {
        const map = new Map<string, UserAccount>();
        prev.forEach((u) => { if (u && u.id) map.set(u.id, u); });
        map.set(authorizedUser.id, authorizedUser);
        const merged = Array.from(map.values());
        try {
          localStorage.setItem('taskmate_users', JSON.stringify(merged));
          localStorage.setItem('kh_daily_users_data_v1', JSON.stringify(merged));
          localStorage.setItem('kh_daily_saved_device_account_v1', JSON.stringify(authorizedUser));
          localStorage.setItem('taskmate_current_user_id', authorizedUser.id);
          localStorage.setItem('kh_daily_current_user_id_v1', authorizedUser.id);
          localStorage.setItem('taskmate_auth_authenticated', 'true');
          localStorage.setItem('kh_daily_auth_authenticated_v1', 'true');
        } catch {
          // Ignore
        }
        return merged;
      });

      try {
        initUserPartition(authorizedUser);
      } catch {
        // Ignore
      }

      cleanUrlTokens();
      soundFx.playCelebration();
      setSuccessMessage(`🎉 ស្វាគមន៍ ${authorizedUser.khmerName}! បានផ្ទៀងផ្ទាត់សិទ្ធិដោយជោគជ័យតាមរយៈ Link អនុញ្ញាតពី Super Admin`);

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(authorizedUser);
      }, 500);
    }
  }, [isOpen, onLoginSuccess]);

  if (!isOpen) return null;

  // Manual Trigger for Point 3: Sync Cloud Database
  const handleManualSyncCloud = async () => {
    soundFx.playClick();
    setIsSyncingCloud(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { users: remoteUsers, error } = await fetchUsersFromSupabase();
      if (error || !remoteUsers) {
        setErrorMessage('⚠️ មិនទាន់អាចទាញទិន្នន័យពី Cloud (សូមពិនិត្យមើល Anon Key ក្នុង Cloud Manager)');
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
      setErrorMessage('⚠️ មិនទាន់អាចទាញទិន្នន័យពី Cloud (សូមពិនិត្យមើល Anon Key ក្នុង Cloud Manager)');
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
      // 1. Strict Real Supabase Database Verification
      const dbResult = await verifyUserWithSupabaseDatabase(emailOrName, password);

      if (dbResult.success && dbResult.user) {
        const verifiedUser = dbResult.user;

        // Whitelist Enforcement for Member / User Portal
        if (internalPortalMode === 'user') {
          const authCheck = checkUserAuthorization(emailOrName, [verifiedUser]);
          if (!authCheck.isAuthorized) {
            setIsLoading(false);
            soundFx.playAlert();
            setErrorMessage(
              authCheck.reason ||
                '❌ គណនីនេះមិនទាន់ត្រូវបាន Super Admin អនុញ្ញាតក្នុងប្រព័ន្ធទេ។ សូមទាក់ទង Super Admin!'
            );
            return;
          }
        }

        // If in admin portal, ensure user has admin role
        if (internalPortalMode === 'admin' && verifiedUser.role !== 'admin') {
          setIsLoading(false);
          soundFx.playAlert();
          setErrorMessage(
            '⚠️ គណនីនេះមិនមែនជា Super Admin ទេ។ សូមប្រើប្រាស់ច្រកចូលសម្រាប់សមាជិក (Member Portal)។'
          );
          return;
        }

        // Super Admin maintenance check: if system is under maintenance, block non-admin users
        if (systemConfig?.isMaintenance && verifiedUser.role !== 'admin') {
          setIsLoading(false);
          soundFx.playAlert();
          setErrorMessage(
            'ប្រព័ន្ធកំពុងស្ថិតក្នុងការកែប្រែដោយ Super Admin (Maintenance Mode)! មានតែគណនី Super Admin ប៉ុណ្ណោះដែលអាចចូលបានខណៈពេលនេះ។'
          );
          return;
        }

        setIsLoading(false);
        soundFx.playCelebration();
        setSuccessMessage(`ស្វាគមន៍! សួស្តី ${verifiedUser.khmerName || verifiedUser.name} (ផ្ទៀងផ្ទាត់ជោគជ័យ ✅)`);

        // Persist session if rememberMe is enabled
        if (rememberMe) {
          try {
            localStorage.setItem('kh_daily_saved_device_account_v1', JSON.stringify(verifiedUser));
            localStorage.setItem('taskmate_current_user_id', verifiedUser.id);
            localStorage.setItem('kh_daily_current_user_id_v1', verifiedUser.id);
            localStorage.setItem('taskmate_auth_authenticated', 'true');
            localStorage.setItem('kh_daily_auth_authenticated_v1', 'true');
            setSavedDeviceAccount(verifiedUser);
          } catch {
            // Ignore
          }
        }

        setTimeout(() => {
          onLoginSuccess(verifiedUser);
        }, 300);
        return;
      } else {
        // Fallback local candidate check
        const candidatePool = currentUsersList.filter(u => u && u.id && !LEGACY_MOCK_USER_IDS.has(u.id));
        const result = verifyUserLogin(emailOrName, password, candidatePool);

        setIsLoading(false);

        if (result.success && result.user) {
          if (internalPortalMode === 'admin' && result.user.role !== 'admin') {
            soundFx.playAlert();
            setErrorMessage(
              '⚠️ គណនីនេះមិនមែនជា Super Admin ទេ។ សូមប្រើប្រាស់ច្រកចូលសម្រាប់សមាជិក (Member Portal)។'
            );
            return;
          }

          if (systemConfig?.isMaintenance && result.user.role !== 'admin') {
            soundFx.playAlert();
            setErrorMessage(
              'ប្រព័ន្ធកំពុងស្ថិតក្នុងការកែប្រែដោយ Super Admin (Maintenance Mode)! មានតែគណនី Super Admin ប៉ុណ្ណោះដែលអាចចូលបានខណៈពេលនេះ។'
            );
            return;
          }

          soundFx.playCelebration();
          setSuccessMessage(`ស្វាគមន៍! សួស្តី ${result.user.khmerName || result.user.name} (ផ្ទៀងផ្ទាត់ជោគជ័យ ✅)`);

          if (rememberMe) {
            try {
              localStorage.setItem('kh_daily_saved_device_account_v1', JSON.stringify(result.user));
              localStorage.setItem('taskmate_current_user_id', result.user.id);
              localStorage.setItem('kh_daily_current_user_id_v1', result.user.id);
              localStorage.setItem('taskmate_auth_authenticated', 'true');
              localStorage.setItem('kh_daily_auth_authenticated_v1', 'true');
              setSavedDeviceAccount(result.user);
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
            dbResult.message || result.message ||
              'ការចូលប្រើប្រាស់មិនជោគជ័យ! សូមពិនិត្យអ៊ីមែល ឬពាក្យសម្ងាត់'
          );
        }
      }
    } catch {
      setIsLoading(false);
      soundFx.playAlert();
      setErrorMessage('មានបញ្ហាបច្ចេកទេសក្នុងការផ្ទៀងផ្ទាត់គណនី សូមសាកល្បងម្តងទៀត');
    }
  };

  // 1-Click Auto-Login for this device's own saved user account
  const handleAutoLoginDeviceAccount = async () => {
    if (!savedDeviceAccount) return;

    if (systemConfig?.isMaintenance && savedDeviceAccount.role !== 'admin') {
      soundFx.playAlert();
      setErrorMessage(
        'ប្រព័ន្ធកំពុងស្ថិតក្នុងការកែប្រែដោយ Super Admin! សូមរង់ចាំការបញ្ចេញ Version ថ្មី។'
      );
      return;
    }

    setIsLoading(true);

    // Verify against Supabase to make sure user wasn't deleted or disabled in DB
    if (supabase) {
      try {
        const dbResult = await verifyUserWithSupabaseDatabase(
          savedDeviceAccount.email || savedDeviceAccount.name,
          savedDeviceAccount.password
        );
        if (!dbResult.success || !dbResult.user) {
          setIsLoading(false);
          soundFx.playAlert();
          setErrorMessage(
            '❌ គណនីដែលបាន Save លើឧបករណ៍នេះ មិនមានក្នុង Database (Supabase) ឬត្រូវបានផ្លាស់ប្តូរពាក្យសម្ងាត់ទេ។ សូម Login ឡើងវិញ!'
          );
          handleForgetDeviceAccount();
          return;
        }
      } catch {
        // Continue if offline
      }
    }

    soundFx.playCelebration();
    setSuccessMessage(`ស្វាគមន៍ការត្រឡប់មកវិញ! សួស្តី ${savedDeviceAccount.khmerName || savedDeviceAccount.name}`);

    setTimeout(() => {
      try {
        localStorage.setItem('taskmate_current_user_id', savedDeviceAccount.id);
        localStorage.setItem('kh_daily_current_user_id_v1', savedDeviceAccount.id);
        localStorage.setItem('taskmate_auth_authenticated', 'true');
        localStorage.setItem('kh_daily_auth_authenticated_v1', 'true');
      } catch {
        // Ignore
      }

      setIsLoading(false);
      onLoginSuccess(savedDeviceAccount);
    }, 300);
  };

  // Forget device-saved account to allow entering different credentials cleanly
  const handleForgetDeviceAccount = () => {
    soundFx.playClick();
    try {
      localStorage.removeItem('kh_daily_saved_device_account_v1');
    } catch {
      // Ignore
    }
    setSavedDeviceAccount(null);
    setShowManualLoginForm(true);
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

      // 3. Point 3: Save directly to Supabase Cloud Database
      saveUserToSupabase(newUser).catch((err) => {
        console.warn('Failed to sync new user to Supabase Cloud:', err);
      });

      // 4. Initialize Isolated Storage Partition for new user (Prevent cross-user leaks and lag)
      try {
        initUserPartition(newUser);
      } catch (err) {
        console.warn('Storage partition init warning:', err);
      }

      // 5. Update Local Storage and component state
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
      <div
        className={`relative px-6 pt-6 pb-5 text-white border-b ${
          internalPortalMode === 'admin'
            ? 'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border-indigo-900/50'
            : 'bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border-emerald-900/50'
        }`}
      >
        {/* Ambient Glows */}
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            internalPortalMode === 'admin' ? 'bg-indigo-500/20' : 'bg-emerald-500/20'
          }`}
        />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl text-white font-black text-lg flex items-center justify-center shadow-lg ring-2 ring-white/20 shrink-0 ${
                internalPortalMode === 'admin'
                  ? 'bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-500 shadow-indigo-600/30'
                  : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 shadow-emerald-600/30'
              }`}
            >
              {internalPortalMode === 'admin' ? (
                <Crown className="w-6 h-6 text-amber-300" />
              ) : (
                <Briefcase className="w-6 h-6 text-emerald-200" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>
                  {internalPortalMode === 'admin'
                    ? 'ច្រកចូលសម្រាប់ Super Admin'
                    : 'ច្រកចូលសម្រាប់សមាជិក'}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                    internalPortalMode === 'admin'
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                      : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                  }`}
                >
                  {internalPortalMode === 'admin' ? 'Admin Portal' : 'Member Whitelist'}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {internalPortalMode === 'admin'
                  ? 'គ្រប់គ្រងប្រព័ន្ធ កិច្ចការ និងគណនីបុគ្គលិកទាំងអស់'
                  : 'ចូលប្រើប្រាស់កិច្ចការប្រចាំថ្ងៃរបស់អ្នក (គណនីមានការអនុញ្ញាត)'}
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

        {/* Tab Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-white/10 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'login'
                ? internalPortalMode === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
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
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {internalPortalMode === 'admin' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>បង្កើតគណនី (Enroll)</span>
              </>
            ) : (
              <>
                <Info className="w-4 h-4 text-emerald-400" />
                <span>របៀបទទួលគណនី</span>
              </>
            )}
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

        {/* 1. SIGN IN FORM (Point 1 & Strict Privacy Isolation) */}
        {activeTab === 'login' && (
          <div className="space-y-4">
            {/* Device-Private Auto-Login Card (Shown only if THIS device has a saved user account) */}
            {savedDeviceAccount && !showManualLoginForm ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-indigo-50/60 border border-indigo-200 shadow-sm space-y-3.5 animate-scale-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>គណនីរបស់អ្នកនៅលើឧបករណ៍នេះ (Your Device)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                    Auto-Login Ready
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-indigo-100/80 shadow-xs">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${
                      savedDeviceAccount.avatarColor || 'from-indigo-600 to-cyan-500'
                    } text-white font-black text-base flex items-center justify-center shadow-xs shrink-0`}
                  >
                    {savedDeviceAccount.avatarInitial || savedDeviceAccount.khmerName?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {savedDeviceAccount.khmerName || savedDeviceAccount.name}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {savedDeviceAccount.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                      {savedDeviceAccount.email}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      ផ្នែក៖ <span className="text-slate-600 font-semibold">{savedDeviceAccount.department}</span>
                    </p>
                  </div>
                </div>

                {/* 1-Click Auto Login Button */}
                <button
                  type="button"
                  onClick={handleAutoLoginDeviceAccount}
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>⚡ ចូលប្រើប្រាស់ស្វ័យប្រវត្ត (Auto-Login គណនីខ្ញុំ)</span>
                    </>
                  )}
                </button>

                {/* Switch to manual or remove account */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowManualLoginForm(true)}
                    className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>ចូលដោយប្រើគណនីផ្សេង</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={handleForgetDeviceAccount}
                    className="text-slate-400 hover:text-rose-600 text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="លុបគណនីដែលបានចងចាំលើ Browser នេះ"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ដកគណនីចេញ</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Manual Input Form (Privacy Isolated - No other users' data shown) */
              <form onSubmit={handleSignIn} className="space-y-3.5">
                {savedDeviceAccount && (
                  <div className="flex items-center justify-between pb-1">
                    <button
                      type="button"
                      onClick={() => setShowManualLoginForm(false)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>← ត្រឡប់ទៅ Auto-Login គណនី {savedDeviceAccount.khmerName}</span>
                    </button>
                  </div>
                )}

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
                      placeholder="បញ្ចូលអ៊ីមែល ឬ ឈ្មោះគណនីផ្ទាល់ខ្លួន..."
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
                    <span>ចងចាំការចូលប្រើប្រាស់នេះលើឧបករណ៍នេះ (Auto-Login Ready)</span>
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

                {/* Privacy Guarantee Badge */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2 mt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-700 font-semibold">ការការពារឯកជនភាព៖</strong> គណនី និងព័ត៌មានរបស់អ្នកត្រូវបានការពារដាច់ដោយឡែក។ User ផ្សេងទៀតមិនអាចមើលឃើញគណនីរបស់អ្នកឡើយ។
                  </span>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 2. ENROLL / REGISTER NEW USER FORM (Point 4) */}
        {activeTab === 'enroll' && (
          internalPortalMode === 'user' ? (
            <div className="space-y-4 py-2 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>គណនីត្រូវតែបង្កើត និងអនុញ្ញាតដោយ Super Admin</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ដើម្បីធានាសុវត្ថិភាពទិន្នន័យ និងឯកជនភាពការងារ គណនីសមាជិកទាំងអស់មិនអាចចុះឈ្មោះដោយសេរីបានឡើយ។ មានតែបុគ្គលិកដែលមានក្នុងតារាងដែល Super Admin បានបង្កើតប៉ុណ្ណោះ ទើបអាចចូលប្រើប្រាស់បាន។
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 text-slate-700">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>របៀបស្នើសុំគណនី និង Link ចូលប្រើប្រាស់៖</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                  <li>ទាក់ទងមកកាន់ Super Admin (Telegram ឬ ទូរស័ព្ទ)</li>
                  <li>ផ្តល់ឈ្មោះពេញ លេខទូរស័ព្ទ និងផ្នែកការងាររបស់អ្នក</li>
                  <li>Super Admin នឹងបង្កើតគណនី និងផ្ញើ Link ឬ Passcode ចូលប្រើប្រាស់ផ្ទាល់ខ្លួនជូនអ្នក</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                ត្រឡប់ទៅផ្ទាំង Login (Sign In)
              </button>
            </div>
          ) : (
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

            {/* Isolated Storage Partition notice */}
            <div className="p-3 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-[11px] text-emerald-900 leading-tight">
                  បែងចែកកន្លែងផ្ទុកទិន្នន័យដាច់ដោយឡែក (Isolated Storage)
                </p>
                <p className="text-[10px] text-emerald-700/90 leading-tight mt-0.5">
                  ទិន្នន័យត្រូវបានបង្រួមតូច មិនប៉ះពាល់អ្នកដទៃ និងមិនធ្វើឱ្យ Web យឺតឡើយ។
                </p>
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
          )
        )}
      </div>

      {/* Dedicated Portal Switcher Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-center text-xs">
        {internalPortalMode === 'user' ? (
          <button
            type="button"
            onClick={() => {
              setInternalPortalMode('admin');
              onSwitchPortalMode?.('admin');
              try {
                const url = new URL(window.location.href);
                url.searchParams.set('portal', 'admin');
                window.history.replaceState({}, '', url.toString());
              } catch {}
            }}
            className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>តើអ្នកជា Super Admin? ចូលតាមច្រក Super Admin →</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setInternalPortalMode('user');
              onSwitchPortalMode?.('user');
              try {
                const url = new URL(window.location.href);
                url.searchParams.set('portal', 'user');
                window.history.replaceState({}, '', url.toString());
              } catch {}
            }}
            className="w-full text-center text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors py-1 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            <span>តើអ្នកជាសមាជិកក្រុម? ចូលតាមច្រកសមាជិក (Member Portal) →</span>
          </button>
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
