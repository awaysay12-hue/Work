import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ITExpense, ITExpenseCategory } from '../types';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google OAuth Provider with Sheets & Drive scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to track sign-in state
let isSigningIn = false;
// Token cached in memory ONLY (never in localStorage/sessionStorage as mandated)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;

// Listen to auth state changes
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ពុំទទួលបាន Access Token ពី Google ឡើយ។');
    }

    cachedAccessToken = credential.accessToken;
    cachedUser = result.user;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out from Google
export const signOutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

// Get current cached access token
export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Get current cached user
export const getCurrentGoogleUser = (): User | null => {
  return cachedUser || auth.currentUser;
};

// Map category key to Khmer label
const categoryKhmerMap: Record<string, string> = {
  repair: 'ការជួសជុល',
  hardware_purchase: 'ទិញសម្ភារៈ/គ្រឿងបន្លាស់',
  consumable_supplies: 'សម្ភារៈប្រើប្រាស់ (ទឹកថ្នាំ/ខ្សែកាប)',
  other: 'ផ្សេងៗ',
};

const paymentMethodMap: Record<string, string> = {
  cash: 'សាច់ប្រាក់សុទ្ធ (Cash)',
  aba_khqr: 'ABA / KHQR',
  bank_transfer: 'ផ្ទេរតាមធនាគារ',
  company_card: 'កាតក្រុមហ៊ុន',
  invoice_later: 'ជំពាក់សិន / Invoice',
};

// Headers for Google Sheet
const SHEET_HEADERS = [
  'កាលបរិច្ឆេទ (Date)',
  'លេខវិក្កយបត្រ (Invoice #)',
  'ចំណងជើងចំណាយ (Title)',
  'ប្រភេទ (Category)',
  'ផ្នែក/ដេប៉ាតឺម៉ង់ (Department)',
  'ហាង/អ្នកផ្គត់ផ្គង់ (Vendor)',
  'តម្លៃជាដុល្លារ ($)',
  'តម្លៃជារៀល (៛)',
  'ស្ថានភាពទូទាត់ (Payment Status)',
  'វិធីសាស្រ្តទូទាត់ (Payment Method)',
  'អ្នកបច្ចេកទេស IT (Technician)',
  'កំណត់ចំណាំ (Notes)',
];

/**
 * Format expenses into rows for Google Sheets
 */
export function formatExpensesForSheet(expenses: ITExpense[]): (string | number)[][] {
  return expenses.map((exp) => {
    const amountUsd = exp.currency === 'USD' ? exp.amount : Math.round((exp.amount / 4100) * 100) / 100;
    const amountRiel = exp.currency === 'USD' ? Math.round(exp.amount * 4100) : exp.amount;
    return [
      exp.date,
      exp.invoiceNumber || '',
      exp.title,
      categoryKhmerMap[exp.category] || exp.category,
      exp.department || 'IT Support',
      exp.vendor || '',
      amountUsd,
      amountRiel,
      exp.paymentStatus === 'paid' ? 'បានទូទាត់រួចរាល់' : 'រង់ចាំទូទាត់',
      paymentMethodMap[exp.paymentMethod] || exp.paymentMethod,
      exp.technicianName || '',
      exp.notes || '',
    ];
  });
}

export type WorksheetOrgMode = 'by_month' | 'by_category' | 'single_sheet';

/**
 * Create a new Google Spreadsheet for IT Support Expenses, with flexible Worksheets organization
 */
