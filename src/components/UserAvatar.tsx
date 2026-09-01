import React, { useState } from 'react';
import { Crown, ShieldCheck, UserCheck, Eye } from 'lucide-react';
import { UserRole } from '../types';

interface UserAvatarProps {
  avatarUrl?: string;
  avatarColor?: string;
  avatarInitial?: string;
  name?: string;
  role?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBadge?: boolean;
  className?: string;
  status?: 'active' | 'inactive';
}

const SIZE_CLASSES = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs sm:text-sm font-bold',
  lg: 'w-11 h-11 text-base font-bold',
  xl: 'w-16 h-16 text-xl font-black',
  '2xl': 'w-24 h-24 text-3xl font-black',
};

const BADGE_SIZE_CLASSES = {
  xs: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 p-0.5',
  sm: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 p-0.5',
  md: 'w-4 h-4 -bottom-1 -right-1 p-0.5',
  lg: 'w-5 h-5 -bottom-1 -right-1 p-1',
  xl: 'w-6 h-6 -bottom-1 -right-1 p-1',
  '2xl': 'w-8 h-8 -bottom-1 -right-1 p-1.5',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  avatarColor = 'from-indigo-500 to-cyan-500',
  avatarInitial,
  name,
  role,
  size = 'md',
  showBadge = false,
  className = '',
  status,
}) => {
  const [imageError, setImageError] = useState(false);

  const initial =
    avatarInitial ||
    (name ? name.trim().charAt(0) : 'U') ||
    'U';

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const badgeSizeClass = BADGE_SIZE_CLASSES[size] || BADGE_SIZE_CLASSES.md;

  const renderBadgeIcon = () => {
    if (!role) return null;
    switch (role) {
      case 'admin':
        return <Crown className="w-full h-full text-white fill-current" />;
      case 'manager':
        return <ShieldCheck className="w-full h-full text-white" />;
      case 'member':
        return <UserCheck className="w-full h-full text-white" />;
      case 'viewer':
        return <Eye className="w-full h-full text-white" />;
      default:
        return null;
    }
  };

  const getBadgeColor = () => {
    switch (role) {
      case 'admin':
        return 'bg-rose-600 ring-1 ring-white';
      case 'manager':
        return 'bg-indigo-600 ring-1 ring-white';
      case 'member':
        return 'bg-emerald-600 ring-1 ring-white';
      case 'viewer':
        return 'bg-slate-600 ring-1 ring-white';
      default:
        return 'bg-slate-500';
    }
  };

  const hasValidImage = avatarUrl && !imageError && avatarUrl.trim() !== '';

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center select-none shadow-xs transition-transform ${
          hasValidImage ? 'bg-slate-100 ring-1 ring-slate-200' : `bg-gradient-to-tr ${avatarColor} text-white`
        }`}
      >
        {hasValidImage ? (
          <img
            src={avatarUrl}
            alt={name || 'User Profile'}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className="leading-none drop-shadow-xs font-bold">{initial}</span>
        )}
      </div>

      {/* Role Badge */}
      {showBadge && role && (
        <div
          className={`absolute rounded-full flex items-center justify-center shadow-xs ${badgeSizeClass} ${getBadgeColor()}`}
          title={`Role: ${role.toUpperCase()}`}
        >
          {renderBadgeIcon()}
        </div>
      )}

      {/* Status Dot if specified */}
      {status && !showBadge && (
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
            status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
      )}
    </div>
  );
};
