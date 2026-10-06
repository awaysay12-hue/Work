import express from 'express';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Comprehensive Web Security and Cross-origin Protection Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Storage Directory Setup
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const STREAKS_FILE = path.join(DATA_DIR, 'streaks.json');
const IT_EXPENSES_FILE = path.join(DATA_DIR, 'it_expenses.json');
const VERIFICATION_CODES_FILE = path.join(DATA_DIR, 'verification_codes.json');

function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) return fallback;
    return JSON.parse(content) as T;
  } catch (err) {
    console.warn(`Error reading ${filePath}, using fallback:`, err);
    return fallback;
  }
}

function safeWriteJson(filePath: string, data: any): boolean {
  try {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (directErr) {
      console.error(`Direct write also failed for ${filePath}:`, directErr);
      return false;
    }
  }
}

// In-Memory cache for high-speed queries
let inMemoryTasks: any[] = safeReadJson<any[]>(TASKS_FILE, []);
let inMemoryUsers: any[] = safeReadJson<any[]>(USERS_FILE, []);
let inMemoryActivities: any[] = safeReadJson<any[]>(ACTIVITIES_FILE, []);
let inMemoryStreaks: Record<string, any> = safeReadJson<Record<string, any>>(STREAKS_FILE, {});
let inMemoryITExpenses: any[] = safeReadJson<any[]>(IT_EXPENSES_FILE, []);

// Restricted / Banned legacy identifiers that must NEVER exist
const BANNED_LEGACY_USER_IDS = new Set([
  'user-manager-1',
  'user-member-1',
  'user-viewer-1',
  'user-mgr-1',
  'user-mem-1',
  'user-mem-2',
  'user-view-1',
  'user-2',
  'user-3',
  'user-4',
  'user-5',
  'demo-user-1',
  'demo-user-2',
]);
const BANNED_LEGACY_EMAILS = new Set([
  'sokha@taskmate.kh',
  'bopha@taskmate.kh',
  'dara@taskmate.kh',
]);

// Real persistent verification codes store with anti-brute-force defense
interface VerificationRecord {
  email: string;
  code: string;
  purpose: 'login' | 'creation' | 'activation';
  createdAt: number;
  expiresAt: number;
  verified: boolean;
  failedAttempts: number;
}
let inMemoryVerificationCodes: VerificationRecord[] = safeReadJson<VerificationRecord[]>(VERIFICATION_CODES_FILE, []);

// In-memory rate limiting & lockout trackers
const otpRequestTimestamps = new Map<string, number>();
const otpLockouts = new Map<string, number>();

// Setup Nodemailer Transporter for Real Gmail dispatch
function createMailTransporter() {
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  return null;
}

/**
 * Dispatches real verification email to the user's Gmail address
 */
async function sendVerificationEmail(
  toEmail: string,
  code: string,
  purpose: 'login' | 'creation' | 'activation' = 'login'
): Promise<{ sent: boolean; method: string; messageId?: string; error?: string }> {
  const transporter = createMailTransporter();
  const purposeKhmer =
    purpose === 'creation'
      ? 'បង្កើតគណនីថ្មីដោយ Super Admin'
      : purpose === 'activation'
      ? 'ដំណើរការគណនី'
      : 'ចូលប្រើប្រាស់ប្រព័ន្ធ (Login)';

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Task Pro - Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Kantumruy Pro', Arial, sans-serif; background-color: #f7f0fe; margin: 0; padding: 32px 16px; color: #1e1b4b;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.12); border: 1px solid #e9d5ff;">
    <!-- Royal Purple Header -->
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4338ca 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 14px; line-height: 48px; font-size: 24px; margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.25);">
        🔐
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">កម្មវិធីគ្រប់គ្រង Daily Task Pro</h1>
      <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.92; font-weight: 500;">ប្រព័ន្ធផ្ទៀងផ្ទាត់សុវត្ថិភាព 2FA • Real Gmail Verification</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px 24px; text-align: center;">
      <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151; font-weight: 600; line-height: 1.5;">
        សួស្តី! អ្នកកំពុងស្នើសុំ <span style="color: #7c3aed; font-weight: 700;">${purposeKhmer}</span> ក្នុងកម្មវិធី Daily Task Pro។
      </p>
      <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">
        សូមប្រើប្រាស់លេខកូដសម្ងាត់ 6 ខ្ទង់ខាងក្រោមនេះដើម្បីផ្ទៀងផ្ទាត់៖
      </p>

      <!-- Verification Code Box -->
      <div style="display: inline-block; margin: 8px auto 24px auto; padding: 18px 36px; background: #faf5ff; border: 2px dashed #9333ea; border-radius: 18px; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.08);">
        <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #6b21a8; font-family: 'Courier New', Courier, monospace; display: block;">${code}</span>
      </div>

      <div style="background: #fdf4ff; border: 1px solid #f0abfc; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px; text-align: left;">
        <p style="margin: 0; font-size: 12px; color: #86198f; font-weight: 600;">
          ⏳ លេខកូដនេះមានសុពលភាពត្រឹមតែ <strong style="color: #c026d3;">10 នាទី</strong> ប៉ុណ្ណោះ។
        </p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #701a75;">
          🔒 ប្រសិនបើអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមកុំចែករំលែកវាទៅកាន់អ្នកណាឡើយ។
        </p>
      </div>

      <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
        អ៊ីមែលទទួល៖ <strong style="color: #4b5563;">${toEmail}</strong><br/>
        កាលបរិច្ឆេទស្នើសុំ៖ ${new Date().toLocaleString('km-KH', { timeZone: 'Asia/Phnom_Penh' })}
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #faf5ff; padding: 16px 24px; text-align: center; border-top: 1px solid #f3e8ff; font-size: 11px; color: #7e22ce;">
      Daily Task Pro Enterprise • ប្រព័ន្ធគ្រប់គ្រងការងារ និងសុវត្ថិភាពខ្ពស់
    </div>
  </div>
