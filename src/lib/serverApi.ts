import { Task, UserAccount, ActivityLog, DailyStreak, ITExpense, ITExpenseMonthlySummary } from '../types';

/**
 * Server API Client
 * Connects the web client on any device to the central TaskMate server backend.
 * Ensures tasks and user accounts created on Device A are instantly available on Device B.
 */

class ServerApiClient {
  private lastVersion: number = 0;

  private getUserHeaders(user?: UserAccount | null): Record<string, string> {
    if (!user) return {};
    return {
      'x-user-id': user.id || '',
      'x-user-role': user.role || 'member',
      'x-user-department': user.department || '',
      'x-user-email': user.email || '',
    };
  }

  async getTasks(user?: UserAccount | null): Promise<{ tasks: Task[]; version: number } | null> {
    try {
      const params = new URLSearchParams();
      if (user?.id) params.set('userId', user.id);
      if (user?.role) params.set('role', user.role);
      if (user?.department) params.set('department', user.department);
      if (user?.email) params.set('email', user.email);

      const url = params.toString() ? `/api/tasks?${params.toString()}` : '/api/tasks';
      const res = await fetch(url, {
        cache: 'no-store',
        headers: this.getUserHeaders(user),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.tasks)) {
        this.lastVersion = data.version || Date.now();
        return { tasks: data.tasks, version: this.lastVersion };
      }
      return null;
    } catch {
      return null;
    }
  }

  async saveTask(task: Task, user?: UserAccount | null): Promise<boolean> {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getUserHeaders(user),
        },
        body: JSON.stringify(task),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async updateTask(id: string, updates: Partial<Task>, user?: UserAccount | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getUserHeaders(user),
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async deleteTask(id: string, user?: UserAccount | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: this.getUserHeaders(user),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async bulkSaveTasks(tasks: Task[], user?: UserAccount | null): Promise<boolean> {
    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getUserHeaders(user),
        },
        body: JSON.stringify({
          tasks,
          userId: user?.id,
          role: user?.role,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getUsers(): Promise<UserAccount[] | null> {
    try {
      const res = await fetch('/api/users', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.users)) {
        return data.users;
      }
      return null;
    } catch {
      return null;
    }
  }

  async saveUser(user: UserAccount): Promise<boolean> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async bulkSaveUsers(users: UserAccount[]): Promise<boolean> {
    try {
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async verifyUser(idOrEmail: string): Promise<{ verified: boolean; user?: UserAccount; error?: string }> {
    try {
      const res = await fetch('/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: idOrEmail, email: idOrEmail }),
      });
      if (!res.ok) {
        return { verified: false, error: 'User not verified in database' };
      }
      const data = await res.json();
      return { verified: Boolean(data.verified), user: data.user };
    } catch {
      return { verified: false, error: 'Network error verifying user' };
    }
  }

  /**
   * Send 6-digit Verification Code to Real Gmail Address
   */
  async sendVerificationCode(
    email: string,
    purpose: 'login' | 'creation' | 'activation' = 'login',
    userId?: string
  ): Promise<{ success: boolean; email?: string; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error || 'បរាជ័យក្នុងការផ្ញើលេខកូដផ្ទៀងផ្ទាត់' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error sending verification code' };
    }
  }

  /**
   * Verify the 6-digit Verification Code
   */
  async verifyCode(
    email: string,
    code: string
  ): Promise<{ success: boolean; verified?: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error || 'លេខកូដផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវឡើយ' };
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error verifying code' };
    }
  }

  async getActivities(): Promise<ActivityLog[] | null> {
    try {
      const res = await fetch('/api/activities', { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.activities) ? data.activities : null;
    } catch {
      return null;
    }
  }

  async logActivity(activity: ActivityLog): Promise<boolean> {
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getStreak(userId: string): Promise<DailyStreak | null> {
    try {
      const res = await fetch(`/api/streaks/${encodeURIComponent(userId)}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.streak || null;
    } catch {
      return null;
    }
  }

  async saveStreak(userId: string, streak: DailyStreak): Promise<boolean> {
    try {
      const res = await fetch(`/api/streaks/${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streak),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /* ================= IT SUPPORT EXPENSES ================= */
  async getITExpenses(options?: {
    month?: string;
    category?: string;
    search?: string;
  }): Promise<{
    expenses: ITExpense[];
    totalUsd: number;
    totalKhr: number;
    repairsTotalUsd: number;
    hardwareTotalUsd: number;
    consumablesTotalUsd: number;
    otherTotalUsd: number;
    paidCount: number;
    pendingCount: number;
  } | null> {
    try {
      const params = new URLSearchParams();
      if (options?.month) params.set('month', options.month);
      if (options?.category) params.set('category', options.category);
      if (options?.search) params.set('search', options.search);

      const url = params.toString() ? `/api/it-expenses?${params.toString()}` : '/api/it-expenses';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getITExpenseSummary(): Promise<{ summary: ITExpenseMonthlySummary[]; totalRecords: number } | null> {
    try {
      const res = await fetch('/api/it-expenses/summary', { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async saveITExpense(expense: ITExpense, user?: UserAccount | null): Promise<boolean> {
    try {
      const res = await fetch('/api/it-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getUserHeaders(user),
        },
        body: JSON.stringify(expense),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async updateITExpense(id: string, updates: Partial<ITExpense>, user?: UserAccount | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/it-expenses/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getUserHeaders(user),
        },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async deleteITExpense(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/it-expenses/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async fullSync(payload: {
    tasks?: Task[];
    users?: UserAccount[];
    activities?: ActivityLog[];
    itExpenses?: ITExpense[];
  }): Promise<{ tasks: Task[]; users: UserAccount[]; itExpenses?: ITExpense[] } | null> {
    try {
      const res = await fetch('/api/full-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        users: Array.isArray(data.users) ? data.users : [],
        itExpenses: Array.isArray(data.itExpenses) ? data.itExpenses : [],
      };
    } catch {
      return null;
    }
  }
}

export const serverApi = new ServerApiClient();