export async function createITExpenseSpreadsheet(
  title: string,
  expenses: ITExpense[],
  token: string,
  worksheetOrgMode: WorksheetOrgMode = 'by_month'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetNames: string[] }> {
  // Determine Worksheets to generate based on worksheetOrgMode
  const sheetsPayload: Array<{ properties: { title: string; gridProperties?: { frozenRowCount: number } } }> = [];

  // Month list
  const distinctMonths = Array.from(
    new Set(expenses.map((e) => e.month || (e.date ? e.date.substring(0, 7) : '')))
  ).filter(Boolean).sort((a, b) => b.localeCompare(a));

  if (distinctMonths.length === 0) {
    const now = new Date();
    distinctMonths.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }

  // Category list
  const distinctCategories: ITExpenseCategory[] = [
    'repair',
    'hardware_purchase',
    'consumable_supplies',
    'network_infra',
    'software_license',
    'maintenance',
    'other',
  ];

  if (worksheetOrgMode === 'by_month') {
    // 1. Overview Summary Worksheet
    sheetsPayload.push({
      properties: {
        title: 'សរុបរួម (Overview)',
        gridProperties: { frozenRowCount: 1 },
      },
    });
    // 2. Individual Month Worksheets
    distinctMonths.forEach((m) => {
      sheetsPayload.push({
        properties: {
          title: `ខែ ${m}`,
          gridProperties: { frozenRowCount: 1 },
        },
      });
    });
  } else if (worksheetOrgMode === 'by_category') {
    // 1. Overview Summary Worksheet
    sheetsPayload.push({
      properties: {
        title: 'សរុបរួម (Overview)',
        gridProperties: { frozenRowCount: 1 },
      },
    });
    // 2. Individual Category Worksheets
    distinctCategories.forEach((cat) => {
      const label = categoryKhmerMap[cat] || cat;
      sheetsPayload.push({
        properties: {
          title: label,
          gridProperties: { frozenRowCount: 1 },
        },
      });
    });
  } else {
    // Single sheet
    sheetsPayload.push({
      properties: {
        title: 'កត់ត្រាចំណាយ IT Support',
        gridProperties: { frozenRowCount: 1 },
      },
    });
  }

  // 1. Create spreadsheet with all initial sheets
  const createPayload = {
    properties: {
      title: title,
    },
    sheets: sheetsPayload,
  };

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`បរាជ័យក្នុងការបង្កើត Google Sheet: ${createRes.statusText} (${errText})`);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  const createdSheetNames = (sheetData.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');

  // 2. Populate values per Worksheet
  if (worksheetOrgMode === 'by_month') {
    // A. Populate Overview Worksheet
    const overviewHeaders = [
      'ខែចំណាយ (Month)',
      'ចំនួនប្រតិបត្តិការ (Count)',
      'ការជួសជុល ($)',
      'ទិញសម្ភារៈ/ឧបករណ៍ ($)',
      'គ្រឿងបន្លាស់ ($)',
      'បណ្តាញ Network ($)',
      'ចំណាយផ្សេងៗ ($)',
      'សរុបជាដុល្លារ ($)',
      'សរុបជារៀល (៛)',
    ];

    const overviewRows: any[][] = [];
    let grandUsd = 0;
    let grandKhr = 0;
    let grandCount = 0;

    distinctMonths.forEach((m) => {
      const monthItems = expenses.filter((e) => (e.month || e.date?.substring(0, 7)) === m);
      const mUsd = monthItems.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const mKhr = monthItems.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);
      const repairUsd = monthItems.filter((e) => e.category === 'repair').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const hwUsd = monthItems.filter((e) => e.category === 'hardware_purchase').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const suppUsd = monthItems.filter((e) => e.category === 'consumable_supplies').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const netUsd = monthItems.filter((e) => e.category === 'network_infra').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const otherUsd = monthItems.filter((e) => !['repair', 'hardware_purchase', 'consumable_supplies', 'network_infra'].includes(e.category)).reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);

      grandUsd += mUsd;
      grandKhr += mKhr;
      grandCount += monthItems.length;

      overviewRows.push([
        m,
        monthItems.length,
        Math.round(repairUsd * 100) / 100,
        Math.round(hwUsd * 100) / 100,
        Math.round(suppUsd * 100) / 100,
        Math.round(netUsd * 100) / 100,
        Math.round(otherUsd * 100) / 100,
        Math.round(mUsd * 100) / 100,
        Math.round(mKhr),
      ]);
    });

    overviewRows.push([
      'សរុបរួមទាំងអស់ (Grand Total)',
      grandCount,
      '',
      '',
      '',
      '',
      '',
      Math.round(grandUsd * 100) / 100,
      Math.round(grandKhr),
    ]);

    // Write Overview
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent('សរុបរួម (Overview)')}'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: "'សរុបរួម (Overview)'!A1",
          majorDimension: 'ROWS',
          values: [overviewHeaders, ...overviewRows],
        }),
      }
    );

    // B. Populate Each Monthly Worksheet
    for (const m of distinctMonths) {
      const monthItems = expenses.filter((e) => (e.month || e.date?.substring(0, 7)) === m);
      const monthRows = [SHEET_HEADERS, ...formatExpensesForSheet(monthItems)];
      const mUsd = monthItems.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const mKhr = monthItems.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);

      monthRows.push([
        `សរុបខែ ${m}`,
        '',
        `ចំនួនចំណាយ៖ ${monthItems.length} ប្រតិបត្តិការ`,
        '',
        '',
        '',
        Math.round(mUsd * 100) / 100,
        Math.round(mKhr),
        '',
        '',
        '',
        '',
      ]);

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(`ខែ ${m}`)}'!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `'ខែ ${m}'!A1`,
            majorDimension: 'ROWS',
            values: monthRows,
          }),
        }
      );
    }
  } else if (worksheetOrgMode === 'by_category') {
    // Overview by Category
    const overviewHeaders = [
      'ប្រភេទចំណាយ (Category)',
      'ចំនួនប្រតិបត្តិការ (Count)',
      'សរុបជាដុល្លារ ($)',
      'សរុបជារៀល (៛)',
    ];
    const catOverviewRows: any[][] = [];
    let grandUsd = 0;
    let grandKhr = 0;

    distinctCategories.forEach((cat) => {
      const catItems = expenses.filter((e) => e.category === cat);
      const cUsd = catItems.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const cKhr = catItems.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);
      grandUsd += cUsd;
      grandKhr += cKhr;

      catOverviewRows.push([
        categoryKhmerMap[cat] || cat,
        catItems.length,
        Math.round(cUsd * 100) / 100,
        Math.round(cKhr),
      ]);
    });

    catOverviewRows.push([
      'សរុបរួមទាំងអស់',
      expenses.length,
      Math.round(grandUsd * 100) / 100,
      Math.round(grandKhr),
    ]);

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent('សរុបរួម (Overview)')}'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: "'សរុបរួម (Overview)'!A1",
          majorDimension: 'ROWS',
          values: [overviewHeaders, ...catOverviewRows],
        }),
      }
    );

    // Populate Category Worksheets
    for (const cat of distinctCategories) {
      const catTitle = categoryKhmerMap[cat] || cat;
      const catItems = expenses.filter((e) => e.category === cat);
      const catRows = [SHEET_HEADERS, ...formatExpensesForSheet(catItems)];
      const cUsd = catItems.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const cKhr = catItems.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);

      catRows.push([
        `សរុប ${catTitle}`,
        '',
        `ចំនួនចំណាយ៖ ${catItems.length} ប្រតិបត្តិការ`,
        '',
        '',
        '',
        Math.round(cUsd * 100) / 100,
        Math.round(cKhr),
        '',
        '',
        '',
        '',
      ]);

      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(catTitle)}'!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `'${catTitle}'!A1`,
            majorDimension: 'ROWS',
            values: catRows,
          }),
        }
      );
    }
  } else {
    // Single sheet
    const rows = [SHEET_HEADERS, ...formatExpensesForSheet(expenses)];
    const totalUsd = expenses.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
    const totalKhr = expenses.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);

    rows.push([
      'សរុបទាំងអស់',
      '',
      `ចំនួនចំណាយសរុប៖ ${expenses.length} ប្រតិបត្តិការ`,
      '',
      '',
      '',
      Math.round(totalUsd * 100) / 100,
      Math.round(totalKhr),
      '',
      '',
      '',
      '',
    ]);

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent('កត់ត្រាចំណាយ IT Support')}'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: "'កត់ត្រាចំណាយ IT Support'!A1",
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );
  }

  // 3. Style Header Row for all sheets
  try {
    const formatRequests = (sheetData.sheets || []).map((s: any) => ({
      repeatCell: {
        range: {
          sheetId: s.properties?.sheetId || 0,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.05, green: 0.5, blue: 0.35 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 11,
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: formatRequests }),
    });
  } catch (e) {
    console.warn('Could not format headers:', e);
  }

  return { spreadsheetId, spreadsheetUrl, sheetNames: createdSheetNames };
}

