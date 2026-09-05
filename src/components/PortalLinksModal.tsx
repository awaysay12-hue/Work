import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Crown,
  Briefcase,
  Users,
  Search,
  KeyRound,
  Phone,
  Mail,
  UserCheck,
  Sparkles,
  Share2,
  AlertCircle,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { UserAccount } from '../types';
import { getPortalUrl, generateUserDirectAccessLink } from '../utils/portalLinks';
import { ROLE_CONFIGS } from '../utils/userPermissions';
import { UserAvatar } from './UserAvatar';
import { soundFx } from '../utils/sound';

interface PortalLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount;
  onOpenUserManagement?: () => void;
}

export const PortalLinksModal: React.FC<PortalLinksModalProps> = ({
  isOpen,
  onClose,
  users = [],
  currentUser,
  onOpenUserManagement,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForShare, setSelectedUserForShare] = useState<UserAccount | null>(null);

  if (!isOpen) return null;

  const adminPortalUrl = getPortalUrl('admin');
  const userPortalUrl = getPortalUrl('user');

  const handleCopy = (text: string, typeKey: string) => {
    soundFx.playClick();
    navigator.clipboard.writeText(text);
    setCopiedType(typeKey);
    setTimeout(() => {
      setCopiedType(null);
    }, 2500);
  };

  const handleCopyUserInviteMessage = (user: UserAccount) => {
    soundFx.playCelebration();
    const userLink = generateUserDirectAccessLink(user);
    const identifier = user.phone || user.email;
    const pass = user.password || '123';

    const msg = `👋 សួស្តី ${user.khmerName || user.name}!
នេះជាគណនី និង Link សម្រាប់ចូលប្រើប្រាស់ Task Manager របស់អ្នក៖

🔗 Link ចូលប្រើប្រាស់ផ្ទាល់ (បើកលើទូរស័ព្ទ ឬកុំព្យូទ័រ)៖
${userLink}

📱 ឈ្មោះ/ទូរស័ព្ទ៖ ${identifier}
🔑 ពាក្យសម្ងាត់៖ ${pass}
🏢 ផ្នែក៖ ${user.department}

💡 ចំណាំ៖ អ្នកអាចបើក Link ខាងលើលើ Browser ទូរស័ព្ទ (Safari/Chrome) រួចចុច "Add to Home Screen" ដើម្បីដំឡើងជា App ប្រើប្រាស់ប្រចាំថ្ងៃបាន។`;

    navigator.clipboard.writeText(msg);
    setCopiedType(`invite-${user.id}`);
    setTimeout(() => {
      setCopiedType(null);
    }, 3000);
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.khmerName && u.khmerName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  តំណភ្ជាប់ប្រព័ន្ធ & ច្រកចូល (Portal Links)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                គ្រប់គ្រង Link ចូលប្រើដាច់ដោយឡែកសម្រាប់ Super Admin និងសមាជិកក្រុម
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Security Notice Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                <span>ប្រព័ន្ធសុវត្ថិភាព Whitelist ត្រូវបានបើកដំណើរការ (Strict Access Control)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                ទោះស្ថិតនៅលើ Device ឬ Browser ណាក៏ដោយ <strong>ទាល់តែគណនីមាននៅក្នុងតារាងខាងក្រោមដែល Super Admin បានបង្កើត</strong> ទើបអាច Login ចូលប្រើប្រាស់បាន។ គណនីក្រៅពីនេះនឹងត្រូវបានបដិសេធជាស្វ័យប្រវត្តិ។
              </p>
            </div>
          </div>

          {/* Section 1: The Two Main Dedicated Portals */}
          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
              <span>១. ច្រកចូលប្រព័ន្ធទាំង ២ (Main Portals)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card 1: Super Admin Portal */}
              <div className="p-4 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/70 to-white space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Crown className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Link សម្រាប់ Super Admin</h4>
                      <p className="text-[10px] text-slate-500">មើលឃើញ & គ្រប់គ្រង User ទាំងអស់</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Full Control
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-indigo-700 truncate select-all">
                  {adminPortalUrl}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(adminPortalUrl, 'admin')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copiedType === 'admin' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>បានចម្លងរួចរាល់!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>ចម្លង Link Super Admin</span>
                      </>
                    )}
                  </button>

                  <a
                    href={adminPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="បើកមើលក្នុងផ្ទាំងថ្មី"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Card 2: User / Member Portal */}
              <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Link សម្រាប់សមាជិក (User)</h4>
                      <p className="text-[10px] text-slate-500">សម្រាប់ផ្ញើឱ្យក្រុមការងារ Login ចូល</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Whitelist Only
                  </span>
                </div>

                <div className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-[11px] text-emerald-700 truncate select-all">
                  {userPortalUrl}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(userPortalUrl, 'user')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {copiedType === 'user' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>បានចម្លងរួចរាល់!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>ចម្លង Link សម្រាប់ User</span>
                      </>
                    )}
                  </button>

                  <a
                    href={userPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="បើកមើលក្នុងផ្ទាំងថ្មី"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Individual User Authorized Access Links */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>២. តារាង User ដែលបានអនុញ្ញាត & Link ផ្ទាល់ខ្លួន ({users.length} នាក់)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  អ្នកអាចចម្លង Link ផ្ទាល់ខ្លួន ឬសារ Invite ផ្ញើតាម Telegram / WhatsApp ឱ្យសមាជិកម្នាក់ៗបើកចូលភ្លាមៗ
                </p>
              </div>

              {onOpenUserManagement && (
                <button
                  onClick={() => {
                    soundFx.playClick();
                    onClose();
                    onOpenUserManagement();
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all cursor-pointer"
                >
                  + បន្ថែម / កែប្រែ User ក្នុងតារាង
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ស្វែងរកតាមឈ្មោះ, លេខទូរស័ព្ទ, ឬអ៊ីមែល..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Users List */}
            <div className="space-y-2.5">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  រកមិនឃើញអ្នកប្រើប្រាស់ដែលត្រូវគ្នានឹងការស្វែងរកទេ
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const roleCfg = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.member;
                  const isUserActive = user.status !== 'inactive';
                  const directLink = generateUserDirectAccessLink(user);
                  const isCopied = copiedType === `user-${user.id}`;
                  const isInviteCopied = copiedType === `invite-${user.id}`;

                  return (
                    <div
                      key={user.id}
                      className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white hover:shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {/* User Profile Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            avatarUrl={user.avatarUrl}
                            avatarColor={user.avatarColor}
                            avatarInitial={user.avatarInitial}
                            name={user.khmerName || user.name}
                            role={user.role}
                            size="md"
                            showBadge={true}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {user.khmerName || user.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.2 rounded-md border ${roleCfg.badgeBg} ${roleCfg.badgeText} ${roleCfg.badgeBorder}`}
                              >
                                {roleCfg.titleKh}
                              </span>
                              {user.role === 'admin' && (
                                <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                  <Crown className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                              {user.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {user.phone}
                                </span>
                              )}
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {user.email}
                              </span>
                              <span className="text-slate-400">• {user.department}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isUserActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              អនុញ្ញាត (Active)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              ផ្អាក (Suspended)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Login Credentials & Quick Copy Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                          <KeyRound className="w-3 h-3 text-amber-500" />
                          <span>Password: <strong>{user.password || '123'}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Copy Direct Access Link */}
                          <button
                            onClick={() => handleCopy(directLink, `user-${user.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                            title="ចម្លង Magic Link សម្រាប់ User នេះបើកចូលភ្លាមៗ"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">បានចម្លង Link!</span>
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                                <span>ចម្លង Link ចូលប្រើ</span>
                              </>
                            )}
                          </button>

                          {/* Copy Full Telegram / Chat Invite Message */}
                          <button
                            onClick={() => handleCopyUserInviteMessage(user)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="ចម្លងសារ Invite ពេញលេញ រួមទាំង Link និង Password ផ្ញើតាម Telegram / WhatsApp"
                          >
                            {isInviteCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>បានចម្លងសារ Invite!</span>
                              </>
                            ) : (
                              <>
                                <MessageSquare className="w-3.5 h-3.5 text-indigo-200" />
                                <span>💬 ចម្លងសារ Invite</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ទិន្នន័យ User ទាំងអស់ត្រូវបានរក្សាទុក និង Sync ជាមួយ Database ដោយសុវត្ថិភាព</span>
          </span>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
