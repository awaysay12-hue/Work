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
  verifiedInDatabase?: boolean;
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
    | 'archive_task'
    | 'unarchive_task'
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
  archived?: boolean;
  archivedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  subtasks: Subtask[];
  estimatedMinutes?: number;
  spentMinutes?: number;
  recurring: RecurrenceType;
  tags: string[];
  assigneeId?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  creatorId?: string;
  creatorName?: string;
  creatorEmail?: string;
  department?: string;
  visibilityScope?: TaskVisibilityScope;
  verifiedInDatabase?: boolean;
}

export type ViewFilterPeriod =
  | 'today'
  | 'tomorrow'
  | 'upcoming'
  | 'overdue'
  | 'completed'
  | 'archived'
  | 'all'
  | 'calendar'
  | 'analytics'
  | 'team'
  | 'it_expenses';

export type ITExpenseCategory =
  | 'repair'
  | 'hardware_purchase'
  | 'consumable_supplies'
  | 'network_infra'
  | 'software_license'
  | 'maintenance'
  | 'other';

export type ExpensePaymentStatus = 'paid' | 'pending' | 'reimbursed';
export type ExpensePaymentMethod = 'cash' | 'aba_khqr' | 'bank_transfer' | 'company_funds';

export interface ITExpense {
  id: string;
  title: string;
  category: ITExpenseCategory;
  amount: number;
  currency: 'USD' | 'KHR';
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM (e.g. "2026-09")
  department: string; // e.g. "IT Support", "គណនេយ្យ", "រដ្ឋបាល"
  vendor?: string; // Shop/Vendor e.g. "PTC Computer", "Chantrea Shop"
  invoiceNumber?: string;
  requestedBy?: string;
  technicianId: string;
  technicianName: string;
  technicianEmail?: string;
  paymentStatus: ExpensePaymentStatus;
  paymentMethod: ExpensePaymentMethod;
  notes?: string;
  receiptUrl?: string;
  worksheetName?: string; // Associated Worksheet name (e.g. "ខែ 2026-04", "ការជួសជុល", "Sheet1")
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  verifiedInDatabase?: boolean;
}

export interface ITExpenseMonthlySummary {
  month: string; // "2026-09"
  monthLabelKh: string;
  totalUsd: number;
  totalKhr: number;
  count: number;
  repairsTotalUsd: number;
  hardwareTotalUsd: number;
  consumablesTotalUsd: number;
  otherTotalUsd: number;
  paidCount: number;
  pendingCount: number;
}

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

export interface SystemConfig {
  isMaintenance: boolean;
  maintenanceStartedBy?: string;
  maintenanceStartTime?: string;
  maintenanceReason?: string;
  currentVersion: string;
  lastUpdated?: string;
  releaseNotes?: string;
  showNewVersionBanner?: boolean;
}