/**
 * Fetch data across ALL worksheets in a Google Spreadsheet
 */
export async function fetchAllWorksheetsFromGoogleSheet(
  spreadsheetId: string,
  token: string,
  currentUserId: string = 'user-admin',
  currentUserName: string = 'IT Support'
): Promise<ITExpense[]> {
  const details = await getSpreadsheetDetails(spreadsheetId, token);
  const allExpenses: ITExpense[] = [];
  const seenSignatures = new Set<string>();

  for (const sheetName of details.sheetNames) {
    // Skip overview/summary sheet to avoid duplicating items
    if (sheetName.includes('Overview') || sheetName.includes('សរុបរួម')) {
      continue;
    }

    try {
      const expenses = await fetchExpensesFromGoogleSheet(
        spreadsheetId,
        sheetName,
        token,
        currentUserId,
        currentUserName
      );

      for (const exp of expenses) {
        const signature = `${exp.date}_${exp.title.trim().toLowerCase()}_${exp.amount}`;
        if (!seenSignatures.has(signature)) {
          seenSignatures.add(signature);
          allExpenses.push(exp);
        }
      }
    } catch (err) {
      console.warn(`Could not read worksheet "${sheetName}":`, err);
    }
  }

  // If no items were found (e.g. single sheet or custom names), try first sheet
  if (allExpenses.length === 0 && details.sheetNames.length > 0) {
    return fetchExpensesFromGoogleSheet(
      spreadsheetId,
      details.sheetNames[0],
      token,
      currentUserId,
      currentUserName
    );
  }

  return allExpenses;
}

