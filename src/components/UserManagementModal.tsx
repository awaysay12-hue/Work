import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Crown,
  UserCheck,
  Eye,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  Activity,
  History,
  Sparkles,
  ArrowRightLeft,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Layers,
  Building,
  User as UserIcon,
  RefreshCw,
  Cloud,
} from 'lucide-react';
import {
  UserAccount,
  UserRole,
  RolePermissions,
  ActivityLog,
  TaskVisibilityScope,
} from '../types';
import {
  ROLE_CONFIGS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_DEFINITIONS,
  VISIBILITY_CONFIGS,
  AVATAR_PRESETS,
  GRADIENT_PRESETS,
  formatActionLabel,
} from '../utils/userPermissions';
import { toKhmerNumber } from '../utils/translations';
import { formatKhmerDate, formatKhmerTime } from '../utils/khmerDates';
import { UserAvatar } from './UserAvatar';
import { soundFx } from '../utils/sound';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users?: UserAccount[];
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  onAddUser?: (user: Omit<UserAccount, 'id' | 'joinedDate'>) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onSaveUser?: (user: UserAccount) => void;
  onDeleteUser: (userId: string) => void;
  rolePermissions: Record<UserRole, RolePermissions>;
  onUpdateRolePermissions: (newPermissions: Record<UserRole, RolePermissions>) => void;
  activityLogs?: ActivityLog[];
  onClearLogs?: () => void;
  tasksCountByUser?: Record<string, number>;
  onManualSync?: () => Promise<void>;
  isSyncing?: boolean;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users = [],
  currentUser,
  onSwitchUser,
  onAddUser,
  onUpdateUser,
  onSaveUser,
  onDeleteUser,
  rolePermissions,
  onUpdateRolePermissions,
  activityLogs = [],
  onClearLogs,
  tasksCountByUser = {},
  onManualSync,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'logs'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<UserRole>('admin');

  // Add/Edit User Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formKhmerName, setFormKhmerName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('member');
  const [formVisibilityScope, setFormVisibilityScope] = useState<TaskVisibilityScope>('assigned_only');
  const [formBio, setFormBio] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  // Avatar customization inside form
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formAvatarColor, setFormAvatarColor] = useState(GRADIENT_PRESETS[0]);
  const [formAvatarInitial, setFormAvatarInitial] = useState('');
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload' | 'gradients'>('presets');

  // Delete User Confirmation Modal State
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync users list from Supabase Cloud whenever modal is opened
  useEffect(() => {
    if (isOpen && onManualSync) {
      onManualSync().catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') return null;

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.khmerName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });

  const handleOpenAddForm = () => {
    setEditingUserId(null);
    setFormName('');
    setFormKhmerName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('');
    setFormDepartment('បច្ចេកវិទ្យា & IT');
    setFormRole('member');
    setFormVisibilityScope('assigned_only');
    setFormBio('');
    setFormStatus('active');
    setFormAvatarUrl('');
    setFormAvatarColor(GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)]);
    setFormAvatarInitial('');
    setCustomAvatarUrlInput('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: UserAccount) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormKhmerName(user.khmerName);
    setFormEmail(user.email);
    setFormPassword(user.password || '');
    setFormPhone(user.phone || '');
    setFormDepartment(user.department);
    setFormRole(user.role);
    setFormVisibilityScope(
      user.visibilityScope ||
        rolePermissions[user.role]?.defaultVisibilityScope ||
        (user.role === 'admin' ? 'all' : user.role === 'manager' ? 'department' : 'assigned_only')
    );
    setFormBio(user.bio || '');
    setFormStatus(user.status);
    setFormAvatarUrl(user.avatarUrl || '');
    setFormAvatarColor(user.avatarColor || GRADIENT_PRESETS[0]);
    setFormAvatarInitial(user.avatarInitial || '');
    setCustomAvatarUrlInput('');
    setIsFormOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('ទំហំរូបភាពត្រូវតែតូចជាង 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setFormAvatarUrl(event.target.result);
        soundFx.playClick();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customAvatarUrlInput.trim()) {
      setFormAvatarUrl(customAvatarUrlInput.trim());
      setCustomAvatarUrlInput('');
      soundFx.playClick();
    }
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKhmerName.trim() || !formEmail.trim()) return;

    const initial =
      formAvatarInitial.trim() ||
      formKhmerName.trim().charAt(0) ||
      formName.trim().charAt(0) ||
      'U';

    if (editingUserId) {
      const existing = users.find((u) => u.id === editingUserId);
      if (existing) {
        const updatedUser: UserAccount = {
          ...existing,
          name: formName.trim() || formKhmerName.trim(),
          khmerName: formKhmerName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim() || existing.password,
          phone: formPhone.trim() || undefined,
          department: formDepartment.trim() || 'ទូទៅ',
          role: formRole,
          visibilityScope: formVisibilityScope,
          bio: formBio.trim() || undefined,
          avatarUrl: formAvatarUrl.trim() || undefined,
          avatarColor: formAvatarColor,
          avatarInitial: initial,
          status: formStatus,
        };

        if (onSaveUser) {
          onSaveUser(updatedUser);
        } else if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
        soundFx.playCelebration();
        showNotification(`បានកែសម្រួលគណនី និងសិទ្ធិរបស់ ${formKhmerName} ជោគជ័យ`);
      }
    } else {
      const newUserObj: UserAccount = {
        id: `user-${Date.now()}`,
        name: formName.trim() || formKhmerName.trim(),
        khmerName: formKhmerName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim() || '123456',
        phone: formPhone.trim() || undefined,
        department: formDepartment.trim() || 'ទូទៅ',
        role: formRole,
        visibilityScope: formVisibilityScope,
        bio: formBio.trim() || undefined,
        avatarUrl: formAvatarUrl.trim() || undefined,
        avatarColor: formAvatarColor,
        avatarInitial: initial,
        status: formStatus,
        joinedDate: new Date().toISOString().split('T')[0],
      };

      if (onSaveUser) {
        onSaveUser(newUserObj);
      } else if (onAddUser) {
        onAddUser(newUserObj);
      }
      soundFx.playCelebration();
      showNotification(`បានបង្កើតគណនីថ្មី ${formKhmerName} (${ROLE_CONFIGS[formRole].titleKh}) ជោគជ័យ`);
    }

    setIsFormOpen(false);
  };

  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser.id) {
      alert('មិនអាចលុបគណនីដែលកំពុងដំណើរការផ្ទាល់ខ្លួនបានទេ!');
      return;
    }

    const userName = deletingUser.khmerName;
    onDeleteUser(deletingUser.id);
    setDeletingUser(null);
    if (isFormOpen && editingUserId === deletingUser.id) {
      setIsFormOpen(false);
    }
    soundFx.playClick();
    showNotification(`បានលុបគណនី ${userName} ចេញពីប្រព័ន្ធដោយជោគជ័យ`);
  };

  const handleTogglePermission = (role: UserRole, permKey: keyof RolePermissions) => {
    const updated = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        [permKey]: !rolePermissions[role][permKey],
      },
    };
    onUpdateRolePermissions(updated);
    soundFx.playClick();
  };

  const handleChangeDefaultVisibilityScope = (role: UserRole, scope: TaskVisibilityScope) => {
    const updated = {
      ...rolePermissions,
      [role]: {
        ...rolePermissions[role],
        defaultVisibilityScope: scope,
      },
    };
    onUpdateRolePermissions(updated);
    soundFx.playClick();
    showNotification(`បានកំណត់ Default Visibility របស់ ${ROLE_CONFIGS[role].titleKh} ជា៖ ${VISIBILITY_CONFIGS[scope].titleKh}`);
  };

  const handleResetRolePermissions = (role: UserRole) => {
    const updated = {
      ...rolePermissions,
      [role]: { ...DEFAULT_ROLE_PERMISSIONS[role] },
    };
    onUpdateRolePermissions(updated);
    soundFx.playClick();
    showNotification(`បានកំណត់សិទ្ធិរបស់ ${ROLE_CONFIGS[role].titleKh} ឡើងវិញដូចដើម`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold leading-tight">
                  ការគ្រប់គ្រង & កំណត់សិទ្ធិគណនី
                </h2>
                <span className="bg-rose-500/30 text-rose-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-rose-400/30">
                  Super Admin / RBAC Pro
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                គ្រប់គ្រងអ្នកប្រើប្រាស់ លុបគណនី កំណត់ការមើលឃើញ និងដាក់ Profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => {
                setActiveTab('members');
                setIsFormOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>សមាជិក & គណនី ({toKhmerNumber(users.length)})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('roles');
                setIsFormOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ម៉ាទ្រីសកំណត់សិទ្ធិ & ការមើលឃើញ</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('logs');
                setIsFormOpen(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>ប្រវត្តិសកម្មភាព ({toKhmerNumber(activityLogs.length)})</span>
            </button>
          </div>

          {/* Current Logged In Badge */}
          <div className="hidden md:flex items-center gap-2 py-1.5 px-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <UserAvatar
              avatarUrl={currentUser.avatarUrl}
              avatarColor={currentUser.avatarColor}
              avatarInitial={currentUser.avatarInitial}
              name={currentUser.khmerName}
              size="xs"
            />
            <span className="text-xs font-bold text-slate-800">{currentUser.khmerName}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200">
              {ROLE_CONFIGS[currentUser.role]?.titleKh}
            </span>
          </div>
        </div>

        {/* Global Toast Notification */}
        {notificationMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{notificationMsg}</span>
            </div>
            <button onClick={() => setNotificationMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: MEMBERS & ACCOUNTS */}
          {activeTab === 'members' && !isFormOpen && (
            <div className="space-y-4">
              {/* Summary Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                  <span className="text-[11px] text-slate-500 font-bold block">សរុបអ្នកប្រើប្រាស់</span>
                  <span className="text-xl font-bold text-slate-800">{toKhmerNumber(users.length)} នាក់</span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3">
                  <span className="text-[11px] text-rose-700 font-bold block flex items-center gap-1">
                    <Crown className="w-3 h-3 text-rose-600" /> Super Admin
                  </span>
                  <span className="text-xl font-bold text-rose-800">
                    {toKhmerNumber(users.filter((u) => u.role === 'admin').length)} នាក់
                  </span>
                </div>
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3">
                  <span className="text-[11px] text-indigo-700 font-bold block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" /> Managers
                  </span>
                  <span className="text-xl font-bold text-indigo-800">
                    {toKhmerNumber(users.filter((u) => u.role === 'manager').length)} នាក់
                  </span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
                  <span className="text-[11px] text-emerald-700 font-bold block flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-emerald-600" /> Staff & Guests
                  </span>
                  <span className="text-xl font-bold text-emerald-800">
                    {toKhmerNumber(users.filter((u) => u.role === 'member' || u.role === 'viewer').length)} នាក់
                  </span>
                </div>
              </div>

              {/* Action Bar: Search, Role Filter, Add Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬផ្នែក..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">គ្រប់ Role</option>
                    <option value="admin">Super Admin</option>
                    <option value="manager">Manager</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {onManualSync && (
                    <button
                      onClick={async () => {
                        soundFx.playClick();
                        try {
                          await onManualSync();
                          showNotification('បានធ្វើសមកាលកម្មទិន្នន័យពី Cloud Database រួចរាល់');
                        } catch {
                          showNotification('មិនអាចទាញទិន្នន័យពី Cloud បានទេ សូមពិនិត្យ Connection');
                        }
                      }}
                      disabled={isSyncing}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
                      title="ទាញយកបញ្ជីគណនីថ្មីៗបំផុតពី Cloud Database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
                      <span className="hidden sm:inline">{isSyncing ? 'កំពុង Sync...' : 'Sync Cloud'}</span>
                    </button>
                  )}

                  <button
                    onClick={handleOpenAddForm}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>បន្ថែមគណនីថ្មី</span>
                  </button>
                </div>
              </div>

              {/* User List Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                        <th className="py-2.5 px-3 sm:px-4">ឈ្មោះ និង Profile</th>
                        <th className="py-2.5 px-3">តួនាទី (Role)</th>
                        <th className="py-2.5 px-3">ផ្នែក / ដេប៉ាតឺម៉ង់</th>
                        <th className="py-2.5 px-3">វិសាលភាពមើលឃើញ</th>
                        <th className="py-2.5 px-3 text-center">កិច្ចការចាត់តាំង</th>
                        <th className="py-2.5 px-3 text-center">ស្ថានភាព</th>
                        <th className="py-2.5 px-3 sm:px-4 text-right">សកម្មភាព</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredUsers.map((user) => {
                        const roleCfg = ROLE_CONFIGS[user.role];
                        const isCurrent = user.id === currentUser.id;
                        const assignedTasks = tasksCountByUser[user.id] || 0;
                        const effectiveScope =
                          user.visibilityScope ||
                          rolePermissions[user.role]?.defaultVisibilityScope ||
                          (user.role === 'admin' ? 'all' : user.role === 'manager' ? 'department' : 'assigned_only');
                        const visibilityCfg = VISIBILITY_CONFIGS[effectiveScope] || VISIBILITY_CONFIGS.assigned_only;

                        return (
                          <tr
                            key={user.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isCurrent ? 'bg-indigo-50/40' : ''
                            }`}
                          >
                            {/* Name & Avatar */}
                            <td className="py-2.5 px-3 sm:px-4">
                              <div className="flex items-center gap-2.5">
                                <UserAvatar
                                  avatarUrl={user.avatarUrl}
                                  avatarColor={user.avatarColor}
                                  avatarInitial={user.avatarInitial}
                                  name={user.khmerName}
                                  role={user.role}
                                  size="md"
                                  showBadge={true}
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 leading-tight">
                                      {user.khmerName}
                                    </span>
                                    {isCurrent && (
                                      <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded-sm">
                                        អ្នកប្រើបច្ចុប្បន្ន
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-500 block leading-tight">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${roleCfg.dotColor}`}></span>
                                {roleCfg.titleKh}
                              </span>
                            </td>

                            {/* Department */}
                            <td className="py-2.5 px-3 text-slate-600 font-medium">
                              {user.department}
                            </td>

                            {/* Visibility Scope */}
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${visibilityCfg.badgeBg} ${visibilityCfg.badgeText} ${visibilityCfg.badgeBorder}`}
                                title={visibilityCfg.descriptionKh}
                              >
                                <Eye className="w-3 h-3" />
                                <span>{visibilityCfg.titleKh}</span>
                              </span>
                            </td>

                            {/* Assigned Tasks Count */}
                            <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                              {toKhmerNumber(assignedTasks)}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center">
                              {user.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> សកម្ម
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> ផ្អាក
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-2.5 px-3 sm:px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isCurrent ? (
                                  <button
                                    onClick={() => {
                                      onSwitchUser(user);
                                      showNotification(`បានប្តូរចូលគណនី ${user.khmerName} (${roleCfg.titleKh})`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 border border-indigo-200 transition-colors cursor-pointer"
                                    title="ប្តូរចូលប្រើប្រាស់គណនីនេះភ្លាមៗ"
                                  >
                                    <ArrowRightLeft className="w-3 h-3" />
                                    <span>ប្តូរចូល</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                                    កំពុងប្រើ
                                  </span>
                                )}

                                <button
                                  onClick={() => handleOpenEditForm(user)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="កែសម្រួលព័ត៌មាន និងសិទ្ធិ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {users.length > 1 && !isCurrent && (
                                  <button
                                    onClick={() => setDeletingUser(user)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="លុបគណនី (Super Admin Power)"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADD / EDIT USER FORM */}
          {activeTab === 'members' && isFormOpen && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {editingUserId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {editingUserId ? 'កែសម្រួលគណនី & កំណត់សិទ្ធិ (Profile & Visibility)' : 'បន្ថែមគណនីអ្នកប្រើប្រាស់ថ្មី'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      កំណត់រូប Profile ព័ត៌មានលម្អិត តួនាទី និងវិសាលភាពមើលឃើញកិច្ចការ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-white border border-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  ត្រឡប់ក្រោយ
                </button>
              </div>

              <form onSubmit={handleSaveUserForm} className="space-y-6">
                {/* SECTION 1: PROFILE PICTURE / AVATAR SELECTOR */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Live Preview */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <div className="relative group">
                        <UserAvatar
                          avatarUrl={formAvatarUrl}
                          avatarColor={formAvatarColor}
                          avatarInitial={formAvatarInitial || formKhmerName.charAt(0) || 'U'}
                          name={formKhmerName}
                          role={formRole}
                          size="xl"
                          showBadge={true}
                          className="ring-4 ring-slate-100 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-pointer"
                          title="ប្តូររូបថត"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>

                      {formAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setFormAvatarUrl('')}
                          className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>លុបរូបថត</span>
                        </button>
                      )}
                    </div>

                    {/* Avatar Switcher */}
                    <div className="flex-1 min-w-0 space-y-3 w-full">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          រូបថត Profile របស់សមាជិក
                        </label>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                          <button
                            type="button"
                            onClick={() => setAvatarTab('presets')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              avatarTab === 'presets'
                                ? 'bg-white text-indigo-700 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            រូបថតស្អាតៗ
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarTab('upload')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              avatarTab === 'upload'
                                ? 'bg-white text-indigo-700 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Upload / Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setAvatarTab('gradients')}
                            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                              avatarTab === 'gradients'
                                ? 'bg-white text-indigo-700 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Gradient
                          </button>
                        </div>
                      </div>

                      {/* Presets */}
                      {avatarTab === 'presets' && (
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {AVATAR_PRESETS.map((preset) => {
                            const isSelected = formAvatarUrl === preset.url;
                            return (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setFormAvatarUrl(preset.url);
                                  soundFx.playClick();
                                }}
                                className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer hover:scale-105 ${
                                  isSelected
                                    ? 'border-indigo-600 ring-2 ring-indigo-500/40 scale-105'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                                title={preset.name}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Upload */}
                      {avatarTab === 'upload' && (
                        <div className="space-y-2.5">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Camera className="w-4 h-4 text-indigo-600" />
                              <span>ជ្រើសរើសរូបពីឧបករណ៍ (Upload Local File)</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              placeholder="ឬបញ្ចូលតំណភ្ជាប់ URL រូបភាព..."
                              value={customAvatarUrlInput}
                              onChange={(e) => setCustomAvatarUrlInput(e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCustomUrl}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              ដាក់ប្រើ
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Gradients */}
                      {avatarTab === 'gradients' && (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {GRADIENT_PRESETS.map((grad, i) => {
                              const isSelected = !formAvatarUrl && formAvatarColor === grad;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setFormAvatarUrl('');
                                    setFormAvatarColor(grad);
                                    soundFx.playClick();
                                  }}
                                  className={`w-8 h-8 rounded-full bg-gradient-to-tr ${grad} border-2 transition-all cursor-pointer flex items-center justify-center text-white text-xs ${
                                    isSelected
                                      ? 'border-slate-900 ring-2 ring-indigo-500/40 scale-110'
                                      : 'border-white hover:scale-105'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] text-slate-600 font-bold">តួអក្សរតំណាង៖</span>
                            <input
                              type="text"
                              maxLength={2}
                              value={formAvatarInitial}
                              onChange={(e) => setFormAvatarInitial(e.target.value)}
                              placeholder={formKhmerName.charAt(0) || 'ស'}
                              className="w-12 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 focus:outline-hidden"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: BASIC INFO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ឈ្មោះជាភាសាខ្មែរ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. សុភ័ក្ត្រ ចាន់"
                      value={formKhmerName}
                      onChange={(e) => setFormKhmerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ឈ្មោះជាភាសាអង់គ្លេស
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. Sopheaktra Chan"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      អ៊ីមែលចូលប្រើ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ឧ. user@company.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ពាក្យសម្ងាត់សម្រាប់ Login (Password) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="កំណត់ពាក្យសម្ងាត់ (ឧ. 123456 ឬ pass123)..."
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      💡 គណនីថ្មីនេះអាចយក Password នេះ និង Email ខាងលើដើម្បី Login ចូលប្រព័ន្ធភ្លាមៗ
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      លេខទូរស័ព្ទ
                    </label>
                    <input
                      type="tel"
                      placeholder="ឧ. 012 345 678"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ផ្នែក / ដេប៉ាតឺម៉ង់
                    </label>
                    <input
                      type="text"
                      placeholder="ឧ. គ្រប់គ្រងគម្រោង, IT, រចនា"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    កំណត់ចំណាំ / ភារកិច្ច (Bio / Notes)
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. Senior Developer ទទួលខុសត្រូវលើ Cloud Backend..."
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-hidden focus:border-indigo-600"
                  />
                </div>

                {/* SECTION 3: VISIBILITY SCOPE (កំណត់ការមើលឃើញកិច្ចការ) */}
                <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-700" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        កំណត់វិសាលភាពនៃការមើលឃើញកិច្ចការ (Task Visibility Scope)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        ជ្រើសរើសវិសាលភាពទិន្នន័យដែលគណនីនេះត្រូវបានអនុញ្ញាតឱ្យមើលឃើញ
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(['all', 'department', 'assigned_only'] as TaskVisibilityScope[]).map((scopeKey) => {
                      const cfg = VISIBILITY_CONFIGS[scopeKey];
                      const isSelected = formVisibilityScope === scopeKey;
                      return (
                        <div
                          key={scopeKey}
                          onClick={() => {
                            setFormVisibilityScope(scopeKey);
                            soundFx.playClick();
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                              : 'bg-white/80 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{cfg.titleKh}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              {cfg.descriptionKh}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 4: ROLE SELECTOR */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    កំណត់តួនាទី (Role) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(['admin', 'manager', 'member', 'viewer'] as UserRole[]).map((r) => {
                      const cfg = ROLE_CONFIGS[r];
                      const isSelected = formRole === r;
                      return (
                        <div
                          key={r}
                          onClick={() => {
                            setFormRole(r);
                            soundFx.playClick();
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-600 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{cfg.titleKh}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({cfg.titleEn})</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {cfg.descriptionKh}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 5: STATUS & ACTIONS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-700">ស្ថានភាព៖</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="active">សកម្ម (Active)</option>
                      <option value="inactive">ផ្អាកបណ្តោះអាសន្ន (Inactive)</option>
                    </select>

                    {/* Delete Account Button inside edit form */}
                    {editingUserId && editingUserId !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = users.find((u) => u.id === editingUserId);
                          if (target) setDeletingUser(target);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>លុបគណនីនេះ</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      បោះបង់
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {editingUserId ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតគណនី'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: ROLE & PERMISSION MATRIX */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              {/* Role Selector Header */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      តារាងម៉ាទ្រីសកំណត់សិទ្ធិ & វិសាលភាព (Role Matrix)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      អ្នកអាចបើក/បិទសិទ្ធិជាក់លាក់ និងកំណត់ការមើលឃើញសម្រាប់តួនាទីនីមួយៗបានដោយសេរី
                    </p>
                  </div>

                  <button
                    onClick={() => handleResetRolePermissions(selectedRoleForMatrix)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>កំណត់ឡើងវិញដូចដើម</span>
                  </button>
                </div>

                {/* Role Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['admin', 'manager', 'member', 'viewer'] as UserRole[]).map((r) => {
                    const cfg = ROLE_CONFIGS[r];
                    const isSelected = selectedRoleForMatrix === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setSelectedRoleForMatrix(r)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-xs font-bold block leading-tight">{cfg.titleKh}</span>
                        <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                          {cfg.titleEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Visibility Scope Setting for Selected Role */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    វិសាលភាពមើលឃើញលំនាំដើម (Default Visibility for {ROLE_CONFIGS[selectedRoleForMatrix].titleKh})
                  </span>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    កំណត់កម្រិតនៃការមើលឃើញកិច្ចការសម្រាប់អ្នកប្រើប្រាស់ដែលមានតួនាទីនេះ
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-indigo-200 shrink-0">
                  {(['all', 'department', 'assigned_only'] as TaskVisibilityScope[]).map((scopeKey) => {
                    const cfg = VISIBILITY_CONFIGS[scopeKey];
                    const currentDefault =
                      rolePermissions[selectedRoleForMatrix]?.defaultVisibilityScope ||
                      (selectedRoleForMatrix === 'admin' ? 'all' : selectedRoleForMatrix === 'manager' ? 'department' : 'assigned_only');
                    const isSelected = currentDefault === scopeKey;
                    return (
                      <button
                        key={scopeKey}
                        onClick={() => handleChangeDefaultVisibilityScope(selectedRoleForMatrix, scopeKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {cfg.titleKh}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Permissions List for Selected Role */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      សិទ្ធិរបស់៖ <span className="text-indigo-600">{ROLE_CONFIGS[selectedRoleForMatrix].titleKh}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {ROLE_CONFIGS[selectedRoleForMatrix].descriptionKh}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Task Management Section */}
                  <div className="p-3 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    📌 ការគ្រប់គ្រងកិច្ចការ (Task Management)
                  </div>
                  {PERMISSION_DEFINITIONS.filter((p) => p.category === 'task').map((perm) => {
                    const isAllowed = Boolean(rolePermissions[selectedRoleForMatrix]?.[perm.key]);
                    return (
                      <div
                        key={perm.key}
                        className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">
                            {perm.labelKh}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {perm.descriptionKh}
                          </p>
                        </div>
                        <button
                          onClick={() => handleTogglePermission(selectedRoleForMatrix, perm.key)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            isAllowed ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                          }`}
                        >
                          <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                        </button>
                      </div>
                    );
                  })}

                  {/* Team & User Section */}
                  <div className="p-3 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    👥 ការគ្រប់គ្រងសមាជិក & គណនី (Team Management)
                  </div>
                  {PERMISSION_DEFINITIONS.filter((p) => p.category === 'team').map((perm) => {
                    const isAllowed = Boolean(rolePermissions[selectedRoleForMatrix]?.[perm.key]);
                    return (
                      <div
                        key={perm.key}
                        className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">
                            {perm.labelKh}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {perm.descriptionKh}
                          </p>
                        </div>
                        <button
                          onClick={() => handleTogglePermission(selectedRoleForMatrix, perm.key)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            isAllowed ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                          }`}
                        >
                          <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                        </button>
                      </div>
                    );
                  })}

                  {/* System & Data Section */}
                  <div className="p-3 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    ☁️ ប្រព័ន្ធ & ទិន្នន័យ (System & Cloud Sync)
                  </div>
                  {PERMISSION_DEFINITIONS.filter((p) => p.category === 'system').map((perm) => {
                    const isAllowed = Boolean(rolePermissions[selectedRoleForMatrix]?.[perm.key]);
                    return (
                      <div
                        key={perm.key}
                        className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 leading-tight">
                            {perm.labelKh}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {perm.descriptionKh}
                          </p>
                        </div>
                        <button
                          onClick={() => handleTogglePermission(selectedRoleForMatrix, perm.key)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                            isAllowed ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                          }`}
                        >
                          <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT & ACTIVITY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    កំណត់ត្រាសកម្មភាព និងសវនកម្ម (Audit Trail)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    តាមដានរាល់សកម្មភាពដែលអ្នកប្រើប្រាស់បានអនុវត្តក្នុងកម្មវិធី
                  </p>
                </div>

                {onClearLogs && activityLogs.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('តើអ្នកពិតជាចង់សម្អាត Logs ទាំងអស់ឬ?')) {
                        onClearLogs();
                      }
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 px-3 py-1.5 border border-slate-200 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    សម្អាត Logs
                  </button>
                )}
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {activityLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    មិនទាន់មានប្រវត្តិសកម្មភាពនៅឡើយទេ
                  </div>
                ) : (
                  activityLogs.map((log, index) => {
                    const actionInfo = formatActionLabel(log.action);
                    const roleCfg = ROLE_CONFIGS[log.userRole] || ROLE_CONFIGS.member;
                    const timeStr = formatKhmerTime(log.timestamp);
                    const dateStr = formatKhmerDate(log.timestamp.split('T')[0]);

                    return (
                      <div key={`${log.id}-${index}`} className="p-3.5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 mt-0.5">
                          {log.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">{log.userName}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}>
                              {roleCfg.titleKh}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionInfo.color}`}>
                              {actionInfo.text}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
                            {log.targetTitle}
                          </p>

                          {log.details && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {log.details}
                            </p>
                          )}
                        </div>

                        <div className="text-right text-[10px] text-slate-400 shrink-0 font-medium">
                          <div>{timeStr}</div>
                          <div>{dateStr}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Role-Based Access Control (RBAC) System Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            បិទផ្ទាំង
          </button>
        </div>
      </div>

      {/* CONFIRM DELETE USER MODAL (Super Admin Power) */}
      {deletingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  បញ្ជាក់ការលុបគណនីអ្នកប្រើប្រាស់
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  សិទ្ធិពិសេស Super Admin (Account Revocation)
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={deletingUser.avatarUrl}
                  avatarColor={deletingUser.avatarColor}
                  avatarInitial={deletingUser.avatarInitial}
                  name={deletingUser.khmerName}
                  role={deletingUser.role}
                  size="md"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">{deletingUser.khmerName}</p>
                  <p className="text-[11px] text-slate-500">{deletingUser.email}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded border border-rose-200 mt-0.5 inline-block">
                    {ROLE_CONFIGS[deletingUser.role]?.titleKh}
                  </span>
                </div>
              </div>
              <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200/60 leading-relaxed font-medium">
                ⚠️ តើអ្នកប្រាកដជាចង់លុបគណនី <strong className="font-bold">{deletingUser.khmerName}</strong> ចេញពីប្រព័ន្ធ ឬទេ? សកម្មភាពនេះមិនអាចត្រឡប់វិញបានឡើយ។
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>យល់ព្រមលុបគណនី</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
