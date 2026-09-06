import { UserAccount } from '../types';
import { INITIAL_USERS } from './userPermissions';

export type PortalMode = 'admin' | 'user' | 'default';

export interface DecodedAuthToken {
  id: string;
  email: string;
  name: string;
  khmerName: string;
  role: string;
  phone?: string;
  department?: string;
  password?: string;
  timestamp: number;
  authorizedByAdmin: boolean;
}

/**
 * Get current portal mode from URL query parameter
 * Examples:
 *   ?portal=admin -> 'admin'
 *   ?portal=user  -> 'user'
 *   ?portal=login -> 'user'
 *   ?portal=member -> 'user'
 */
export function getPortalModeFromUrl(): PortalMode {
  if (typeof window === 'undefined') return 'default';
  try {
    const params = new URLSearchParams(window.location.search);
    const portal = (params.get('portal') || params.get('mode') || '').toLowerCase();
    if (portal === 'admin' || portal === 'superadmin') return 'admin';
    if (portal === 'user' || portal === 'login' || portal === 'member') return 'user';
  } catch {
    // Ignore URL parsing error
  }
  return 'default';
}

/**
 * Extract and decode direct magic access token from URL
 */
export function getAuthTokenFromUrl(): DecodedAuthToken | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const rawToken = params.get('token') || params.get('auth_key') || params.get('auth');
    if (!rawToken) return null;

    // Decode URL-safe Base64
    const decodedStr = decodeURIComponent(atob(rawToken));
    const parsed = JSON.parse(decodedStr);

    if (parsed && (parsed.id || parsed.email)) {
      return {
        id: parsed.id || `user-token-${Date.now()}`,
        email: parsed.email || '',
        name: parsed.name || parsed.khmerName || 'Member',
        khmerName: parsed.khmerName || parsed.name || 'សមាជិក',
        role: parsed.role || 'member',
        phone: parsed.phone || '',
        department: parsed.department || 'ទូទៅ',
        password: parsed.password || '123',
        timestamp: parsed.timestamp || Date.now(),
        authorizedByAdmin: true,
      };
    }
  } catch (err) {
    console.warn('Failed to parse auth token from URL:', err);
  }
  return null;
}

/**
 * Remove token from URL without refreshing the page
 */
export function cleanUrlTokens(): void {
  if (typeof window === 'undefined' || !window.history || !window.history.replaceState) return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('auth_key');
    url.searchParams.delete('auth');
    window.history.replaceState({}, document.title, url.toString());
  } catch {
    // Ignore
  }
}

/**
 * Update the URL query parameter ?portal=... without reloading the page
 */
export function setPortalModeInUrl(mode: PortalMode): void {
  if (typeof window === 'undefined' || !window.history || !window.history.replaceState) return;
  try {
    const url = new URL(window.location.href);
    if (mode === 'admin') {
      url.searchParams.set('portal', 'admin');
    } else if (mode === 'user') {
      url.searchParams.set('portal', 'user');
    } else {
      url.searchParams.delete('portal');
    }
    window.history.replaceState({}, document.title, url.toString());
  } catch {
    // Ignore
  }
}

/**
 * Generate portal URL for Super Admin or User
 */
export function getPortalUrl(type: 'admin' | 'user'): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?portal=${type}`;
}

/**
 * Generate direct, authorized one-click magic link for a specific user
 * This link allows the user to open on ANY device and be authenticated instantly!
 */
export function generateUserDirectAccessLink(user: UserAccount): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    khmerName: user.khmerName,
    role: user.role,
    phone: user.phone || '',
    department: user.department,
    password: user.password || '123',
    timestamp: Date.now(),
    authorizedByAdmin: true,
  };

  try {
    const encoded = btoa(encodeURIComponent(JSON.stringify(payload)));
    return `${origin}${pathname}?portal=user&token=${encoded}`;
  } catch {
    return `${origin}${pathname}?portal=user`;
  }
}

/**
 * Strict check if an account is authorized by Super Admin
 * Rule: User MUST exist in the Super Admin's authorized registry and must NOT be inactive!
 */
export function checkUserAuthorization(
  identifier: string,
  authorizedUsers: UserAccount[] = []
): { isAuthorized: boolean; user?: UserAccount; reason?: string } {
  const cleanId = (identifier || '').trim().toLowerCase();
  if (!cleanId) {
    return { isAuthorized: false, reason: 'សូមបញ្ចូលអ៊ីមែល ឬលេខទូរស័ព្ទ' };
  }

  // 1. Gather all authorized users
  const pool: UserAccount[] = [];
  const seenIds = new Set<string>();

  (Array.isArray(authorizedUsers) ? authorizedUsers : []).forEach((u) => {
    if (u && u.id && !seenIds.has(u.id)) {
      seenIds.add(u.id);
      pool.push(u);
    }
  });

  // Check localStorage as well
  try {
    const rawLocal = localStorage.getItem('kh_daily_users_data_v1') || localStorage.getItem('taskmate_users');
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) {
        parsed.forEach((u) => {
          if (u && u.id && !seenIds.has(u.id)) {
            seenIds.add(u.id);
            pool.push(u);
          }
        });
      }
    }
  } catch {
    // Ignore
  }

  // Base authorized accounts
  INITIAL_USERS.forEach((u) => {
    if (u && u.id && !seenIds.has(u.id)) {
      seenIds.add(u.id);
      pool.push(u);
    }
  });

  // Exact Match by email
  let found = pool.find((u) => u && u.email && u.email.trim().toLowerCase() === cleanId);

  // Match by username (part before @)
  if (!found) {
    found = pool.find((u) => u && u.email && u.email.split('@')[0].trim().toLowerCase() === cleanId);
  }

  // Match by Phone
  if (!found) {
    const rawDigits = cleanId.replace(/\D/g, '');
    if (rawDigits.length >= 4) {
      found = pool.find((u) => {
        if (!u || !u.phone) return false;
        const uDigits = u.phone.replace(/\D/g, '');
        return uDigits && (uDigits === rawDigits || uDigits.endsWith(rawDigits));
      });
    }
  }

  // Match by exact name
  if (!found) {
    found = pool.find(
      (u) =>
        u &&
        ((u.name && u.name.trim().toLowerCase() === cleanId) ||
          (u.khmerName && u.khmerName.trim().toLowerCase() === cleanId))
    );
  }

  // Match by ID
  if (!found) {
    found = pool.find((u) => u && u.id && u.id.trim().toLowerCase() === cleanId);
  }

  // Not in authorized pool!
  if (!found) {
    return {
      isAuthorized: false,
      reason: 'គណនីនេះមិនទាន់ត្រូវបាន Super Admin បង្កើត ឬអនុញ្ញាតក្នុងប្រព័ន្ធទេ។ សូមទាក់ទង Super Admin ដើម្បីទទួលបានគណនី និង Link ចូលប្រើប្រាស់។',
    };
  }

  // Super Admin is always authorized
  if (found.role === 'admin') {
    return { isAuthorized: true, user: found };
  }

  // Account suspended
  if (found.status === 'inactive') {
    return {
      isAuthorized: false,
      user: found,
      reason: 'គណនីនេះត្រូវបាន Super Admin ផ្អាកដំណើរការជាបណ្តោះអាសន្ន (Suspended)!',
    };
  }

  return { isAuthorized: true, user: found };
}