/**
 * Fetch spreadsheet metadata to get sheet names
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string,
  token: string
): Promise<{ title: string; sheetNames: string[] }> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('មិនអាចស្វែងរក Google Sheet នេះឃើញទេ។ សូមពិនិត្យមើល Sheet ID ឬសិទ្ធិអនុញ្ញាត។');
  }

  const data = await res.json();
  const title = data.properties?.title || 'Untitled Spreadsheet';
  const sheetNames = (data.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');
  return { title, sheetNames };
}

/**
 * Add a new worksheet (tab) to an existing Google Spreadsheet
 */
export async function addNewWorksheetToGoogleSheet(
  spreadsheetId: string,
  title: string,
  token: string
): Promise<{ sheetId: number; title: string }> {
  const requestBody = {
    requests: [
      {
        addSheet: {
          properties: {
            title,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      },
    ],
  };

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`បរាជ័យក្នុងការបន្ថែម Worksheet ថ្មី: ${errText}`);
  }

  const data = await res.json();
  const reply = data.replies?.[0]?.addSheet;
  return {
    sheetId: reply?.properties?.sheetId || 0,
    title: reply?.properties?.title || title,
  };
}

/**
 * Automatically organize and sync all expenses into multiple worksheets (by month or by category + overview)
 * in an existing Google Spreadsheet!
 */