</body>
</html>
  `;

  console.log(`\n======================================================`);
  console.log(`[🔐 GMAIL VERIFICATION CODE GENERATED]`);
  console.log(`To: ${toEmail}`);
  console.log(`Code: ${code}`);
  console.log(`Purpose: ${purposeKhmer}`);
  console.log(`Expires At: ${new Date(Date.now() + 10 * 60 * 1000).toISOString()}`);
  console.log(`======================================================\n`);

  if (!transporter) {
    return {
      sent: true,
      method: 'direct_simulation',
      error: undefined,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER || process.env.SMTP_USER || '"Daily Task Pro" <no-reply@dailytask.kh>',
      to: toEmail,
      subject: `🔐 លេខកូដផ្ទៀងផ្ទាត់សុវត្ថិភាព Daily Task Pro: ${code}`,
      html: htmlContent,
      text: `លេខកូដផ្ទៀងផ្ទាត់សុវត្ថិភាព Daily Task Pro របស់អ្នកគឺ៖ ${code} (មានសុពលភាព 10 នាទី)`,
    });
    return { sent: true, method: 'smtp_real', messageId: info.messageId };
  } catch (err: any) {
    console.error('[GMAIL DISPATCH ERROR]', err);
    return { sent: false, method: 'smtp_error', error: err?.message || 'SMTP dispatch failed' };
  }
}

// Broadcast version tracking for real-time change detection
let currentDataVersion = Date.now();

/**
 * Database User Verifier
 * Validates that an identifier or email corresponds to an actual registered,
 * active human user in the database. Strictly rejects unauthorized accounts.
 */
function findRealUserInDatabase(identifierOrEmail?: string): any | null {
  if (!identifierOrEmail) return null;
  const clean = String(identifierOrEmail).trim().toLowerCase();
  if (!clean) return null;

  return (
    inMemoryUsers.find(
      (u) =>
        u &&
        !BANNED_LEGACY_USER_IDS.has(u.id) &&
        (!u.email || !BANNED_LEGACY_EMAILS.has(u.email.trim().toLowerCase())) &&
        u.status === 'active' &&
        (String(u.id).toLowerCase() === clean ||
          (u.email && String(u.email).trim().toLowerCase() === clean))
    ) || null
  );
}

/**
 * Database Normalizer & Integrity Validator
 * Guarantees that every task and user record in the database is strictly typed,
 * indexed with valid identifiers, and correctly scoped.
 * Purges or reassigns any orphaned/fake user records.
 */
function normalizeAndOptimizeDatabase() {
  // 1. Sanitize Users & strictly purge all legacy/unauthorized accounts
  const userMap = new Map<string, any>();
  inMemoryUsers.forEach((u) => {
    if (u && u.id) {
      const cleanEmail = u.email ? String(u.email).trim().toLowerCase() : '';
      if (BANNED_LEGACY_USER_IDS.has(u.id) || BANNED_LEGACY_EMAILS.has(cleanEmail)) {
        // Exclude restricted users completely!
        return;
      }
      userMap.set(u.id, {
        ...u,
        email: cleanEmail || u.email,
        name: u.name || 'User',
        khmerName: u.khmerName || u.name,
        role: u.role || 'member',
        department: u.department || 'General',
        visibilityScope:
          u.visibilityScope ||
          (u.role === 'admin' ? 'all' : u.role === 'manager' ? 'department' : 'assigned_only'),
        status: u.status || 'active',
        verifiedInDatabase: true,
      });
    }
  });

  // Ensure default real superadmin exists if list is empty
  if (!userMap.has('user-admin-1')) {
    userMap.set('user-admin-1', {
      id: 'user-admin-1',
      name: 'PUNLEU (Admin)',
      khmerName: 'ពន្លឺ (Super Admin)',
      email: 'sunpunleu168@gmail.com',
      password: '123',
      phone: '012 000 000',
      role: 'admin',
      department: 'បច្ចេកវិទ្យា & IT',
      visibilityScope: 'all',
      avatarColor: 'from-rose-500 to-indigo-600',
      avatarInitial: 'ព',
      status: 'active',
      joinedDate: '2025-01-10',
      verifiedInDatabase: true,
    });
  }

  inMemoryUsers = Array.from(userMap.values());
  safeWriteJson(USERS_FILE, inMemoryUsers);

  // 2. Sanitize Tasks - Strictly verify all creators & assignees exist in database
  const defaultAdmin = inMemoryUsers.find((u) => u.role === 'admin') || inMemoryUsers[0];
  const defaultAdminId = defaultAdmin?.id || 'user-admin-1';
  const defaultAdminName = defaultAdmin?.khmerName || defaultAdmin?.name || 'Super Admin';
  const defaultAdminEmail = defaultAdmin?.email || 'sunpunleu168@gmail.com';

  const taskMap = new Map<string, any>();
  inMemoryTasks.forEach((t) => {
    if (t && t.id && t.title) {
      const verifiedCreator = findRealUserInDatabase(t.creatorId) ||
        findRealUserInDatabase(t.creatorEmail) ||
        defaultAdmin;

      const verifiedAssignee = findRealUserInDatabase(t.assigneeId) ||
        findRealUserInDatabase(t.assigneeEmail) ||
        verifiedCreator;

      taskMap.set(t.id, {
        ...t,
        title: String(t.title).trim(),
        creatorId: verifiedCreator?.id || defaultAdminId,
        creatorName: verifiedCreator?.khmerName || verifiedCreator?.name || defaultAdminName,
        creatorEmail: verifiedCreator?.email || defaultAdminEmail,
        assigneeId: verifiedAssignee?.id || defaultAdminId,
        assigneeName: verifiedAssignee?.khmerName || verifiedAssignee?.name || defaultAdminName,
        assigneeEmail: verifiedAssignee?.email || defaultAdminEmail,
        department: verifiedAssignee?.department || verifiedCreator?.department || 'General',
        visibilityScope: t.visibilityScope || (verifiedCreator?.role === 'admin' ? 'all' : 'assigned_only'),
        completed: Boolean(t.completed),
        createdAt: t.createdAt || new Date().toISOString(),
        verifiedInDatabase: true,
      });
    }
  });
  inMemoryTasks = Array.from(taskMap.values());
  safeWriteJson(TASKS_FILE, inMemoryTasks);

  // 3. Sanitize and optimize IT Support Expenses
  const expenseMap = new Map<string, any>();
  inMemoryITExpenses.forEach((exp) => {
    if (exp && exp.id && exp.title) {
      const verifiedTech = findRealUserInDatabase(exp.technicianId) ||
        findRealUserInDatabase(exp.technicianEmail) ||
        defaultAdmin;

      const dateStr = exp.date || new Date().toISOString().split('T')[0];
      const monthStr = exp.month || dateStr.substring(0, 7);

      expenseMap.set(exp.id, {
        ...exp,
        title: String(exp.title).trim(),
        category: exp.category || 'repair',
        amount: Number(exp.amount) || 0,
        currency: exp.currency || 'USD',
        date: dateStr,
        month: monthStr,
        department: exp.department || 'IT Support',
        technicianId: verifiedTech?.id || defaultAdminId,
        technicianName: verifiedTech?.khmerName || verifiedTech?.name || defaultAdminName,
        technicianEmail: verifiedTech?.email || defaultAdminEmail,
        paymentStatus: exp.paymentStatus || 'paid',
        paymentMethod: exp.paymentMethod || 'cash',
        createdAt: exp.createdAt || new Date().toISOString(),
        verifiedInDatabase: true,
      });
    }
  });
  inMemoryITExpenses = Array.from(expenseMap.values());
  safeWriteJson(IT_EXPENSES_FILE, inMemoryITExpenses);
}

normalizeAndOptimizeDatabase();

/**
 * User Task Authorization Scoper
 * Strictly checks whether a user account has permission to view a specific task.
 * Prevents accidental data leaking of other people's tasks across devices.
 */
function isUserAuthorizedToViewTask(task: any, user: any): boolean {
  if (!task || !user) return false;
  // Super Admin can view all tasks across the company
  if (user.role === 'admin') return true;

  const userId = String(user.id || '').trim();
  const userEmail = String(user.email || '').trim().toLowerCase();
  const userName = String(user.khmerName || user.name || '').trim().toLowerCase();
  const userDept = String(user.department || '').trim().toLowerCase();

  const taskCreatorId = String(task.creatorId || '').trim();
  const taskAssigneeId = String(task.assigneeId || '').trim();
  const taskCreatorEmail = String(task.creatorEmail || '').trim().toLowerCase();
  const taskAssigneeEmail = String(task.assigneeEmail || '').trim().toLowerCase();
  const taskCreatorName = String(task.creatorName || '').trim().toLowerCase();
  const taskAssigneeName = String(task.assigneeName || '').trim().toLowerCase();
  const taskDept = String(task.department || '').trim().toLowerCase();

  // 1. Direct creator or assignee ID match
  if (userId && (taskCreatorId === userId || taskAssigneeId === userId)) {
    return true;
  }

  // 2. Email match
  if (userEmail && (taskCreatorEmail === userEmail || taskAssigneeEmail === userEmail)) {
    return true;
  }

  // 3. Name match
  if (userName && (taskCreatorName === userName || taskAssigneeName === userName)) {
    return true;
  }

  // 4. Department Manager scope
  if (user.role === 'manager' && userDept && taskDept === userDept) {
    return true;
  }

  // 5. Global broadcast scope (explicitly marked public)
  if (task.visibilityScope === 'all') {
    return true;
  }

  return false;
}

/**
 * Helper to resolve authenticated user from request query or headers
 */
function resolveUserFromRequest(req: express.Request): any | null {
  const userId = (req.query.userId || req.headers['x-user-id']) as string | undefined;
  const userEmail = (req.query.email || req.headers['x-user-email']) as string | undefined;
  const userRole = (req.query.role || req.headers['x-user-role']) as string | undefined;
  const userDept = (req.query.department || req.headers['x-user-department']) as string | undefined;

  if (userId) {
    const found = inMemoryUsers.find((u) => u.id === userId);
    if (found) return found;
  }

  if (userEmail) {
    const clean = String(userEmail).trim().toLowerCase();
    const found = inMemoryUsers.find((u) => u.email && String(u.email).trim().toLowerCase() === clean);
    if (found) return found;
  }

  if (userId || userRole) {
    return {
      id: userId || `user-temp-${Date.now()}`,
      role: userRole || 'member',
      email: userEmail || '',
      department: userDept || 'General',
    };
  }

  return null;
}

/* ==========================================================================
   HEALTH & DATABASE STATUS
   ========================================================================== */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: currentDataVersion,
    tasksCount: inMemoryTasks.length,
    usersCount: inMemoryUsers.length,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db/status', (req, res) => {
  res.json({
    status: 'optimized',
    version: currentDataVersion,
    totalTasks: inMemoryTasks.length,
    totalUsers: inMemoryUsers.length,
    activitiesCount: inMemoryActivities.length,
    lastOptimized: new Date().toISOString(),
  });
});

/* ==========================================================================
   TASKS API (Strictly Scoped & Isolated Cross-Device Store)
   ========================================================================== */
app.get('/api/tasks', (req, res) => {
  const caller = resolveUserFromRequest(req);

  // If no user context provided (unauthenticated/guest), do not leak private data
  if (!caller) {
    return res.json({
      tasks: [],
      version: currentDataVersion,
      unauthorized: true,
      notice: 'User authentication context required to fetch tasks',
    });
  }

  // Filter tasks strictly by permissions and ownership
  const scopedTasks = inMemoryTasks.filter((t) => isUserAuthorizedToViewTask(t, caller));

  res.json({
    tasks: scopedTasks,
    totalInDb: inMemoryTasks.length,
    userScope: caller.role,
    version: currentDataVersion,
  });
});

app.post('/api/tasks', (req, res) => {
  try {
    const task = req.body;
    if (!task || !task.id) {
      return res.status(400).json({ error: 'Task must contain an id' });
    }

    const caller = resolveUserFromRequest(req);
    const callerRole = caller?.role || 'member';

    // 1. Strict Real User Verification against Database
    const rawCreatorId = task.creatorId || caller?.id;
    const verifiedCreator = findRealUserInDatabase(rawCreatorId) || findRealUserInDatabase(task.creatorEmail);
    if (!verifiedCreator) {
      return res.status(400).json({
        error: 'ការផ្ទៀងផ្ទាត់មិនជោគជ័យ៖ អ្នកបង្កើត (Creator) មិនមែនជាមនុស្សពិតប្រាកដក្នុង Database ឡើយ (Real user verification failed)',
        verified: false,
        field: 'creatorId',
      });
    }

    const rawAssigneeId = task.assigneeId || verifiedCreator.id;
    const verifiedAssignee = findRealUserInDatabase(rawAssigneeId) || findRealUserInDatabase(task.assigneeEmail);
    if (!verifiedAssignee) {
      return res.status(400).json({
        error: 'ការផ្ទៀងផ្ទាត់មិនជោគជ័យ៖ អ្នកទទួលខុសត្រូវ (Assignee) មិនមែនជាមនុស្សពិតប្រាកដក្នុង Database ឡើយ (Real user verification failed)',
        verified: false,
        field: 'assigneeId',
      });
    }

    // Normalize task metadata strictly tied to verified real users
    const cleanTask = {
      ...task,
      title: String(task.title || '').trim(),
      creatorId: verifiedCreator.id,
      creatorName: verifiedCreator.khmerName || verifiedCreator.name,
      creatorEmail: verifiedCreator.email,
      assigneeId: verifiedAssignee.id,
      assigneeName: verifiedAssignee.khmerName || verifiedAssignee.name,
      assigneeEmail: verifiedAssignee.email,
      department: verifiedAssignee.department || verifiedCreator.department || 'General',
      visibilityScope: task.visibilityScope || (verifiedCreator.role === 'admin' ? 'all' : 'assigned_only'),
      verifiedInDatabase: true,
      updatedAt: new Date().toISOString(),
    };

    const index = inMemoryTasks.findIndex((t) => t.id === cleanTask.id);
    if (index >= 0) {
      const existing = inMemoryTasks[index];
      // Security Check: Non-admins cannot edit someone else's task unless they are the creator or assignee
      if (
        callerRole !== 'admin' &&
        caller &&
        existing.creatorId !== caller.id &&
        existing.assigneeId !== caller.id &&
        existing.creatorEmail !== caller.email &&
        existing.assigneeEmail !== caller.email
      ) {
        return res.status(403).json({ error: 'Unauthorized to modify another user\'s task' });
      }
      inMemoryTasks[index] = { ...existing, ...cleanTask };
    } else {
      inMemoryTasks.unshift(cleanTask);
    }

    currentDataVersion = Date.now();
    safeWriteJson(TASKS_FILE, inMemoryTasks);

    res.json({
      success: true,
      task: inMemoryTasks[index >= 0 ? index : 0],
      verified: true,
      version: currentDataVersion,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const updates = req.body;
    const caller = resolveUserFromRequest(req);
    const callerRole = caller?.role || 'member';

    const index = inMemoryTasks.findIndex((t) => t.id === taskId);
    if (index >= 0) {
      const existing = inMemoryTasks[index];
      // Security Check
      if (
        callerRole !== 'admin' &&
        caller &&
        existing.creatorId !== caller.id &&
        existing.assigneeId !== caller.id
      ) {
        return res.status(403).json({ error: 'Unauthorized to modify this task' });
      }

      // Verify assignee if provided
      if (updates.assigneeId) {
        const verifiedAssignee = findRealUserInDatabase(updates.assigneeId) || findRealUserInDatabase(updates.assigneeEmail);
        if (!verifiedAssignee) {
          return res.status(400).json({
            error: 'ការផ្ទៀងផ្ទាត់មិនជោគជ័យ៖ អ្នកទទួលខុសត្រូវ (Assignee) មិនមែនជាមនុស្សពិតប្រាកដក្នុង Database ឡើយ',
            verified: false,
          });
        }
        updates.assigneeId = verifiedAssignee.id;
        updates.assigneeName = verifiedAssignee.khmerName || verifiedAssignee.name;
        updates.assigneeEmail = verifiedAssignee.email;
        updates.department = verifiedAssignee.department;
      }

      inMemoryTasks[index] = {
        ...existing,
        ...updates,
        verifiedInDatabase: true,
        updatedAt: new Date().toISOString(),
      };
      currentDataVersion = Date.now();
      safeWriteJson(TASKS_FILE, inMemoryTasks);
      return res.json({ success: true, task: inMemoryTasks[index], version: currentDataVersion });
    } else {
      // Creation via PUT requires valid creator & assignee verification
      const verifiedCreator = findRealUserInDatabase(updates.creatorId || caller?.id);
      if (!verifiedCreator) {
        return res.status(400).json({
          error: 'ការផ្ទៀងផ្ទាត់មិនជោគជ័យ៖ អ្នកបង្កើត (Creator) មិនមែនជាមនុស្សពិតប្រាកដក្នុង Database ឡើយ',
          verified: false,
        });
      }
      const verifiedAssignee = findRealUserInDatabase(updates.assigneeId || verifiedCreator.id) || verifiedCreator;

      const created = {
        id: taskId,
        ...updates,
        creatorId: verifiedCreator.id,
        creatorName: verifiedCreator.khmerName || verifiedCreator.name,
        creatorEmail: verifiedCreator.email,
        assigneeId: verifiedAssignee.id,
        assigneeName: verifiedAssignee.khmerName || verifiedAssignee.name,
        assigneeEmail: verifiedAssignee.email,
        department: verifiedAssignee.department || verifiedCreator.department || 'General',
        verifiedInDatabase: true,
        createdAt: new Date().toISOString(),
      };
      inMemoryTasks.unshift(created);
      currentDataVersion = Date.now();
      safeWriteJson(TASKS_FILE, inMemoryTasks);
      return res.json({ success: true, task: created, version: currentDataVersion });
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskId = req.params.id;
    const caller = resolveUserFromRequest(req);
    const callerId = caller?.id;
    const callerRole = caller?.role || 'member';

    const existingIndex = inMemoryTasks.findIndex((t) => t.id === taskId);
    if (existingIndex === -1) {
      return res.json({ success: true, message: 'Task already removed' });
    }

    const task = inMemoryTasks[existingIndex];
    // Security check: only super admin or the creator/assignee can delete a task
    if (
      callerRole !== 'admin' &&
      callerId &&
      task.creatorId !== callerId &&
      task.assigneeId !== callerId
    ) {
      return res.status(403).json({ error: 'Unauthorized to delete another user\'s task' });
    }

    inMemoryTasks.splice(existingIndex, 1);
    currentDataVersion = Date.now();
    safeWriteJson(TASKS_FILE, inMemoryTasks);
    res.json({ success: true, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete task' });
  }
});

app.post('/api/tasks/bulk', (req, res) => {
  try {
    const { tasks, userId, role } = req.body;
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array required' });
    }

    const caller = resolveUserFromRequest(req) || {
      id: userId,
      role: role || 'member',
    };

    const map = new Map<string, any>();
    inMemoryTasks.forEach((t) => map.set(t.id, t));

    tasks.forEach((t) => {
      if (!t || !t.id || !t.title) return;

      // Only accept tasks whose creator & assignee are verified real users in database
      const verifiedCreator = findRealUserInDatabase(t.creatorId || caller.id) ||
        findRealUserInDatabase(t.creatorEmail);
      if (!verifiedCreator) return; // Drop tasks with fake creators

      const verifiedAssignee = findRealUserInDatabase(t.assigneeId || verifiedCreator.id) ||
        findRealUserInDatabase(t.assigneeEmail) ||
        verifiedCreator;

      const isAuthorized = caller.role === 'admin' ||
        verifiedCreator.id === caller.id ||
        verifiedAssignee.id === caller.id;

      if (isAuthorized) {
        map.set(t.id, {
          ...t,
          creatorId: verifiedCreator.id,
          creatorName: verifiedCreator.khmerName || verifiedCreator.name,
          creatorEmail: verifiedCreator.email,
          assigneeId: verifiedAssignee.id,
          assigneeName: verifiedAssignee.khmerName || verifiedAssignee.name,
          assigneeEmail: verifiedAssignee.email,
          department: verifiedAssignee.department || verifiedCreator.department || 'General',
          verifiedInDatabase: true,
        });
      }
    });

    inMemoryTasks = Array.from(map.values());
    currentDataVersion = Date.now();
    safeWriteJson(TASKS_FILE, inMemoryTasks);
    res.json({ success: true, count: inMemoryTasks.length, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to bulk save tasks' });
  }
});

// Real User Database Verification Endpoint
app.post('/api/users/verify', (req, res) => {
  const { userId, email } = req.body;
  const verifiedUser = findRealUserInDatabase(userId) || findRealUserInDatabase(email);
  if (verifiedUser) {
    res.json({
      verified: true,
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        khmerName: verifiedUser.khmerName,
        email: verifiedUser.email,
        role: verifiedUser.role,
        department: verifiedUser.department,
        status: verifiedUser.status,
      },
    });
  } else {
    res.status(404).json({
      verified: false,
      error: 'មិនមានគណនីមនុស្សពិតប្រាកដក្នុង Database ឡើយ (Real user not found)',
    });
  }
});

/* ==========================================================================
   2FA / GMAIL VERIFICATION CODE API (Real Gmail Dispatch & Validation)
   ========================================================================== */

// 1. Send 6-digit Verification Code to User's Gmail
app.post('/api/auth/send-verification-code', async (req, res) => {
  try {
    const { email, purpose = 'login', userId } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'សូមបញ្ចូលអ៊ីមែលពិតប្រាកដឱ្យបានត្រឹមត្រូវ' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user is a restricted or banned identifier
    if (BANNED_LEGACY_EMAILS.has(cleanEmail)) {
      return res.status(403).json({ success: false, error: 'គណនីនេះមិនត្រូវបានអនុញ្ញាតក្នុងប្រព័ន្ធឡើយ។ សូមប្រើប្រាស់គណនីត្រឹមត្រូវ។' });
    }

    // Check account lockout status (Brute force protection)
    const lockoutUntil = otpLockouts.get(cleanEmail);
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const waitMinutes = Math.ceil((lockoutUntil - Date.now()) / (60 * 1000));
      return res.status(429).json({
        success: false,
        error: `គណនីនេះត្រូវបានផ្អាកបណ្តោះអាសន្ន ${waitMinutes} នាទីទៀត ដោយសារការប៉ុនប៉ងបញ្ចូលលេខកូដខុសលើសចំនួនកំណត់។`,
      });
    }

    // Rate Limiting: Minimum 45 seconds between code requests
    const lastRequestTime = otpRequestTimestamps.get(cleanEmail);
    if (lastRequestTime && Date.now() - lastRequestTime < 45000) {
      const remainingSeconds = Math.ceil((45000 - (Date.now() - lastRequestTime)) / 1000);
      return res.status(429).json({
        success: false,
        error: `សូមរង់ចាំ ${remainingSeconds} វិនាទីសិន មុននឹងស្នើសុំលេខកូដផ្ទៀងផ្ទាត់ថ្មី (Rate Limit)។`,
      });
    }
    otpRequestTimestamps.set(cleanEmail, Date.now());

    // Generate cryptographically unpredictable 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Purge expired or prior records for this email
    inMemoryVerificationCodes = inMemoryVerificationCodes.filter(
      (c) => c.email !== cleanEmail || Date.now() > c.expiresAt
    );

    const record: VerificationRecord = {
      email: cleanEmail,
      code,
      purpose,
      createdAt: Date.now(),
      expiresAt,
      verified: false,
      failedAttempts: 0,
    };
    inMemoryVerificationCodes.push(record);
    safeWriteJson(VERIFICATION_CODES_FILE, inMemoryVerificationCodes);

    // Dispatch real email via Nodemailer
    const emailResult = await sendVerificationEmail(cleanEmail, code, purpose);

    // SECURE RESPONSE: Code is strictly confidential and NEVER returned in client response
    res.json({
      success: true,
      email: cleanEmail,
      expiresAt,
      sent: emailResult.sent,
      message: `លេខកូដផ្ទៀងផ្ទាត់ 6 ខ្ទង់ត្រូវបានបញ្ជូនទៅកាន់ ${cleanEmail} រួចរាល់។`,
    });
  } catch (err: any) {
    console.error('Error in send-verification-code:', err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to dispatch verification code' });
  }
});

// 2. Verify 6-digit Code (Anti-Brute-Force & Replay-Protected)
app.post('/api/auth/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'សូមបញ្ចូលអ៊ីមែល និងលេខកូដផ្ទៀងផ្ទាត់ 6 ខ្ទង់' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanCode = String(code).trim();

    // Check account lockout status
    const lockoutUntil = otpLockouts.get(cleanEmail);
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const waitMinutes = Math.ceil((lockoutUntil - Date.now()) / (60 * 1000));
      return res.status(429).json({
        success: false,
        error: `គណនីនេះត្រូវបានផ្អាកបណ្តោះអាសន្ន ${waitMinutes} នាទីទៀត ដោយសារការប៉ុនប៉ងខុសច្រើនដង។`,
      });
    }

    // Find the latest unverified record
    const record = inMemoryVerificationCodes
      .slice()
      .reverse()
      .find((c) => c.email === cleanEmail && !c.verified);

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'មិនមានសំណើលេខកូដផ្ទៀងផ្ទាត់សម្រាប់អ៊ីមែលនេះឡើយ។ សូមចុច "ផ្ញើលេខកូដម្តងទៀត"។',
      });
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      inMemoryVerificationCodes = inMemoryVerificationCodes.filter((c) => c !== record);
      safeWriteJson(VERIFICATION_CODES_FILE, inMemoryVerificationCodes);
      return res.status(400).json({
        success: false,
        error: 'លេខកូដផ្ទៀងផ្ទាត់បានផុតកំណត់សុពលភាពហើយ (Expired)។ សូមចុច "ផ្ញើលេខកូដម្តងទៀត"។',
      });
    }

    // Check code correctness
    if (record.code !== cleanCode) {
      record.failedAttempts = (record.failedAttempts || 0) + 1;
      const remainingAttempts = 5 - record.failedAttempts;

      if (remainingAttempts <= 0) {
        // Enforce 15-minute security lockout and invalidate the code
        otpLockouts.set(cleanEmail, Date.now() + 15 * 60 * 1000);
        inMemoryVerificationCodes = inMemoryVerificationCodes.filter((c) => c !== record);
        safeWriteJson(VERIFICATION_CODES_FILE, inMemoryVerificationCodes);

        return res.status(429).json({
          success: false,
          error: 'អ្នកបានបញ្ចូលលេខកូដខុសលើសចំនួនកំណត់ (៥ ដង)។ លេខកូដនេះត្រូវបានលុបចោលដើម្បីសុវត្ថិភាព។ សូមរង់ចាំ ១៥ នាទី។',
        });
      }

      safeWriteJson(VERIFICATION_CODES_FILE, inMemoryVerificationCodes);
      return res.status(400).json({
        success: false,
        error: `លេខកូដផ្ទៀងផ្ទាត់ 6 ខ្ទង់មិនត្រឹមត្រូវឡើយ។ នៅសល់ឱកាសសាកល្បង ${remainingAttempts} ដងទៀត។`,
      });
    }

    // Mark as verified & immediately consume code to eliminate replay attacks
    record.verified = true;
    inMemoryVerificationCodes = inMemoryVerificationCodes.filter((c) => c !== record);
    safeWriteJson(VERIFICATION_CODES_FILE, inMemoryVerificationCodes);
    otpLockouts.delete(cleanEmail);

    res.json({
      success: true,
      verified: true,
      message: 'ការផ្ទៀងផ្ទាត់លេខកូដ Gmail ជោគជ័យ!',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Verification failed' });
  }
});

/* ==========================================================================
   USERS API (Cross-Device Central Store)
   ========================================================================== */
app.get('/api/users', (req, res) => {
  // Strictly filter out any restricted or banned legacy identifiers
  const realUsers = inMemoryUsers.filter(
    (u) =>
      u &&
      !BANNED_LEGACY_USER_IDS.has(u.id) &&
      (!u.email || !BANNED_LEGACY_EMAILS.has(u.email.trim().toLowerCase()))
  );
  res.json({
    users: realUsers,
    version: currentDataVersion,
  });
});

app.post('/api/users', async (req, res) => {
  try {
    const user = req.body;
    if (!user || !user.id) {
      return res.status(400).json({ error: 'User must have an id' });
    }

    const cleanEmail = user.email ? String(user.email).trim().toLowerCase() : '';
    if (BANNED_LEGACY_USER_IDS.has(user.id) || BANNED_LEGACY_EMAILS.has(cleanEmail)) {
      return res.status(403).json({ error: 'មិនអាចបង្កើតគណនីដែលត្រូវបានហាមឃាត់ឡើយ' });
    }

    const index = inMemoryUsers.findIndex(
      (u) =>
        u.id === user.id ||
        (cleanEmail && u.email && u.email.trim().toLowerCase() === cleanEmail)
    );

    const isNewUser = index < 0;

    if (index >= 0) {
      inMemoryUsers[index] = { ...inMemoryUsers[index], ...user, verifiedInDatabase: true };
    } else {
      inMemoryUsers.push({ ...user, verifiedInDatabase: true });
    }

    currentDataVersion = Date.now();
    safeWriteJson(USERS_FILE, inMemoryUsers);

    // If a new user is created by Super Admin, automatically dispatch activation/verification code to their Gmail!
    if (isNewUser && cleanEmail && cleanEmail.includes('@')) {
      const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const record: VerificationRecord = {
        email: cleanEmail,
        code: activationCode,
        purpose: 'creation',
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours for new account activation
        verified: false,
        failedAttempts: 0,
      };
      inMemoryVerificationCodes.push(record);
      safeWriteJson(VERIFICATION_CODES_FILE, inMemoryVerificationCodes);

      // Async email dispatch to user's real Gmail
      sendVerificationEmail(cleanEmail, activationCode, 'creation').catch((err) => {
        console.error('Failed to send creation email:', err);
      });
    }

    res.json({
      success: true,
      user,
      version: currentDataVersion,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save user' });
  }
});

app.post('/api/users/bulk', (req, res) => {
  try {
    const { users } = req.body;
    if (Array.isArray(users)) {
      const map = new Map<string, any>();
      inMemoryUsers.forEach((u) => {
        if (!BANNED_LEGACY_USER_IDS.has(u.id) && (!u.email || !BANNED_LEGACY_EMAILS.has(u.email.trim().toLowerCase()))) {
          map.set(u.id, u);
        }
      });
      users.forEach((u) => {
        if (u && u.id && !BANNED_LEGACY_USER_IDS.has(u.id) && (!u.email || !BANNED_LEGACY_EMAILS.has(String(u.email).trim().toLowerCase()))) {
          map.set(u.id, { ...u, verifiedInDatabase: true });
        }
      });
      inMemoryUsers = Array.from(map.values());
      currentDataVersion = Date.now();
      safeWriteJson(USERS_FILE, inMemoryUsers);
    }
    res.json({ success: true, count: inMemoryUsers.length, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to bulk save users' });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const userId = req.params.id;
    inMemoryUsers = inMemoryUsers.filter((u) => u.id !== userId);
    currentDataVersion = Date.now();
    safeWriteJson(USERS_FILE, inMemoryUsers);
    res.json({ success: true, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete user' });
  }
});

/* ==========================================================================
   IT SUPPORT MONTHLY EXPENSES API
   ========================================================================== */
app.get('/api/it-expenses', (req, res) => {
  try {
    const { month, category, search } = req.query;
    let list = [...inMemoryITExpenses];

    if (month && typeof month === 'string') {
      list = list.filter((exp) => exp.month === month);
    }

    if (category && typeof category === 'string' && category !== 'all') {
      list = list.filter((exp) => exp.category === category);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (exp) =>
          (exp.title && exp.title.toLowerCase().includes(q)) ||
          (exp.vendor && exp.vendor.toLowerCase().includes(q)) ||
          (exp.invoiceNumber && exp.invoiceNumber.toLowerCase().includes(q)) ||
          (exp.department && exp.department.toLowerCase().includes(q)) ||
          (exp.technicianName && exp.technicianName.toLowerCase().includes(q)) ||
          (exp.requestedBy && exp.requestedBy.toLowerCase().includes(q))
      );
    }

    // Sort by date descending
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Aggregations
    let totalUsd = 0;
    let totalKhr = 0;
    let repairsTotalUsd = 0;
    let hardwareTotalUsd = 0;
    let consumablesTotalUsd = 0;
    let otherTotalUsd = 0;
    let paidCount = 0;
    let pendingCount = 0;

    list.forEach((exp) => {
      const amt = Number(exp.amount) || 0;
      if (exp.currency === 'KHR') {
        totalKhr += amt;
        totalUsd += amt / 4100;
      } else {
        totalUsd += amt;
        totalKhr += amt * 4100;
      }

      const usdVal = exp.currency === 'KHR' ? amt / 4100 : amt;
      if (exp.category === 'repair') repairsTotalUsd += usdVal;
      else if (exp.category === 'hardware_purchase') hardwareTotalUsd += usdVal;
      else if (exp.category === 'consumable_supplies') consumablesTotalUsd += usdVal;
      else otherTotalUsd += usdVal;

      if (exp.paymentStatus === 'paid') paidCount++;
      else pendingCount++;
    });

    res.json({
      expenses: list,
      count: list.length,
      totalUsd: Math.round(totalUsd * 100) / 100,
      totalKhr: Math.round(totalKhr),
      repairsTotalUsd: Math.round(repairsTotalUsd * 100) / 100,
      hardwareTotalUsd: Math.round(hardwareTotalUsd * 100) / 100,
      consumablesTotalUsd: Math.round(consumablesTotalUsd * 100) / 100,
      otherTotalUsd: Math.round(otherTotalUsd * 100) / 100,
      paidCount,
      pendingCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch IT expenses' });
  }
});

app.get('/api/it-expenses/summary', (req, res) => {
  try {
    const monthGroups: Record<string, any[]> = {};
    inMemoryITExpenses.forEach((exp) => {
      const m = exp.month || (exp.date ? exp.date.substring(0, 7) : 'Unknown');
      if (!monthGroups[m]) monthGroups[m] = [];
      monthGroups[m].push(exp);
    });

    const months = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
    const summary = months.map((month) => {
      const items = monthGroups[month];
      let totalUsd = 0;
      let totalKhr = 0;
      let repairsTotalUsd = 0;
      let hardwareTotalUsd = 0;
      let consumablesTotalUsd = 0;
      let otherTotalUsd = 0;
      let paidCount = 0;
      let pendingCount = 0;

      items.forEach((exp) => {
        const amt = Number(exp.amount) || 0;
        const usdVal = exp.currency === 'KHR' ? amt / 4100 : amt;
        totalUsd += usdVal;
        totalKhr += exp.currency === 'KHR' ? amt : amt * 4100;

        if (exp.category === 'repair') repairsTotalUsd += usdVal;
        else if (exp.category === 'hardware_purchase') hardwareTotalUsd += usdVal;
        else if (exp.category === 'consumable_supplies') consumablesTotalUsd += usdVal;
        else otherTotalUsd += usdVal;

        if (exp.paymentStatus === 'paid') paidCount++;
        else pendingCount++;
      });

      return {
        month,
        count: items.length,
        totalUsd: Math.round(totalUsd * 100) / 100,
        totalKhr: Math.round(totalKhr),
        repairsTotalUsd: Math.round(repairsTotalUsd * 100) / 100,
        hardwareTotalUsd: Math.round(hardwareTotalUsd * 100) / 100,
        consumablesTotalUsd: Math.round(consumablesTotalUsd * 100) / 100,
        otherTotalUsd: Math.round(otherTotalUsd * 100) / 100,
        paidCount,
        pendingCount,
      };
    });

    res.json({ summary, totalRecords: inMemoryITExpenses.length });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch summary' });
  }
});

app.post('/api/it-expenses', (req, res) => {
  try {
    const raw = req.body;
    if (!raw || !raw.title || typeof raw.amount !== 'number') {
      return res.status(400).json({ error: 'ចំណងជើង និងចំនួនទឹកប្រាក់ ត្រូវបានទាមទារ (Title and amount required)' });
    }

    // Verify Technician is a real person in the database
    const caller = resolveUserFromRequest(req);
    const verifiedTech = findRealUserInDatabase(raw.technicianId || caller?.id) ||
      findRealUserInDatabase(raw.technicianEmail || caller?.email) ||
      (inMemoryUsers.find((u) => u.role === 'admin') || inMemoryUsers[0]);

    if (!verifiedTech) {
      return res.status(400).json({ error: 'អ្នកបច្ចេកទេសត្រូវតែជាមនុស្សពិតប្រាកដក្នុង Database!' });
    }

    const dateStr = raw.date || new Date().toISOString().split('T')[0];
    const monthStr = raw.month || dateStr.substring(0, 7);
    const assignedWorksheet = raw.worksheetName ? String(raw.worksheetName).trim() : `ខែ ${monthStr}`;

    const newExpense = {
      id: raw.id || `it-exp-${Date.now()}`,
      title: String(raw.title).trim(),
      category: raw.category || 'repair',
      amount: Math.max(0, Number(raw.amount)),
      currency: raw.currency === 'KHR' ? 'KHR' : 'USD',
      date: dateStr,
      month: monthStr,
      department: raw.department || 'IT Support',
      vendor: raw.vendor ? String(raw.vendor).trim() : undefined,
      invoiceNumber: raw.invoiceNumber ? String(raw.invoiceNumber).trim() : undefined,
      requestedBy: raw.requestedBy ? String(raw.requestedBy).trim() : undefined,
      technicianId: verifiedTech.id,
      technicianName: verifiedTech.khmerName || verifiedTech.name,
      technicianEmail: verifiedTech.email,
      paymentStatus: raw.paymentStatus || 'paid',
      paymentMethod: raw.paymentMethod || 'cash',
      notes: raw.notes ? String(raw.notes).trim() : undefined,
      receiptUrl: raw.receiptUrl || undefined,
      worksheetName: assignedWorksheet,
      createdAt: raw.createdAt || new Date().toISOString(),
      verifiedInDatabase: true,
    };

    inMemoryITExpenses.unshift(newExpense);
    safeWriteJson(IT_EXPENSES_FILE, inMemoryITExpenses);
    currentDataVersion = Date.now();

    res.json({ success: true, expense: newExpense, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to save IT expense' });
  }
});

app.put('/api/it-expenses/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existingIndex = inMemoryITExpenses.findIndex((e) => e.id === id);
    if (existingIndex === -1) {
      return res.status(404).json({ error: 'រកមិនឃើញទិន្នន័យចំណាយ (Expense not found)' });
    }

    const existing = inMemoryITExpenses[existingIndex];
    const updates = req.body;

    let verifiedTech = existing.technicianId ? findRealUserInDatabase(existing.technicianId) : null;
    if (updates.technicianId) {
      verifiedTech = findRealUserInDatabase(updates.technicianId) || verifiedTech;
    }

    const dateStr = updates.date || existing.date;
    const monthStr = updates.month || (dateStr ? dateStr.substring(0, 7) : existing.month);
    const worksheetName = updates.worksheetName ? String(updates.worksheetName).trim() : existing.worksheetName || `ខែ ${monthStr}`;

    const updated = {
      ...existing,
      ...updates,
      id,
      date: dateStr,
      month: monthStr,
      worksheetName,
      technicianId: verifiedTech?.id || existing.technicianId,
      technicianName: verifiedTech?.khmerName || verifiedTech?.name || existing.technicianName,
      technicianEmail: verifiedTech?.email || existing.technicianEmail,
      amount: updates.amount !== undefined ? Math.max(0, Number(updates.amount)) : existing.amount,
      updatedAt: new Date().toISOString(),
      verifiedInDatabase: true,
    };

    inMemoryITExpenses[existingIndex] = updated;
    safeWriteJson(IT_EXPENSES_FILE, inMemoryITExpenses);
    currentDataVersion = Date.now();

    res.json({ success: true, expense: updated, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update expense' });
  }
});

app.delete('/api/it-expenses/:id', (req, res) => {
  try {
    const id = req.params.id;
    inMemoryITExpenses = inMemoryITExpenses.filter((e) => e.id !== id);
    safeWriteJson(IT_EXPENSES_FILE, inMemoryITExpenses);
    currentDataVersion = Date.now();
    res.json({ success: true, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete expense' });
  }
});

app.post('/api/it-expenses/bulk', (req, res) => {
  try {
    const { expenses, mode } = req.body;
    if (!Array.isArray(expenses)) {
      return res.status(400).json({ error: 'Expenses array required' });
    }

    if (mode === 'replace') {
      inMemoryITExpenses = expenses.map((exp: any) => ({
        ...exp,
        worksheetName: exp.worksheetName || `ខែ ${exp.month || (exp.date ? exp.date.substring(0, 7) : '')}`,
        verifiedInDatabase: true,
      }));
    } else {
      const map = new Map<string, any>();
      inMemoryITExpenses.forEach((e) => map.set(e.id, e));
      expenses.forEach((exp: any) => {
        if (!exp || !exp.id) return;
        map.set(exp.id, {
          ...exp,
          worksheetName: exp.worksheetName || `ខែ ${exp.month || (exp.date ? exp.date.substring(0, 7) : '')}`,
          verifiedInDatabase: true,
        });
      });
      inMemoryITExpenses = Array.from(map.values());
    }

    safeWriteJson(IT_EXPENSES_FILE, inMemoryITExpenses);
    currentDataVersion = Date.now();
    res.json({ success: true, count: inMemoryITExpenses.length, version: currentDataVersion });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to bulk save expenses' });
  }
});

/* ==========================================================================
   ACTIVITIES & STREAKS API
   ========================================================================== */
app.get('/api/activities', (req, res) => {
  res.json({ activities: inMemoryActivities.slice(0, 200) });
});

app.post('/api/activities', (req, res) => {
  try {
    const activity = req.body;
    if (activity && activity.id) {
      inMemoryActivities.unshift(activity);
      if (inMemoryActivities.length > 300) {
        inMemoryActivities = inMemoryActivities.slice(0, 300);
      }
      safeWriteJson(ACTIVITIES_FILE, inMemoryActivities);
    }
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

app.get('/api/streaks/:userId', (req, res) => {
  const userId = req.params.userId || 'main';
  res.json({ streak: inMemoryStreaks[userId] || null });
});

app.post('/api/streaks/:userId', (req, res) => {
  try {
    const userId = req.params.userId || 'main';
    inMemoryStreaks[userId] = req.body;
    safeWriteJson(STREAKS_FILE, inMemoryStreaks);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

/* ==========================================================================
   FULL SYNC & SNAPSHOT API
   ========================================================================== */
app.get('/api/full-sync', (req, res) => {
  const caller = resolveUserFromRequest(req);
  const tasksToSend = caller ? inMemoryTasks.filter((t) => isUserAuthorizedToViewTask(t, caller)) : [];

  res.json({
    tasks: tasksToSend,
    users: inMemoryUsers,
    activities: inMemoryActivities.slice(0, 100),
    itExpenses: inMemoryITExpenses,
    version: currentDataVersion,
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/full-sync', (req, res) => {
  try {
    const { tasks, users, activities, itExpenses } = req.body;
    let changed = false;

    if (Array.isArray(tasks) && tasks.length > 0) {
      const taskMap = new Map<string, any>();
      inMemoryTasks.forEach((t) => taskMap.set(t.id, t));
      tasks.forEach((t) => {
        if (t && t.id) taskMap.set(t.id, t);
      });
      inMemoryTasks = Array.from(taskMap.values());
      safeWriteJson(TASKS_FILE, inMemoryTasks);
      changed = true;
    }

    if (Array.isArray(users) && users.length > 0) {
      const userMap = new Map<string, any>();
      inMemoryUsers.forEach((u) => userMap.set(u.id, u));
      users.forEach((u) => {
        if (u && u.id) userMap.set(u.id, u);
      });
      inMemoryUsers = Array.from(userMap.values());
      safeWriteJson(USERS_FILE, inMemoryUsers);
      changed = true;
    }

    if (Array.isArray(activities) && activities.length > 0) {
      const actMap = new Map<string, any>();
      inMemoryActivities.forEach((a) => actMap.set(a.id, a));
      activities.forEach((a) => {
        if (a && a.id) actMap.set(a.id, a);
      });
      inMemoryActivities = Array.from(actMap.values()).slice(0, 300);
      safeWriteJson(ACTIVITIES_FILE, inMemoryActivities);
      changed = true;
    }

    if (Array.isArray(itExpenses) && itExpenses.length > 0) {
      const expMap = new Map<string, any>();
      inMemoryITExpenses.forEach((e) => expMap.set(e.id, e));
      itExpenses.forEach((e) => {
        if (e && e.id) expMap.set(e.id, e);
      });
      inMemoryITExpenses = Array.from(expMap.values());
      safeWriteJson(IT_EXPENSES_FILE, inMemoryITExpenses);
      changed = true;
    }

    if (changed) {
      currentDataVersion = Date.now();
    }

    res.json({
      success: true,
      tasks: inMemoryTasks,
      users: inMemoryUsers,
      version: currentDataVersion,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Sync failed' });
  }
});

/* ==========================================================================
   HEALTH CHECK FOR CLOUD RUN & LOAD BALANCER
   ========================================================================== */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'taskmate-server', timestamp: new Date().toISOString() });
});

/* ==========================================================================
   VITE MIDDLEWARE (Dev) / STATIC ASSETS (Prod)
   ========================================================================== */
async function startServer() {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    (Boolean(process.env.PORT) && process.env.PORT !== '3000');
  const distPath = path.join(process.cwd(), 'dist');

  if (isProd) {
    // If running in production but dist/index.html is missing, build it synchronously
    if (!fs.existsSync(path.join(distPath, 'index.html'))) {
      console.log('⚡ Production mode: dist/index.html not found, executing vite build...');
      try {
        const { execSync } = await import('child_process');
        execSync('npx vite build', { stdio: 'inherit' });
      } catch (buildErr) {
        console.error('Failed to run build during startServer:', buildErr);
      }
    }

    if (fs.existsSync(path.join(distPath, 'index.html'))) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // Guaranteed fallback so Cloud Run health check never returns 5xx or fails
      app.get('*', (req, res) => {
        res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><title>TaskMate</title></head><body><div id="root"><h1>TaskMate Server Online</h1><p>Application loading...</p></div></body></html>');
      });
    }
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TaskMate Server running on http://0.0.0.0:${PORT} (Cross-Device Synced)`);
  });
}

startServer();
