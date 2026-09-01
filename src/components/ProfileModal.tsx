import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Camera,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Save,
  Trash2,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  ROLE_CONFIGS,
  AVATAR_PRESETS,
  GRADIENT_PRESETS,
  VISIBILITY_CONFIGS,
} from '../utils/userPermissions';
import { soundFx } from '../utils/sound';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount;
  user?: UserAccount;
  onSaveProfile: (updatedUser: UserAccount) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  user,
  onSaveProfile,
}) => {
  const activeUser = currentUser || user;

  const [khmerName, setKhmerName] = useState(activeUser?.khmerName || '');
  const [name, setName] = useState(activeUser?.name || '');
  const [email, setEmail] = useState(activeUser?.email || '');
  const [phone, setPhone] = useState(activeUser?.phone || '');
  const [department, setDepartment] = useState(activeUser?.department || '');
  const [bio, setBio] = useState(activeUser?.bio || '');
  const [password, setPassword] = useState(activeUser?.password || '');
  const [avatarUrl, setAvatarUrl] = useState(activeUser?.avatarUrl || '');
  const [avatarColor, setAvatarColor] = useState(activeUser?.avatarColor || GRADIENT_PRESETS[0]);
  const [avatarInitial, setAvatarInitial] = useState(activeUser?.avatarInitial || '');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [avatarTab, setAvatarTab] = useState<'presets' | 'upload' | 'gradients'>('presets');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever activeUser or isOpen changes
  React.useEffect(() => {
    if (activeUser && isOpen) {
      setKhmerName(activeUser.khmerName || '');
      setName(activeUser.name || '');
      setEmail(activeUser.email || '');
      setPhone(activeUser.phone || '');
      setDepartment(activeUser.department || '');
      setBio(activeUser.bio || '');
      setPassword(activeUser.password || '');
      setAvatarUrl(activeUser.avatarUrl || '');
      setAvatarColor(activeUser.avatarColor || GRADIENT_PRESETS[0]);
      setAvatarInitial(activeUser.avatarInitial || '');
      setCustomImageUrl('');
      setSuccessMsg(null);
    }
  }, [activeUser, isOpen]);

  if (!isOpen || !activeUser) return null;

  const roleCfg = ROLE_CONFIGS[activeUser.role] || ROLE_CONFIGS.member;
  const visibilityCfg = activeUser.visibilityScope
    ? VISIBILITY_CONFIGS[activeUser.visibilityScope]
    : VISIBILITY_CONFIGS.assigned_only;

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
        setAvatarUrl(event.target.result);
        soundFx.playClick();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customImageUrl.trim()) {
      setAvatarUrl(customImageUrl.trim());
      setCustomImageUrl('');
      soundFx.playClick();
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    soundFx.playClick();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!khmerName.trim() || !email.trim()) return;

    const initial =
      avatarInitial.trim() ||
      khmerName.trim().charAt(0) ||
      name.trim().charAt(0) ||
      'U';

    const updatedUser: UserAccount = {
      ...activeUser,
      khmerName: khmerName.trim(),
      name: name.trim() || khmerName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      department: department.trim() || 'ទូទៅ',
      bio: bio.trim() || undefined,
      password: password.trim() || activeUser.password,
      avatarUrl: avatarUrl.trim() || undefined,
      avatarColor,
      avatarInitial: initial,
    };

    onSaveProfile(updatedUser);
    soundFx.playCelebration();
    setSuccessMsg('បានរក្សាទុកព័ត៌មាន Profile ដោយជោគជ័យ!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="profile-modal-container"
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <User className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight flex items-center gap-2">
                <span>កែសម្រួល Profile ផ្ទាល់ខ្លួន</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {roleCfg.titleKh}
                </span>
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                ផ្លាស់ប្តូររូបថត Profile ព័ត៌មានទំនាក់ទំនង និងការកំណត់គណនី
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

        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* SECTION 1: PROFILE PICTURE / AVATAR SELECTOR */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Avatar Live Preview */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative group">
                  <UserAvatar
                    avatarUrl={avatarUrl}
                    avatarColor={avatarColor}
                    avatarInitial={avatarInitial || khmerName.charAt(0) || 'U'}
                    name={khmerName}
                    role={currentUser.role}
                    size="xl"
                    showBadge={true}
                    className="ring-4 ring-white shadow-md"
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

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>លុបរូបថត</span>
                  </button>
                )}
              </div>

              {/* Avatar Switcher Tabs */}
              <div className="flex-1 min-w-0 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    ជ្រើសរើសរូបថត ឬម៉ូដ Avatar Profile
                  </label>
                  <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-bold">
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
                      ផ្ទុកឡើង (Upload)
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
                      ពណ៌ Gradient
                    </button>
                  </div>
                </div>

                {/* Tab: Presets */}
                {avatarTab === 'presets' && (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {AVATAR_PRESETS.map((preset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
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

                {/* Tab: Upload File & URL */}
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
                        className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Camera className="w-4 h-4 text-indigo-600" />
                        <span>ជ្រើសរើសរូបពីកុំព្យូទ័រ (Browse Image)</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        placeholder="ឬបិទភ្ជាប់តំណ Link រូបភាព (Image URL)..."
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600"
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

                {/* Tab: Gradients */}
                {avatarTab === 'gradients' && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {GRADIENT_PRESETS.map((grad, i) => {
                        const isSelected = !avatarUrl && avatarColor === grad;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setAvatarUrl('');
                              setAvatarColor(grad);
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
                        value={avatarInitial}
                        onChange={(e) => setAvatarInitial(e.target.value)}
                        placeholder={khmerName.charAt(0) || 'U'}
                        className="w-12 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center text-slate-800 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: BASIC INFO & CONTACT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ឈ្មោះជាភាសាខ្មែរ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={khmerName}
                onChange={(e) => setKhmerName(e.target.value)}
                placeholder="ឧ. សុភ័ក្ត្រ ចាន់"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ឈ្មោះជាភាសាអង់គ្លេស
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ឧ. Sopheaktra Chan"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                អ៊ីមែល <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ឧ. name@company.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                លេខទូរស័ព្ទ
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ឧ. 012 888 999"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ផ្នែក / ដេប៉ាតឺម៉ង់
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="ឧ. បច្ចេកវិទ្យា & IT"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ពាក្យសម្ងាត់ថ្មី (Password)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              ជីវប្រវត្តិសង្ខេប / កំណត់ចំណាំ (Bio / About)
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="សរសេរការពិពណ៌នាសង្ខេបអំពីតួនាទី ឬភារកិច្ចរបស់អ្នក..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:border-indigo-600 resize-none"
            />
          </div>

          {/* Role & Visibility Scope Info Card */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold">តួនាទីបច្ចុប្បន្ន៖</span>
                <span className={`px-2 py-0.2 rounded font-bold text-[10px] border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}>
                  {roleCfg.titleKh}
                </span>
                <span className="text-indigo-400">•</span>
                <span className="font-bold">វិសាលភាពមើលឃើញ៖</span>
                <span className="font-semibold text-indigo-800">{visibilityCfg.titleKh}</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                {visibilityCfg.descriptionKh} (សិទ្ធិនេះត្រូវបានគ្រប់គ្រងដោយ Super Admin ក្នុងម៉ាទ្រីស RBAC)
              </p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>រក្សាទុក Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