export async function syncAllWorksheetsToExistingSheet(
  spreadsheetId: string,
  expenses: ITExpense[],
  token: string,
  worksheetOrgMode: WorksheetOrgMode = 'by_month'
): Promise<{ sheetNames: string[] }> {
  const details = await getSpreadsheetDetails(spreadsheetId, token);
  const existingSheetNames = new Set(details.sheetNames);

  const distinctMonths = Array.from(
    new Set(expenses.map((e) => e.month || (e.date ? e.date.substring(0, 7) : '')))
  ).filter(Boolean).sort((a, b) => b.localeCompare(a));

  if (distinctMonths.length === 0) {
    const now = new Date();
    distinctMonths.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }

  const distinctCategories: ITExpenseCategory[] = [
    'repair',
    'hardware_purchase',
    'consumable_supplies',
    'network_infra',
    'software_license',
    'maintenance',
    'other',
  ];

  const targetWorksheets: string[] = [];
  if (worksheetOrgMode === 'by_month') {
    targetWorksheets.push('សរុបរួម (Overview)');
    distinctMonths.forEach((m) => targetWorksheets.push(`ខែ ${m}`));
  } else if (worksheetOrgMode === 'by_category') {
    targetWorksheets.push('សរុបរួម (Overview)');
    distinctCategories.forEach((cat) => targetWorksheets.push(categoryKhmerMap[cat] || cat));
  } else {
    targetWorksheets.push('កត់ត្រាចំណាយ IT Support');
  }

  // Create any missing worksheets
  const missingSheets = targetWorksheets.filter((name) => !existingSheetNames.has(name));
  if (missingSheets.length > 0) {
    try {
      const addRequests = missingSheets.map((sheetTitle) => ({
        addSheet: {
          properties: {
            title: sheetTitle,
            gridProperties: { frozenRowCount: 1 },
          },
        },
      }));

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: addRequests }),
      });
    } catch (e) {
      console.warn('Could not batch add missing sheets:', e);
    }
  }

  // Populate data
  if (worksheetOrgMode === 'by_month') {
    const overviewHeaders = [
      'ខែចំណាយ (Month)',
      'ចំនួនប្រតិបត្តិការ (Count)',
      'ការជួសជុល ($)',
      'ទិញសម្ភារៈ/ឧបករណ៍ ($)',
      'គ្រឿងបន្លាស់ ($)',
      'បណ្តាញ Network ($)',
      'ចំណាយផ្សេងៗ ($)',
      'សរុបជាដុល្លារ ($)',
      'សរុបជារៀល (៛)',
    ];

    const overviewRows: any[][] = [];
    let grandUsd = 0;
    let grandKhr = 0;
    let grandCount = 0;

    distinctMonths.forEach((m) => {
      const monthItems = expenses.filter((e) => (e.month || e.date?.substring(0, 7)) === m);
      const mUsd = monthItems.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const mKhr = monthItems.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);
      const repairUsd = monthItems.filter((e) => e.category === 'repair').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const hwUsd = monthItems.filter((e) => e.category === 'hardware_purchase').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const suppUsd = monthItems.filter((e) => e.category === 'consumable_supplies').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const netUsd = monthItems.filter((e) => e.category === 'network_infra').reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const otherUsd = monthItems.filter((e) => !['repair', 'hardware_purchase', 'consumable_supplies', 'network_infra'].includes(e.category)).reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);

      grandUsd += mUsd;
      grandKhr += mKhr;
      grandCount += monthItems.length;

      overviewRows.push([
        m,
        monthItems.length,
        Math.round(repairUsd * 100) / 100,
        Math.round(hwUsd * 100) / 100,
        Math.round(suppUsd * 100) / 100,
        Math.round(netUsd * 100) / 100,
        Math.round(otherUsd * 100) / 100,
        Math.round(mUsd * 100) / 100,
        Math.round(mKhr),
      ]);
    });

    overviewRows.push([
      'សរុបរួមទាំងអស់ (Grand Total)',
      grandCount,
      '',
      '',
      '',
      '',
      '',
      Math.round(grandUsd * 100) / 100,
      Math.round(grandKhr),
    ]);

    // Clear and write Overview
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent('សរុបរួម (Overview)')}'!A1:Z500:clear`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent('សរុបរួម (Overview)')}'!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ range: "'សរុបរួម (Overview)'!A1", majorDimension: 'ROWS', values: [overviewHeaders, ...overviewRows] }),
        }
      );
    } catch (e) {
      console.warn('Error updating overview sheet:', e);
    }

    // Populate each monthly worksheet
    for (const m of distinctMonths) {
      const tabTitle = `ខែ ${m}`;
      const monthItems = expenses.filter((e) => (e.month || e.date?.substring(0, 7)) === m);
      const rows = [SHEET_HEADERS, ...formatExpensesForSheet(monthItems)];
      const mUsd = monthItems.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const mKhr = monthItems.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);
      rows.push([
        `សរុបខែ ${m}`,
        '',
        `ចំនួនចំណាយ៖ ${monthItems.length} ប្រតិបត្តិការ`,
        '',
        '',
        '',
        Math.round(mUsd * 100) / 100,
        Math.round(mKhr),
        '',
        '',
        '',
        '',
      ]);

      try {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(tabTitle)}'!A1:Z500:clear`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(tabTitle)}'!A1?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ range: `'${tabTitle}'!A1`, majorDimension: 'ROWS', values: rows }),
          }
        );
      } catch (e) {
        console.warn(`Error updating ${tabTitle}:`, e);
      }
    }
  } else if (worksheetOrgMode === 'by_category') {
    // Populate categories...
    for (const cat of distinctCategories) {
      const catTitle = categoryKhmerMap[cat] || cat;
      const catItems = expenses.filter((e) => e.category === cat);
      const rows = [SHEET_HEADERS, ...formatExpensesForSheet(catItems)];
      const cUsd = catItems.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      const cKhr = catItems.reduce((s, e) => s + (e.currency === 'KHR' ? e.amount : e.amount * 4100), 0);
      rows.push([
        `សរុប ${catTitle}`,
        '',
        `ចំនួនចំណាយ៖ ${catItems.length} ប្រតិបត្តិការ`,
        '',
        '',
        '',
        Math.round(cUsd * 100) / 100,
        Math.round(cKhr),
        '',
        '',
        '',
        '',
      ]);

      try {
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(catTitle)}'!A1:Z500:clear`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(catTitle)}'!A1?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ range: `'${catTitle}'!A1`, majorDimension: 'ROWS', values: rows }),
          }
        );
      } catch (e) {
        console.warn(`Error updating ${catTitle}:`, e);
      }
    }
  }

  return { sheetNames: targetWorksheets };
}

/**
 * Sync (overwrite or append) expenses into an existing spreadsheet
 */
