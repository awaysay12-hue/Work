export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export type TaskCategory = 'work' | 'study' | 'personal' | 'health' | 'finance' | 'family' | 'other';

export type ReminderTiming = 'at_time' | '5m_before' | '15m_before' | '30m_before' | '1h_before' | '1d_before' | 'none';

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export type UserRole = 'admin' | 'manager' | 'member' | 'viewer';

export type TaskVisibilityScope = 'all' | 'department' | 'assigned_only';

export interface RolePermissions {
  canCreateTask: boolean;
  canEditTask: boolean;
  canDeleteTask: boolean;
  canCompleteTask: boolean;
  canAssignTask: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canSyncCloud: boolean;
  canChangeSettings: boolean;
  defaultVisibilityScope?: TaskVisibilityScope;
}

export interface UserAccount {
  id: string;
  name: string;
  khmerName: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  department: string;
  avatarColor: string;
  avatarInitial: string;
  avatarUrl?: string; // Profile picture URL or Base64
  visibilityScope?: TaskVisibilityScope; // Task visibility scope
  bio?: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  customPermissions?: Partial<RolePermissions>;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'create_task'
    | 'edit_task'
    | 'delete_task'
    | 'complete_task'
    | 'uncomplete_task'
    | 'assign_task'
    | 'update_role'
    | 'add_user'
    | 'delete_user'
    | 'toggle_user_status'
    | 'sync_db';
  targetTitle: string;
  details?: string;
  timestamp: string; // ISO
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: PriorityLevel;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm (24h)
  reminderTiming: ReminderTiming;
  reminderTriggered?: boolean;
  reminderSnoozedUntil?: string; // ISO timestamp
  completed: boolean;
  completedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  subtasks: Subtask[];
  estimatedMinutes?: number;
  spentMinutes?: number;
  recurring: RecurrenceType;
  tags: string[];
  assigneeId?: string;
  assigneeName?: string;
  creatorId?: string;
  creatorName?: string;
}

export type ViewFilterPeriod =
  | 'today'
  | 'tomorrow'
  | 'upcoming'
  | 'overdue'
  | 'completed'
  | 'all'
  | 'calendar'
  | 'analytics'
  | 'team';

export interface TaskFilterState {
  period: ViewFilterPeriod;
  category: string; // 'all' or category id
  priority: string; // 'all' or priority id
  searchQuery: string;
  sortBy: 'dueAsc' | 'dueDesc' | 'priority' | 'title' | 'created';
  assigneeFilter?: string; // 'all', 'me', or specific user id
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  totalCompletedAllTime: number;
  totalFocusMinutesAllTime: number;
}

export interface ActiveReminderAlert {
  task: Task;
  dueText: string;
  alertType: 'due_now' | 'upcoming_soon' | 'overdue';
}