export async function syncExpensesToExistingSheet(
  spreadsheetId: string,
  sheetName: string,
  expenses: ITExpense[],
  token: string,
  mode: 'overwrite' | 'append' = 'overwrite'
): Promise<void> {
  const expenseRows = formatExpensesForSheet(expenses);

  if (mode === 'overwrite') {
    // 1. Clear old content
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:Z500:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 2. Put Header + Rows + Summary
    const rows = [SHEET_HEADERS, ...expenseRows];
    const totalUsd = expenses.reduce((sum, e) => {
      const usd = e.currency === 'USD' ? e.amount : e.amount / 4100;
      return sum + usd;
    }, 0);
    const totalKhr = expenses.reduce((sum, e) => {
      const khr = e.currency === 'KHR' ? e.amount : e.amount * 4100;
      return sum + khr;
    }, 0);

    rows.push([
      'សរុបទាំងអស់',
      '',
      `ចំនួនចំណាយសរុប៖ ${expenses.length} ប្រតិបត្តិការ`,
      '',
      '',
      '',
      totalUsd,
      totalKhr,
      '',
      '',
      '',
      '',
    ]);

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `'${sheetName}'!A1`,
          majorDimension: 'ROWS',
          values: rows,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`បរាជ័យក្នុងការ Sync ទៅ Google Sheet: ${err}`);
    }
  } else {
    // Append rows
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `'${sheetName}'!A1`,
          majorDimension: 'ROWS',
          values: expenseRows,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`បរាជ័យក្នុងការ Append ទៅ Google Sheet: ${err}`);
    }
  }
}

// Reverse mappings for reading Google Sheets data back into application
const reverseCategoryMap: Record<string, ITExpenseCategory> = {
  'ការជួសជុល': 'repair',
  'ជួសជុល': 'repair',
  'repair': 'repair',
  'ទិញសម្ភារៈ/គ្រឿងបន្លាស់': 'hardware_purchase',
  'ទិញសម្ភារៈ': 'hardware_purchase',
  'គ្រឿងបន្លាស់': 'hardware_purchase',
  'hardware_purchase': 'hardware_purchase',
  'សម្ភារៈប្រើប្រាស់ (ទឹកថ្នាំ/ខ្សែកាប)': 'consumable_supplies',
  'សម្ភារៈប្រើប្រាស់': 'consumable_supplies',
  'consumable_supplies': 'consumable_supplies',
  'បណ្ដាញ & Network': 'network_infra',
  'network_infra': 'network_infra',
  'software_license': 'software_license',
  'maintenance': 'maintenance',
  'ផ្សេងៗ': 'other',
  'other': 'other',
};

const reversePaymentMethodMap: Record<string, 'cash' | 'aba_khqr' | 'bank_transfer' | 'company_funds'> = {
  'សាច់ប្រាក់សុទ្ធ (Cash)': 'cash',
  'សាច់ប្រាក់សុទ្ធ': 'cash',
  'cash': 'cash',
  'ABA / KHQR': 'aba_khqr',
  'aba_khqr': 'aba_khqr',
  'aba': 'aba_khqr',
  'khqr': 'aba_khqr',
  'ផ្ទេរតាមធនាគារ': 'bank_transfer',
  'bank_transfer': 'bank_transfer',
  'កាតក្រុមហ៊ុន': 'company_funds',
  'company_card': 'company_funds',
  'company_funds': 'company_funds',
  'ជំពាក់សិន / Invoice': 'cash',
};

/**
 * Fetch and parse expenses from an existing Google Sheet
 */
export async function fetchExpensesFromGoogleSheet(
  spreadsheetId: string,
  sheetName: string,
  token: string,
  currentUserId: string = 'user-admin',
  currentUserName: string = 'IT Support'
): Promise<ITExpense[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:Z500`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`មិនអាចទាញទិន្នន័យពី Google Sheet បានទេ: ${err}`);
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length <= 1) {
    return [];
  }

  // Header column index detection
  const headerRow = (rows[0] || []).map((h: any) => String(h || '').toLowerCase().trim());
  let dateIdx = 0;
  let invIdx = 1;
  let titleIdx = 2;
  let catIdx = 3;
  let deptIdx = 4;
  let vendorIdx = 5;
  let usdIdx = 6;
  let khrIdx = 7;
  let statusIdx = 8;
  let methodIdx = 9;
  let techIdx = 10;
  let notesIdx = 11;

  // Dynamically map columns if header row contains recognizable terms
  headerRow.forEach((col: string, idx: number) => {
    if (col.includes('date') || col.includes('កាលបរិច្ឆេទ') || col.includes('ថ្ងៃ')) dateIdx = idx;
    else if (col.includes('invoice') || col.includes('វិក្កយបត្រ') || col.includes('inv')) invIdx = idx;
    else if (col.includes('title') || col.includes('ចំណងជើង') || col.includes('ពិពណ៌នា') || col.includes('description') || col.includes('item')) titleIdx = idx;
    else if (col.includes('category') || col.includes('ប្រភេទ')) catIdx = idx;
    else if (col.includes('department') || col.includes('dept') || col.includes('ផ្នែក') || col.includes('ដេប៉ាតឺម៉ង់')) deptIdx = idx;
    else if (col.includes('vendor') || col.includes('ហាង') || col.includes('ផ្គត់ផ្គង់') || col.includes('shop')) vendorIdx = idx;
    else if (col.includes('ដុល្លារ') || col.includes('usd') || col.includes('$')) usdIdx = idx;
    else if (col.includes('រៀល') || col.includes('khr') || col.includes('៛')) khrIdx = idx;
    else if (col.includes('status') || col.includes('ស្ថានភាព')) statusIdx = idx;
    else if (col.includes('method') || col.includes('វិធីសាស្រ្ត') || col.includes('payment')) methodIdx = idx;
    else if (col.includes('tech') || col.includes('អ្នកបច្ចេកទេស') || col.includes('អ្នកទទួលខុសត្រូវ')) techIdx = idx;
    else if (col.includes('note') || col.includes('កំណត់ចំណាំ')) notesIdx = idx;
  });

  const results: ITExpense[] = [];

  // Loop through rows, skipping header
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const dateCol = String(row[dateIdx] || '').trim();
    // Skip summary / total row
    if (dateCol.includes('សរុប') || dateCol.toLowerCase().includes('total')) {
      continue;
    }

    let title = String(row[titleIdx] || '').trim();
    // If title column is empty, try adjacent text cells
    if (!title) {
      const candidates = [row[0], row[1], row[2], row[3]].map((c) => String(c || '').trim()).filter((c) => c && !c.match(/^\d{4}-\d{2}-\d{2}$/));
      if (candidates.length > 0) {
        title = candidates[0];
      }
    }
    if (!title) continue; // title is required

    const invoiceNumber = String(row[invIdx] || '').trim();
    const rawCat = String(row[catIdx] || '').trim();
    const category: ITExpenseCategory = reverseCategoryMap[rawCat] || 'repair';
    const department = String(row[deptIdx] || 'IT Support').trim() || 'IT Support';
    const vendor = String(row[vendorIdx] || '').trim();

    // Check amounts: USD vs KHR
    let amount = parseFloat(String(row[usdIdx] || '0').replace(/[^0-9.-]+/g, ''));
    let currency: 'USD' | 'KHR' = 'USD';
    if (isNaN(amount) || amount === 0) {
      const khrVal = parseFloat(String(row[khrIdx] || '0').replace(/[^0-9.-]+/g, ''));
      if (!isNaN(khrVal) && khrVal > 0) {
        amount = khrVal;
        currency = 'KHR';
      } else {
        // Try any numeric value in the row if both were zero
        const anyNumber = row.find((val) => typeof val === 'number' || (typeof val === 'string' && /^\$?\d+(\.\d+)?$/.test(val.trim())));
        if (anyNumber) {
          amount = parseFloat(String(anyNumber).replace(/[^0-9.-]+/g, '')) || 0;
        } else {
          amount = 0;
        }
      }
    }

    const rawStatus = String(row[statusIdx] || '').trim();
    const paymentStatus: 'paid' | 'pending' =
      rawStatus.includes('បានទូទាត់') || rawStatus.toLowerCase().includes('paid')
        ? 'paid'
        : 'pending';

    const rawMethod = String(row[methodIdx] || '').trim();
    const paymentMethod = reversePaymentMethodMap[rawMethod] || 'cash';
    const technicianName = String(row[techIdx] || currentUserName).trim() || currentUserName;
    const notes = String(row[notesIdx] || '').trim();

    const validDate = dateCol.match(/^\d{4}-\d{2}-\d{2}$/)
      ? dateCol
      : new Date().toISOString().split('T')[0];
    const month = validDate.slice(0, 7);

    results.push({
      id: `sheet-exp-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      category,
      amount,
      currency,
      date: validDate,
      month,
      department,
      vendor: vendor || undefined,
      invoiceNumber: invoiceNumber || undefined,
      technicianId: currentUserId,
      technicianName,
      paymentStatus,
      paymentMethod,
      notes: notes || undefined,
      worksheetName: sheetName,
      createdAt: new Date().toISOString(),
      verifiedInDatabase: true,
    });
  }

  return results;
}

/**
 * Append a single expense to a specific worksheet in Google Sheets
 */
export async function appendExpenseToWorksheet(
  spreadsheetId: string,
  sheetName: string,
  expense: ITExpense,
  token: string
): Promise<void> {
  try {
    const details = await getSpreadsheetDetails(spreadsheetId, token);
    if (!details.sheetNames.includes(sheetName)) {
      await addNewWorksheetToGoogleSheet(spreadsheetId, sheetName, token);
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `'${sheetName}'!A1`,
            majorDimension: 'ROWS',
            values: [SHEET_HEADERS],
          }),
        }
      );
    }
  } catch (e) {
    console.warn('Could not ensure worksheet before append:', e);
  }

  const row = formatExpensesForSheet([expense]);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodeURIComponent(sheetName)}'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetName}'!A1`,
        majorDimension: 'ROWS',
        values: row,
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`បរាជ័យក្នុងការ append ទិន្នន័យទៅ Worksheet ${sheetName}: ${errText}`);
  }
}

/**
 * Demo sample expenses loaded as if fetched from Google Sheets
 */
export function getSampleGoogleSheetExpenses(
  currentUserId: string = 'user-admin',
  currentUserName: string = 'IT Support'
): ITExpense[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const monthStr = `${y}-${m}`;
  const defaultWs = `ខែ ${monthStr}`;

  return [
    {
      id: `sheet-exp-demo-1`,
      title: 'ជួសជុល Printer Canon 2900 (ដូរ Roller & កៅស៊ូទាញក្រដាស)',
      category: 'repair',
      amount: 25.0,
      currency: 'USD',
      date: `${monthStr}-03`,
      month: monthStr,
      department: 'គណនេយ្យ',
      vendor: 'Chantrea Computer Service',
      invoiceNumber: 'INV-GS-2026-001',
      technicianId: currentUserId,
      technicianName: currentUserName,
      paymentStatus: 'paid',
      paymentMethod: 'aba_khqr',
      notes: 'ទាញយកពី Google Sheet - ជួសជុលរួចរាល់ ដំណើរការធម្មតា',
      worksheetName: defaultWs,
      createdAt: new Date().toISOString(),
      verifiedInDatabase: true,
    },
    {
      id: `sheet-exp-demo-2`,
      title: 'ទិញ RAM 16GB DDR4 Kingston 3200MHz Upgrade PC',
      category: 'hardware_purchase',
      amount: 38.0,
      currency: 'USD',
      date: `${monthStr}-05`,
      month: monthStr,
      department: 'រចនា Design & Media',
      vendor: 'PTC Computer St. 271',
      invoiceNumber: 'INV-GS-2026-002',
      technicianId: currentUserId,
      technicianName: currentUserName,
      paymentStatus: 'paid',
      paymentMethod: 'aba_khqr',
      notes: 'ទាញយកពី Google Sheet - បន្ថែមលើ PC Graphic Designer',
      worksheetName: defaultWs,
      createdAt: new Date().toISOString(),
      verifiedInDatabase: true,
    },
    {
      id: `sheet-exp-demo-3`,
      title: 'ទិញទឹកថ្នាំ HP LaserJet Toner 85A (3 ប្រអប់)',
      category: 'consumable_supplies',
      amount: 45.0,
      currency: 'USD',
      date: `${monthStr}-07`,
      month: monthStr,
      department: 'រដ្ឋបាល & បុគ្គលិក',
      vendor: 'Anana Computer Co., Ltd.',
      invoiceNumber: 'INV-GS-2026-003',
      technicianId: currentUserId,
      technicianName: currentUserName,
      paymentStatus: 'paid',
      paymentMethod: 'bank_transfer',
      notes: 'ទាញយកពី Google Sheet - ស្តុកសម្រាប់ខែថ្មី',
      worksheetName: defaultWs,
      createdAt: new Date().toISOString(),
      verifiedInDatabase: true,
    },
    {
      id: `sheet-exp-demo-4`,
      title: 'ទិញ Switch Gigabit TP-Link 16-Port & ខ្សែ Cat6 100m',
      category: 'network_infra',
      amount: 68.0,
      currency: 'USD',
      date: `${monthStr}-10`,
      month: monthStr,
      department: 'បច្ចេកវិទ្យា & IT',
      vendor: 'Gold Tech Computer',
      invoiceNumber: 'INV-GS-2026-004',
      technicianId: currentUserId,
      technicianName: currentUserName,
      paymentStatus: 'paid',
      paymentMethod: 'aba_khqr',
      notes: 'ទាញយកពី Google Sheet - ដំឡើងបន្ទប់ការិយាល័យថ្មី',
      worksheetName: defaultWs,
      createdAt: new Date().toISOString(),
      verifiedInDatabase: true,
    },
  ];
}

