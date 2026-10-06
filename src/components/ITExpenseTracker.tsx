import React, { useState, useMemo } from 'react';
import {
  Wrench,
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ShieldCheck,
  Edit2,
  Trash2,
  X,
  CreditCard,
  Building2,
  Store,
  FileText,
  Layers,
  Sparkles,
  RotateCcw,
  AlertCircle,
  Cpu,
  Wifi,
  Package,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { GoogleSheetsSyncModal } from './GoogleSheetsSyncModal';
import {
  initGoogleAuth,
  getSpreadsheetDetails,
  fetchExpensesFromGoogleSheet,
  syncExpensesToExistingSheet,
  syncAllWorksheetsToExistingSheet,
  addNewWorksheetToGoogleSheet,
  appendExpenseToWorksheet,
} from '../services/googleSheets';
import { soundFx } from '../utils/sound';
import {
  ITExpense,
  ITExpenseCategory,
  ExpensePaymentStatus,
  ExpensePaymentMethod,
  UserAccount,
} from '../types';
import { toKhmerNumber } from '../utils/translations';

interface ITExpenseTrackerProps {
  expenses: ITExpense[];
  currentUser: UserAccount;
  users: UserAccount[];
  onSaveExpense: (expense: ITExpense) => void;
  onDeleteExpense: (id: string) => void;
  onRefresh?: () => void;
  onImportExpenses?: (importedExpenses: ITExpense[], mode?: 'replace' | 'merge') => void;
}

const CATEGORY_CONFIG: Record<
  ITExpenseCategory,
  { labelKh: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  repair: {
    labelKh: 'ការជួសជុល',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: Wrench,
  },
  hardware_purchase: {
    labelKh: 'ទិញសម្ភារៈ/ឧបករណ៍',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: Cpu,
  },
  consumable_supplies: {
    labelKh: 'គ្រឿងបន្លាស់ & ប្រើប្រាស់',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: Package,
  },
  network_infra: {
    labelKh: 'បណ្តាញ Network & Wi-Fi',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: Wifi,
  },
  software_license: {
    labelKh: 'អាជ្ញាប័ណ្ណ & Tools',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: Layers,
  },
  maintenance: {
    labelKh: 'ថែទាំប្រចាំខែ (Maintenance)',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: RotateCcw,
  },
  other: {
    labelKh: 'ចំណាយផ្សេងៗ',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    icon: ShoppingBag,
  },
};

const PAYMENT_METHODS: Record<ExpensePaymentMethod, string> = {
  aba_khqr: 'ABA / KHQR',
  cash: 'សាច់ប្រាក់សុទ្ធ (Cash)',
  bank_transfer: 'ផ្ទេរប្រាក់ធនាគារ',
  company_funds: 'មូលនិធិក្រុមហ៊ុន',
};

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
];

function formatKhmerMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const mIndex = parseInt(month, 10) - 1;
  const monthName = KHMER_MONTHS[mIndex] || month;
  return `ខែ ${monthName} ឆ្នាំ ${toKhmerNumber(year)}`;
}

const WORKSHEET_TAB_PALETTE = [
  { border: 'border-b-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-700', active: 'border-b-emerald-600', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  { border: 'border-b-blue-500', bar: 'bg-blue-500', text: 'text-blue-700', active: 'border-b-blue-600', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  { border: 'border-b-indigo-500', bar: 'bg-indigo-500', text: 'text-indigo-700', active: 'border-b-indigo-600', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  { border: 'border-b-purple-500', bar: 'bg-purple-500', text: 'text-purple-700', active: 'border-b-purple-600', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
  { border: 'border-b-rose-500', bar: 'bg-rose-500', text: 'text-rose-700', active: 'border-b-rose-600', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
  { border: 'border-b-amber-500', bar: 'bg-amber-500', text: 'text-amber-700', active: 'border-b-amber-600', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  { border: 'border-b-teal-500', bar: 'bg-teal-500', text: 'text-teal-700', active: 'border-b-teal-600', badge: 'bg-teal-50 text-teal-800 border-teal-200' },
  { border: 'border-b-cyan-500', bar: 'bg-cyan-500', text: 'text-cyan-700', active: 'border-b-cyan-600', badge: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
];

export const ITExpenseTracker: React.FC<ITExpenseTrackerProps> = ({
  expenses,
  currentUser,
  users,
  onSaveExpense,
  onDeleteExpense,
  onImportExpenses,
}) => {
  // Current month in YYYY-MM
  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ITExpense | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState(false);

  // Google Sheets Integration State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isFetchingFromSheet, setIsFetchingFromSheet] = useState(false);
  const [sheetToast, setSheetToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Active connected Google Sheet
  const [savedSheet, setSavedSheet] = useState<{ id: string; url: string; title: string; lastSynced?: string } | null>(() => {
    try {
      const active = localStorage.getItem('it_expense_sheet_active');
      if (active) return JSON.parse(active);
      const monthly = localStorage.getItem(`it_expense_sheet_${currentMonthStr}`);
      return monthly ? JSON.parse(monthly) : null;
    } catch {
      return null;
    }
  });

  // Listen to Google Auth changes
  React.useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync savedSheet when month changes or on storage event
  React.useEffect(() => {
    try {
      const active = localStorage.getItem('it_expense_sheet_active');
      if (active) {
        setSavedSheet(JSON.parse(active));
        return;
      }
      const monthly = localStorage.getItem(`it_expense_sheet_${selectedMonth}`);
      if (monthly) setSavedSheet(JSON.parse(monthly));
    } catch {}
  }, [selectedMonth, isGoogleSheetsModalOpen]);

  // Handle imported expenses from Google Sheets and immediately display in tab
  const handleImportAndShowExpenses = (imported: ITExpense[], mode: 'replace' | 'merge' = 'merge') => {
    if (onImportExpenses) {
      onImportExpenses(imported, mode);
    }
    // Update active month to ensure newly imported data is immediately shown
    if (imported.length > 0) {
      const distinctMonths = Array.from(new Set(imported.map((e) => e.month || (e.date ? e.date.substring(0, 7) : '')))).filter(Boolean);
      if (distinctMonths.length === 1 && distinctMonths[0]) {
        setSelectedMonth(distinctMonths[0]);
      } else {
        setSelectedMonth('all');
      }
    }
    // Refresh savedSheet state
    try {
      const active = localStorage.getItem('it_expense_sheet_active');
      if (active) setSavedSheet(JSON.parse(active));
    } catch {}

    setSheetToast({
      type: 'success',
      message: `🎉 បានទាញយក និងបង្ហាញទិន្នន័យចំណាយ ${toKhmerNumber(imported.length)} ប្រតិបត្តិការពី Google Sheet ចូលក្នុងផ្ទាំង IT Support នេះដោយជោគជ័យ!`,
    });
    soundFx.playCelebration();
  };

  // Quick 1-click fetch from connected Google Sheet directly on the tab
  const handleQuickFetchFromGoogleSheet = async () => {
    if (!savedSheet?.id) {
      setIsGoogleSheetsModalOpen(true);
      return;
    }
    if (!accessToken) {
      setIsGoogleSheetsModalOpen(true);
      return;
    }

    setIsFetchingFromSheet(true);
    setSheetToast(null);
    try {
      const details = await getSpreadsheetDetails(savedSheet.id, accessToken);
      const targetTab = details.sheetNames[0] || 'Sheet1';
      const fetched = await fetchExpensesFromGoogleSheet(
        savedSheet.id,
        targetTab,
        accessToken,
        currentUser.id,
        currentUser.khmerName || currentUser.name
      );

      if (fetched.length === 0) {
        setSheetToast({
          type: 'info',
          message: `Google Sheet tab "${targetTab}" ពុំទាន់មានជួរទិន្នន័យចំណាយណាត្រូវបានរកឃើញឡើយ។`,
        });
        soundFx.playAlert();
      } else {
        handleImportAndShowExpenses(fetched, 'merge');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setSheetToast({
        type: 'error',
        message: err.message || 'មិនអាចទាញទិន្នន័យពី Google Sheet បានទេ។ សូមពិនិត្យសិទ្ធិ ឬ Sign in ម្តងទៀត។',
      });
      soundFx.playAlert();
    } finally {
      setIsFetchingFromSheet(false);
    }
  };

  // Worksheets Organization State
  const [worksheetViewMode, setWorksheetViewMode] = useState<'by_month' | 'by_category' | 'live_sheets'>('by_month');
  const [liveSheetTabs, setLiveSheetTabs] = useState<string[]>([]);
  const [activeLiveTab, setActiveLiveTab] = useState<string>('');
  const [isFetchingLiveTab, setIsFetchingLiveTab] = useState(false);
  const [isSyncingWorksheets, setIsSyncingWorksheets] = useState(false);
  const [isNewWorksheetModalOpen, setIsNewWorksheetModalOpen] = useState(false);
  const [newWorksheetInput, setNewWorksheetInput] = useState('');
  const [newWorksheetType, setNewWorksheetType] = useState<'month' | 'category'>('month');
  const [createInGoogleSheetToo, setCreateInGoogleSheetToo] = useState(true);

  // Fetch live sheets tabs when connected
  React.useEffect(() => {
    if (savedSheet?.id && accessToken) {
      getSpreadsheetDetails(savedSheet.id, accessToken)
        .then((res) => {
          const names = res.sheetNames || [];
          setLiveSheetTabs(names);
          if (names.length > 0 && !activeLiveTab) {
            setActiveLiveTab(names[0]);
          }
        })
        .catch((e) => console.warn('Could not read sheet tabs:', e));
    }
  }, [savedSheet?.id, accessToken, isGoogleSheetsModalOpen, activeLiveTab]);

  // Handle 1-click fetch from a specific live sheet tab
  const handleFetchSpecificLiveTab = async (tabName: string) => {
    if (!savedSheet?.id || !accessToken) {
      setIsGoogleSheetsModalOpen(true);
      return;
    }
    setIsFetchingLiveTab(true);
    setSheetToast(null);
    try {
      const fetched = await fetchExpensesFromGoogleSheet(
        savedSheet.id,
        tabName,
        accessToken,
        currentUser.id,
        currentUser.khmerName || currentUser.name
      );
      if (fetched.length === 0) {
        setSheetToast({
          type: 'info',
          message: `Worksheet «${tabName}» ពុំទាន់មានជួរទិន្នន័យចំណាយណាត្រូវបានរកឃើញឡើយ។`,
        });
        soundFx.playAlert();
      } else {
        handleImportAndShowExpenses(fetched, 'merge');
      }
    } catch (err: any) {
      setSheetToast({
        type: 'error',
        message: err.message || `មិនអាចទាញទិន្នន័យពី Worksheet «${tabName}» បានទេ។`,
      });
      soundFx.playAlert();
    } finally {
      setIsFetchingLiveTab(false);
    }
  };

  // Sync all worksheets organized into Google Sheet at once
  const handleSyncAllWorksheets = async () => {
    if (!savedSheet?.id || !accessToken) {
      setIsGoogleSheetsModalOpen(true);
      return;
    }

    setIsSyncingWorksheets(true);
    setSheetToast(null);
    try {
      const mode = worksheetViewMode === 'by_category' ? 'by_category' : 'by_month';
      const result = await syncAllWorksheetsToExistingSheet(
        savedSheet.id,
        expenses,
        accessToken,
        mode
      );

      // Refresh live sheet tabs
      const details = await getSpreadsheetDetails(savedSheet.id, accessToken);
      setLiveSheetTabs(details.sheetNames || []);

      setSheetToast({
        type: 'success',
        message: `🎉 បានរៀបចំ និង Sync គ្រប់ ${result.sheetNames.length} Worksheets ទាំងអស់ (${expenses.length} ចំណាយ) ទៅកាន់ Google Sheet រួចរាល់!`,
      });
      soundFx.playCelebration();
    } catch (err: any) {
      setSheetToast({
        type: 'error',
        message: err.message || 'មិនអាច Sync គ្រប់ Worksheets ទៅ Google Sheet បានទេ។',
      });
      soundFx.playAlert();
    } finally {
      setIsSyncingWorksheets(false);
    }
  };

  // Sync currently active worksheet to Google Sheet
  const handleSyncActiveWorksheet = async () => {
    if (!savedSheet?.id || !accessToken) {
      setIsGoogleSheetsModalOpen(true);
      return;
    }

    setIsSyncingWorksheets(true);
    setSheetToast(null);
    try {
      const tabName = selectedMonth === 'all' ? 'កត់ត្រាចំណាយ IT Support' : `ខែ ${selectedMonth}`;
      await syncExpensesToExistingSheet(
        savedSheet.id,
        tabName,
        monthlyExpenses,
        accessToken,
        'overwrite'
      );

      setSheetToast({
        type: 'success',
        message: `🎉 បាន Sync Worksheet «${tabName}» (${monthlyExpenses.length} ចំណាយ) ទៅកាន់ Google Sheet រួចរាល់!`,
      });
      soundFx.playCelebration();
    } catch (err: any) {
      setSheetToast({
        type: 'error',
        message: err.message || 'មិនអាច Sync Worksheet នេះទៅ Google Sheet បានទេ។',
      });
      soundFx.playAlert();
    } finally {
      setIsSyncingWorksheets(false);
    }
  };

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ITExpenseCategory>('repair');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<'USD' | 'KHR'>('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('IT Support');
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [technicianId, setTechnicianId] = useState(currentUser.id);
  const [paymentStatus, setPaymentStatus] = useState<ExpensePaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('aba_khqr');
  const [notes, setNotes] = useState('');
  const [targetWorksheet, setTargetWorksheet] = useState('');
  const [syncRowToGoogleSheet, setSyncRowToGoogleSheet] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // List of distinct months present in records plus current month
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add(currentMonthStr);
    expenses.forEach((e) => {
      if (e.month) set.add(e.month);
      else if (e.date) set.add(e.date.substring(0, 7));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [expenses, currentMonthStr]);

  // Worksheets breakdown computation
  const monthWorksheets = useMemo(() => {
    return availableMonths.map((m) => {
      const items = expenses.filter((e) => (e.month || e.date?.substring(0, 7)) === m);
      const totalUsd = items.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      return {
        id: m,
        title: formatKhmerMonth(m),
        month: m,
        count: items.length,
        totalUsd,
      };
    });
  }, [availableMonths, expenses]);

  const categoryWorksheets = useMemo(() => {
    return (Object.keys(CATEGORY_CONFIG) as ITExpenseCategory[]).map((catKey) => {
      const cfg = CATEGORY_CONFIG[catKey];
      const items = expenses.filter((e) => {
        return e.category === catKey || e.worksheetName === cfg.labelKh;
      });
      const totalUsd = items.reduce((s, e) => s + (e.currency === 'USD' ? e.amount : e.amount / 4100), 0);
      return {
        id: catKey,
        title: cfg.labelKh,
        icon: cfg.icon,
        color: cfg.color,
        bg: cfg.bg,
        border: cfg.border,
        count: items.length,
        totalUsd,
      };
    });
  }, [expenses, selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let prevY = y;
    let prevM = m - 1;
    if (prevM < 1) {
      prevM = 12;
      prevY -= 1;
    }
    const newMonth = `${prevY}-${String(prevM).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    let nextY = y;
    let nextM = m + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    const newMonth = `${nextY}-${String(nextM).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  // Filter expenses according to active worksheet view and search
  const monthlyExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // 1. Worksheet-based filtering
      if (worksheetViewMode === 'by_month') {
        if (selectedMonth !== 'all') {
          const expMonth = e.month || (e.date ? e.date.substring(0, 7) : '');
          const matchMonth = expMonth === selectedMonth;
          const matchWorksheet = e.worksheetName === `ខែ ${selectedMonth}`;
          if (!matchMonth && !matchWorksheet) return false;
        }
      } else if (worksheetViewMode === 'by_category') {
        if (selectedCategory !== 'all') {
          const catLabel = CATEGORY_CONFIG[selectedCategory as ITExpenseCategory]?.labelKh;
          const matchCat = e.category === selectedCategory;
          const matchWorksheet = e.worksheetName === catLabel;
          if (!matchCat && !matchWorksheet) return false;
        }
      } else if (worksheetViewMode === 'live_sheets') {
        if (activeLiveTab && activeLiveTab !== 'all') {
          const matchWorksheet = e.worksheetName === activeLiveTab;
          const matchNotes = e.notes?.includes(activeLiveTab);
          if (!matchWorksheet && !matchNotes) return false;
        }
      }

      if (selectedPaymentStatus !== 'all' && e.paymentStatus !== selectedPaymentStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(q);
        const matchesVendor = e.vendor?.toLowerCase().includes(q);
        const matchesInvoice = e.invoiceNumber?.toLowerCase().includes(q);
        const matchesDept = e.department?.toLowerCase().includes(q);
        const matchesTech = e.technicianName?.toLowerCase().includes(q);
        const matchesReq = e.requestedBy?.toLowerCase().includes(q);
        const matchesWs = e.worksheetName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVendor && !matchesInvoice && !matchesDept && !matchesTech && !matchesReq && !matchesWs) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, worksheetViewMode, selectedMonth, selectedCategory, activeLiveTab, selectedPaymentStatus, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    let totalUsd = 0;
    let totalKhr = 0;
    let repairUsd = 0;
    let hardwareUsd = 0;
    let suppliesUsd = 0;
    let otherUsd = 0;
    let paidCount = 0;
    let pendingCount = 0;

    monthlyExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      const usd = e.currency === 'KHR' ? amt / 4100 : amt;
      totalUsd += usd;
      totalKhr += e.currency === 'KHR' ? amt : amt * 4100;

      if (e.category === 'repair') repairUsd += usd;
      else if (e.category === 'hardware_purchase') hardwareUsd += usd;
      else if (e.category === 'consumable_supplies') suppliesUsd += usd;
      else otherUsd += usd;

      if (e.paymentStatus === 'paid') paidCount++;
      else pendingCount++;
    });

    return {
      totalUsd: Math.round(totalUsd * 100) / 100,
      totalKhr: Math.round(totalKhr),
      repairUsd: Math.round(repairUsd * 100) / 100,
      hardwareUsd: Math.round(hardwareUsd * 100) / 100,
      suppliesUsd: Math.round(suppliesUsd * 100) / 100,
      otherUsd: Math.round(otherUsd * 100) / 100,
      count: monthlyExpenses.length,
      paidCount,
      pendingCount,
    };
  }, [monthlyExpenses]);

  // Open modal for new expense
  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('repair');
    setAmount('');
    setCurrency('USD');
    setDate(new Date().toISOString().split('T')[0]);
    setDepartment('IT Support');
    setVendor('');
    setInvoiceNumber('');
    setRequestedBy('');
    setTechnicianId(currentUser.id);
    setPaymentStatus('paid');
    setPaymentMethod('aba_khqr');
    setNotes('');
    setFormError(null);

    // Auto-select active worksheet
    let defaultWs = `ខែ ${currentMonthStr}`;
    if (worksheetViewMode === 'by_category' && selectedCategory !== 'all') {
      defaultWs = CATEGORY_CONFIG[selectedCategory as ITExpenseCategory]?.labelKh || selectedCategory;
    } else if (worksheetViewMode === 'live_sheets' && activeLiveTab) {
      defaultWs = activeLiveTab;
    } else if (selectedMonth !== 'all') {
      defaultWs = `ខែ ${selectedMonth}`;
    }
    setTargetWorksheet(defaultWs);
    setSyncRowToGoogleSheet(Boolean(savedSheet?.id && accessToken));
    setIsModalOpen(true);
  };

  // Open modal for editing expense
  const handleOpenEditModal = (exp: ITExpense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setCurrency(exp.currency);
    setDate(exp.date);
    setDepartment(exp.department || 'IT Support');
    setVendor(exp.vendor || '');
    setInvoiceNumber(exp.invoiceNumber || '');
    setRequestedBy(exp.requestedBy || '');
    setTechnicianId(exp.technicianId || currentUser.id);
    setPaymentStatus(exp.paymentStatus || 'paid');
    setPaymentMethod(exp.paymentMethod || 'cash');
    setNotes(exp.notes || '');
    setTargetWorksheet(exp.worksheetName || `ខែ ${exp.month || exp.date.substring(0, 7)}`);
    setSyncRowToGoogleSheet(Boolean(savedSheet?.id && accessToken));
    setFormError(null);
    setIsModalOpen(true);
  };

  // Preset suggestions for quick fill
  const quickPresets = [
    { title: 'ជួសជុលម៉ាស៊ីនព្រីន & ដូរ Roller', cat: 'repair' as ITExpenseCategory, dept: 'គណនេយ្យ', amt: '25' },
    { title: 'ទិញ SSD NVMe 512GB Kingston Upgrade PC', cat: 'hardware_purchase' as ITExpenseCategory, dept: 'រចនា & Design', amt: '35' },
    { title: 'ទិញ RAM 16GB DDR4 3200MHz', cat: 'hardware_purchase' as ITExpenseCategory, dept: 'បច្ចេកវិទ្យា & IT', amt: '40' },
    { title: 'ទិញទឹកថ្នាំម៉ាស៊ីនព្រីន Toner Cartridge', cat: 'consumable_supplies' as ITExpenseCategory, dept: 'រដ្ឋបាល', amt: '18' },
    { title: 'ទិញខ្សែ Network Cat6 & ក្បាល RJ45', cat: 'consumable_supplies' as ITExpenseCategory, dept: 'បច្ចេកវិទ្យា & IT', amt: '30' },
    { title: 'ដូរអេក្រង់កុំព្យូទ័រ Laptop LCD Screen', cat: 'repair' as ITExpenseCategory, dept: 'ទីផ្សារ & Marketing', amt: '65' },
    { title: 'ទិញ Mouse & Keyboard Logitech Wireless', cat: 'hardware_purchase' as ITExpenseCategory, dept: 'គ្រប់គ្រងទូទៅ', amt: '22' },
    { title: 'ទិញដុំ Wi-Fi Router Gigabit Dual-Band', cat: 'network_infra' as ITExpenseCategory, dept: 'បច្ចេកវិទ្យា & IT', amt: '55' },
  ];

  // Submit Expense Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('សូមបញ្ចូលចំណងជើងការចំណាយ (Title required)');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('សូមបញ្ចូលចំនួនទឹកប្រាក់ដែលត្រឹមត្រូវ (Valid amount required)');
      return;
    }

    // Verify technician is a real person in the database
    const assignedTech = users.find((u) => u.id === technicianId && u.status === 'active') ||
      (currentUser.status === 'active' ? currentUser : users.find((u) => u.role === 'admin'));

    if (!assignedTech) {
      setFormError('ការផ្ទៀងផ្ទាត់មិនជោគជ័យ៖ អ្នកបច្ចេកទេសត្រូវតែជាមនុស្សពិតប្រាកដក្នុង Database!');
      return;
    }

    const assignedWorksheet = targetWorksheet.trim() || `ខែ ${date.substring(0, 7)}`;
    const derivedMonth = assignedWorksheet.startsWith('ខែ ')
      ? assignedWorksheet.replace('ខែ ', '').trim()
      : date.substring(0, 7);

    const expenseData: ITExpense = {
      id: editingExpense ? editingExpense.id : `it-exp-${Date.now()}`,
      title: title.trim(),
      category,
      amount: numAmount,
      currency,
      date,
      month: derivedMonth,
      department: department.trim() || 'IT Support',
      vendor: vendor.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      requestedBy: requestedBy.trim() || undefined,
      technicianId: assignedTech.id,
      technicianName: assignedTech.khmerName || assignedTech.name,
      technicianEmail: assignedTech.email,
      paymentStatus,
      paymentMethod,
      notes: notes.trim() || undefined,
      worksheetName: assignedWorksheet,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedInDatabase: true,
    };

    onSaveExpense(expenseData);

    // Auto-sync row directly to connected Google Sheet worksheet
    if (syncRowToGoogleSheet && savedSheet?.id && accessToken) {
      try {
        await appendExpenseToWorksheet(savedSheet.id, assignedWorksheet, expenseData, accessToken);
        setSheetToast({
          type: 'success',
          message: `🎉 បានកត់ត្រា និង append ចូល Worksheet «${assignedWorksheet}» ក្នុង Google Sheet រួចរាល់!`,
        });
        soundFx.playCelebration();
      } catch (err: any) {
        console.warn('Could not auto-sync row to Google Sheet:', err);
        setSheetToast({
          type: 'info',
          message: `បានកត់ត្រាក្នុងប្រព័ន្ធ ប៉ុន្តែ sync ទៅ Sheet បរាជ័យ៖ ${err.message}`,
        });
      }
    } else {
      setSheetToast({
        type: 'success',
        message: `បានកត់ត្រាការចំណាយភ្ជាប់ជាមួយ Worksheet «${assignedWorksheet}» ដោយជោគជ័យ!`,
      });
      soundFx.playCelebration();
    }

    setIsModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'កាលបរិច្ឆេទ (Date)',
      'លេខវិក្កយបត្រ (Invoice)',
      'ចំណងជើង (Description)',
      'ប្រភេទចំណាយ (Category)',
      'ផ្នែកទទួលសេវា (Department)',
      'ហាងផ្គត់ផ្គង់ (Vendor)',
      'ចំនួនទឹកប្រាក់ (Amount)',
      'រូបិយប័ណ្ណ (Currency)',
      'ស្ថានភាពទូទាត់ (Status)',
      'វិធីសាស្រ្តទូទាត់ (Method)',
      'អ្នកបច្ចេកទេស IT (Technician)',
      'កំណត់ចំណាំ (Notes)',
    ];

    const rows = monthlyExpenses.map((exp) => [
      `"${exp.date}"`,
      `"${exp.invoiceNumber || ''}"`,
      `"${exp.title.replace(/"/g, '""')}"`,
      `"${CATEGORY_CONFIG[exp.category]?.labelKh || exp.category}"`,
      `"${exp.department || ''}"`,
      `"${exp.vendor || ''}"`,
      exp.amount,
      exp.currency,
      `"${exp.paymentStatus === 'paid' ? 'បានទូទាត់' : 'រង់ចាំទូទាត់'}"`,
      `"${PAYMENT_METHODS[exp.paymentMethod] || exp.paymentMethod}"`,
      `"${exp.technicianName}"`,
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IT_Support_Expenses_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-200">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  កត់ត្រាការចំណាយ IT Support ប្រចាំខែ
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ផ្ទៀងផ្ទាត់ជាមួយ Database
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                កត់ត្រា និងតាមដានរាល់ការចំណាយលើការជួសជុល (Repair) និងទិញសម្ភារៈ/ឧបករណ៍ (Hardware & Supplies) សម្រាប់ផ្នែក IT Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>កត់ត្រាចំណាយថ្មី +</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="មើល និងបោះពុម្ពរបាយការណ៍"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>បោះពុម្ព</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="ទាញយកជាឯកសារ Excel/CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              title="ភ្ជាប់ និង Sync ទិន្នន័យចំណាយជាមួយ Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>{savedSheet ? 'Google Sheets (បានភ្ជាប់)' : 'ភ្ជាប់ Google Sheets'}</span>
              {savedSheet && (
                <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Month Selector Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Calendar className="w-4 h-4 text-indigo-600" /> ការចំណាយប្រចាំ៖
            </span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                title="ខែមុន"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 min-w-[140px] justify-center">
                <span>{selectedMonth === 'all' ? 'ខែទាំងអស់' : formatKhmerMonth(selectedMonth)}</span>
              </div>

              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                title="ខែបន្ទាប់"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {selectedMonth !== currentMonthStr && (
              <button
                onClick={() => setSelectedMonth(currentMonthStr)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                ខែនេះ (Current)
              </button>
            )}

            <button
              onClick={() => setSelectedMonth(selectedMonth === 'all' ? currentMonthStr : 'all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {selectedMonth === 'all' ? 'កំពុងមើលគ្រប់ខែ' : 'មើលគ្រប់ខែ'}
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span>រកឃើញ៖ <strong className="text-indigo-600">{toKhmerNumber(monthlyExpenses.length)}</strong> ប្រតិបត្តិការ</span>
            <span>•</span>
            <span>បានទូទាត់៖ <strong className="text-emerald-600">{toKhmerNumber(stats.paidCount)}</strong></span>
            {stats.pendingCount > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-600 font-bold">រង់ចាំ៖ {toKhmerNumber(stats.pendingCount)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification for Google Sheets Operations */}
      {sheetToast && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs ${
            sheetToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : sheetToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {sheetToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{sheetToast.message}</span>
          </div>
          <button
            onClick={() => setSheetToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Sheets Live Connected & Display Banner */}
      {savedSheet ? (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-500/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/25 shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-white">
                  ទិន្នន័យបានភ្ជាប់ជាមួយ Google Sheets
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/25 text-white px-2 py-0.5 rounded-full border border-white/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                  ភ្ជាប់ជោគជ័យ
                </span>
                {googleUser && (
                  <span className="text-[11px] text-emerald-100 hidden sm:inline">
                    ({googleUser.email})
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 mt-1 flex items-center gap-2 flex-wrap">
                <span>សន្លឹកកិច្ចការ៖ <strong className="text-white underline">{savedSheet.title}</strong></span>
                <span>•</span>
                <span>ទិន្នន័យក្នុងផ្ទាំងនេះ៖ <strong className="text-white">{toKhmerNumber(monthlyExpenses.length)}</strong> កំណត់ត្រា</span>
                {savedSheet.lastSynced && (
                  <span className="text-emerald-200 text-[11px]">
                    (Sync: {new Date(savedSheet.lastSynced).toLocaleTimeString('km-KH')})
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleQuickFetchFromGoogleSheet}
              disabled={isFetchingFromSheet}
              className="px-4 py-2.5 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              title="ទាញយកទិន្នន័យពី Google Sheet មកបង្ហាញក្នុងផ្ទាំងកត់ត្រាចំណាយ IT Support ភ្លាមៗ"
            >
              <RefreshCw className={`w-4 h-4 ${isFetchingFromSheet ? 'animate-spin text-emerald-600' : 'text-emerald-700'}`} />
              <span>{isFetchingFromSheet ? 'កំពុងទាញយក...' : '📥 ទាញយកមកបង្ហាញក្នុងផ្ទាំងនេះ'}</span>
            </button>

            {savedSheet.url && (
              <a
                href={savedSheet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                title="បើកមើល Google Sheet ក្នុង tab ថ្មី"
              >
                <span>បើកមើល Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="px-3.5 py-2.5 bg-black/20 hover:bg-black/30 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>គ្រប់គ្រង / Sync ឡើងវិញ</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-slate-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
                <span>ភ្ជាប់ជាមួយ Google Sheets</span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ភ្ជាប់ Google Sheets ដើម្បី Sync និងបង្ហាញទិន្នន័យចំណាយ IT Support ភ្លាមៗក្នុងផ្ទាំងនេះ
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGoogleSheetsModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ភ្ជាប់ Google Sheets ឥឡូវនេះ</span>
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Spend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">សរុបការចំណាយប្រចាំខែ</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-slate-900">
              ${stats.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              ≈ {toKhmerNumber(stats.totalKhr.toLocaleString())} រៀល
            </div>
          </div>
        </div>

        {/* 2. Repair & Maintenance */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ការជួសជុល (Repairs)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-rose-600">
              ${stats.repairUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              ជួសជុលកុំព្យូទ័រ & ព្រីនធ័រ
            </div>
          </div>
        </div>

        {/* 3. Hardware & Equipment Purchases */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ទិញសម្ភារៈ/ឧបករណ៍</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-indigo-600">
              ${stats.hardwareUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              RAM, SSD, ម៉ូនីទ័រ, គ្រឿងបន្លាស់
            </div>
          </div>
        </div>

        {/* 4. Consumables & Network */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">គ្រឿងបន្លាស់ & Network</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black text-emerald-600">
              ${(stats.suppliesUsd + stats.otherUsd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">
              ទឹកថ្នាំ, ខ្សែ Network, គ្រឿងប្រើប្រាស់
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ស្វែងរកតាមចំណងជើង, ហាង, វិក្កយបត្រ, ផ្នែក, អ្នកបច្ចេកទេស..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Payment Status filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">ស្ថានភាព៖</span>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">ទាំងអស់ (All Status)</option>
              <option value="paid">បានទូទាត់រួច (Paid)</option>
              <option value="pending">រង់ចាំទូទាត់ (Pending)</option>
              <option value="reimbursed">ទូទាត់សំណងរួច (Reimbursed)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            ទាំងអស់ ({monthlyExpenses.length})
          </button>

          {(Object.keys(CATEGORY_CONFIG) as ITExpenseCategory[]).map((catKey) => {
            const config = CATEGORY_CONFIG[catKey];
            const Icon = config.icon;
            const isSelected = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : `${config.bg} ${config.color} hover:opacity-90 border ${config.border}`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.labelKh}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Worksheets Organization & Tabs (រៀបចំតាម Worksheets) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Worksheets Header Bar */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-emerald-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>រៀបចំតាមសន្លឹកកិច្ចការ (Worksheets)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                  {worksheetViewMode === 'by_month'
                    ? `${monthWorksheets.length} Worksheets ខែ`
                    : worksheetViewMode === 'by_category'
                    ? `${categoryWorksheets.length} Worksheets ប្រភេទ`
                    : `${liveSheetTabs.length} Worksheets Google Drive`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                បែងចែកទិន្នន័យចំណាយតាមសន្លឹកកិច្ចការខែនីមួយៗ តាមប្រភេទ ឬ sync ជាមួយ Google Spreadsheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Switcher */}
            <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-semibold shadow-inner">
              <button
                onClick={() => setWorksheetViewMode('by_month')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  worksheetViewMode === 'by_month'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>តាមខែ (Month)</span>
              </button>

              <button
                onClick={() => setWorksheetViewMode('by_category')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  worksheetViewMode === 'by_category'
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>តាមប្រភេទ (Category)</span>
              </button>

              {savedSheet && (
                <button
                  onClick={() => setWorksheetViewMode('live_sheets')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    worksheetViewMode === 'live_sheets'
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Sheets ({liveSheetTabs.length})</span>
                </button>
              )}
            </div>

            {/* Sync All Worksheets Button */}
            {savedSheet && (
              <button
                onClick={handleSyncAllWorksheets}
                disabled={isSyncingWorksheets}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                title="រៀបចំ និង Sync គ្រប់ Worksheets ទាំងអស់ចូល Google Sheet ក្នុងពេលតែមួយ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWorksheets ? 'animate-spin' : ''}`} />
                <span>{isSyncingWorksheets ? 'កំពុង Sync Worksheets...' : '⚡ Sync គ្រប់ Worksheets'}</span>
              </button>
            )}

            <button
              onClick={() => setIsNewWorksheetModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="បង្កើត Worksheet ថ្មី"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Worksheet ថ្មី</span>
            </button>

            <button
              onClick={() => setIsGoogleSheetsModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="បើកផ្ទាំងគ្រប់គ្រង Google Sheets"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>{savedSheet ? 'គ្រប់គ្រង Sheet' : 'ភ្ជាប់ Google Sheets'}</span>
            </button>
          </div>
        </div>

        {/* Real Worksheet Tabs Bar (Google Sheets / Excel Style with color bars) */}
        <div className="bg-slate-100/90 px-3 pt-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {worksheetViewMode === 'by_month' && (
            <>
              {/* All Months Worksheet */}
              <button
                onClick={() => setSelectedMonth('all')}
                className={`group px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 border-t border-x cursor-pointer ${
                  selectedMonth === 'all'
                    ? 'bg-white text-emerald-800 border-slate-200 border-b-2 border-b-emerald-600 -mb-[1px] shadow-xs'
                    : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent hover:border-slate-300'
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${selectedMonth === 'all' ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>📑 សរុបគ្រប់ខែ (All)</span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-md font-mono text-slate-700 border border-slate-200">
                  {expenses.length}
                </span>
              </button>

              {monthWorksheets.map((ws, idx) => {
                const isActive = selectedMonth === ws.month;
                const palette = WORKSHEET_TAB_PALETTE[idx % WORKSHEET_TAB_PALETTE.length];
                return (
                  <button
                    key={ws.id}
                    onClick={() => setSelectedMonth(ws.month)}
                    className={`group px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 border-t border-x cursor-pointer ${
                      isActive
                        ? `bg-white ${palette.text} border-slate-200 border-b-[3px] ${palette.active} -mb-[1px] shadow-xs`
                        : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${palette.bar} shrink-0`} />
                    <span>{ws.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono border ${palette.badge}`}>
                      ${Math.round(ws.totalUsd)} ({ws.count})
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {worksheetViewMode === 'by_category' && (
            <>
              {/* All Categories Worksheet */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`group px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 border-t border-x cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-white text-indigo-800 border-slate-200 border-b-2 border-b-indigo-600 -mb-[1px] shadow-xs'
                    : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>📑 គ្រប់ប្រភេទចំណាយ</span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-md font-mono text-slate-700">
                  {monthlyExpenses.length}
                </span>
              </button>

              {categoryWorksheets.map((ws, idx) => {
                const Icon = ws.icon;
                const isActive = selectedCategory === ws.id;
                const palette = WORKSHEET_TAB_PALETTE[idx % WORKSHEET_TAB_PALETTE.length];
                return (
                  <button
                    key={ws.id}
                    onClick={() => setSelectedCategory(ws.id)}
                    className={`group px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 border-t border-x cursor-pointer ${
                      isActive
                        ? `bg-white ${palette.text} border-slate-200 border-b-[3px] ${palette.active} -mb-[1px] shadow-xs`
                        : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? palette.text : 'text-slate-400'}`} />
                    <span>{ws.title}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-md font-mono border border-slate-200">
                      ${Math.round(ws.totalUsd)} ({ws.count})
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {worksheetViewMode === 'live_sheets' && (
            <>
              {/* All Live Sheets Option */}
              <button
                onClick={() => setActiveLiveTab('all')}
                className={`group px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 shrink-0 border-t border-x cursor-pointer ${
                  activeLiveTab === 'all'
                    ? 'bg-white text-emerald-800 border-slate-200 border-b-2 border-b-emerald-600 -mb-[1px] shadow-xs'
                    : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent hover:border-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>📑 គ្រប់សន្លឹក (All Tabs)</span>
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-md font-mono text-slate-700">
                  {expenses.length}
                </span>
              </button>

              {liveSheetTabs.length === 0 ? (
                <div className="py-2 text-xs text-slate-500 italic px-2">
                  មិនទាន់បានទាញយកបញ្ជី Worksheets ពី Google Sheets ឡើយ...
                </div>
              ) : (
                liveSheetTabs.map((tabName, idx) => {
                  const isActive = activeLiveTab === tabName;
                  const palette = WORKSHEET_TAB_PALETTE[idx % WORKSHEET_TAB_PALETTE.length];
                  const countInTab = expenses.filter((e) => e.worksheetName === tabName).length;
                  return (
                    <div key={tabName} className="flex items-center shrink-0">
                      <button
                        onClick={() => {
                          setActiveLiveTab(tabName);
                          soundFx.playClick();
                        }}
                        className={`group px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x cursor-pointer ${
                          isActive
                            ? `bg-white ${palette.text} border-slate-200 border-b-[3px] ${palette.active} -mb-[1px] shadow-xs`
                            : 'bg-slate-200/60 hover:bg-slate-200 text-slate-600 border-transparent hover:border-slate-300'
                        }`}
                      >
                        <FileSpreadsheet className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{tabName}</span>
                        {countInTab > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono border ${palette.badge}`}>
                            {countInTab}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFetchSpecificLiveTab(tabName);
                        }}
                        disabled={isFetchingLiveTab}
                        className="px-1.5 py-1 text-[10px] bg-slate-200/80 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 rounded-md transition-colors cursor-pointer mr-1"
                        title={`ទាញយកទិន្នន័យពី ${tabName} ចូលប្រព័ន្ធ`}
                      >
                        📥
                      </button>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* New Tab Button */}
          <button
            onClick={() => setIsNewWorksheetModalOpen(true)}
            className="p-1.5 hover:bg-white text-slate-500 hover:text-emerald-700 hover:border-slate-300 rounded-lg text-xs transition-colors shrink-0 mb-1 cursor-pointer border border-transparent"
            title="បន្ថែម Worksheet ថ្មី"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Active Worksheet Context Bar */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>សន្លឹកកិច្ចការកំពុងបើក៖</span>
              <strong className="text-emerald-800 underline decoration-emerald-400">
                {worksheetViewMode === 'by_month'
                  ? selectedMonth === 'all'
                    ? 'គ្រប់ខែទាំងអស់'
                    : `ខែ ${formatKhmerMonth(selectedMonth)}`
                  : worksheetViewMode === 'by_category'
                  ? selectedCategory === 'all'
                    ? 'គ្រប់ប្រភេទចំណាយ'
                    : CATEGORY_CONFIG[selectedCategory as ITExpenseCategory]?.labelKh || selectedCategory
                  : activeLiveTab === 'all' || !activeLiveTab
                  ? 'គ្រប់សន្លឹកកិច្ចការ Google Sheets'
                  : `Worksheet៖ ${activeLiveTab}`}
              </strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              មាន <b>{toKhmerNumber(monthlyExpenses.length)}</b> កំណត់ត្រា
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-extrabold text-emerald-700">
              ${stats.totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-[11px] font-normal text-slate-500 ml-1">
                (≈ {toKhmerNumber(stats.totalKhr.toLocaleString())} ៛)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {savedSheet && (
              <>
                <button
                  onClick={handleSyncActiveWorksheet}
                  disabled={isSyncingWorksheets}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="Sync តែទិន្នន័យក្នុង Worksheet នេះទៅ Google Sheet"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingWorksheets ? 'animate-spin' : ''}`} />
                  <span>📤 Sync Worksheet នេះ</span>
                </button>

                <button
                  onClick={handleQuickFetchFromGoogleSheet}
                  disabled={isFetchingFromSheet}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  title="ទាញយកទិន្នន័យពី Google Sheet ចូល Worksheet នេះ"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingFromSheet ? 'animate-spin' : ''}`} />
                  <span>📥 ទាញយកមក Worksheet នេះ</span>
                </button>
              </>
            )}

            <button
              onClick={handleOpenCreateModal}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>+ កត់ត្រាក្នុង Worksheet នេះ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expense List Table (Desktop) & Cards (Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {monthlyExpenses.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">មិនទាន់មានទិន្នន័យចំណាយក្នុងខែនេះទេ</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              ចុចលើប៊ូតុង "កត់ត្រាចំណាយថ្មី +" ដើម្បីបញ្ចូលការចំណាយលើការជួសជុល ឬទិញសម្ភារៈ IT Support
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>កត់ត្រាចំណាយឥឡូវនេះ</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">កាលបរិច្ឆេទ & វិក្កយបត្រ</th>
                  <th className="py-3 px-4">បរិយាយការចំណាយ</th>
                  <th className="py-3 px-4">សន្លឹកកិច្ចការ (Worksheet)</th>
                  <th className="py-3 px-4">ប្រភេទ</th>
                  <th className="py-3 px-4">ផ្នែកទទួលសេវា & ហាង</th>
                  <th className="py-3 px-4">អ្នកបច្ចេកទេស IT</th>
                  <th className="py-3 px-4 text-right">ចំនួនទឹកប្រាក់</th>
                  <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                  <th className="py-3 px-4 text-center">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyExpenses.map((exp) => {
                  const catConfig = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG.other;
                  const CatIcon = catConfig.icon;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Date & Invoice */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{exp.date}</span>
                          {(exp.id.startsWith('sheet-exp') || exp.notes?.includes('Google Sheet')) && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-600" />
                              Sheet
                            </span>
                          )}
                        </div>
                        {exp.invoiceNumber ? (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span>{exp.invoiceNumber}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">គ្មានវិក្កយបត្រ</div>
                        )}
                      </td>

                      {/* Title & Notes */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 max-w-xs">{exp.title}</div>
                        {exp.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                            {exp.notes}
                          </p>
                        )}
                        {exp.requestedBy && (
                          <span className="text-[10px] text-indigo-600 font-medium">
                            ស្នើសុំដោយ៖ {exp.requestedBy}
                          </span>
                        )}
                      </td>

                      {/* Linked Worksheet Column */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const ws = exp.worksheetName || `ខែ ${exp.month || exp.date?.substring(0, 7)}`;
                            if (ws.startsWith('ខែ ')) {
                              const m = ws.replace('ខែ ', '').trim();
                              setWorksheetViewMode('by_month');
                              setSelectedMonth(m);
                            } else {
                              const foundCat = (Object.keys(CATEGORY_CONFIG) as ITExpenseCategory[]).find(
                                (k) => CATEGORY_CONFIG[k].labelKh === ws
                              );
                              if (foundCat) {
                                setWorksheetViewMode('by_category');
                                setSelectedCategory(foundCat);
                              } else {
                                setWorksheetViewMode('live_sheets');
                                setActiveLiveTab(ws);
                              }
                            }
                            soundFx.playClick();
                          }}
                          className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                          title="ចុចដើម្បីបើកមើល និងចម្រាញ់តាម Worksheet នេះ"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                          <span>{exp.worksheetName || `ខែ ${exp.month || exp.date?.substring(0, 7)}`}</span>
                        </button>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg border ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catConfig.labelKh}</span>
                        </span>
                      </td>

                      {/* Dept & Vendor */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exp.department}</span>
                        </div>
                        {exp.vendor && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3 text-slate-400" />
                            <span>{exp.vendor}</span>
                          </div>
                        )}
                      </td>

                      {/* Technician */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{exp.technicianName}</span>
                          <span title="មនុស្សពិតក្នុង Database">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">{PAYMENT_METHODS[exp.paymentMethod] || exp.paymentMethod}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm">
                          {exp.currency === 'USD' ? `$${exp.amount.toFixed(2)}` : `${toKhmerNumber(exp.amount.toLocaleString())} ៛`}
                        </div>
                        {exp.currency === 'USD' && (
                          <div className="text-[10px] text-slate-400">
                            ≈ {toKhmerNumber(Math.round(exp.amount * 4100).toLocaleString())} ៛
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {exp.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> បានទូទាត់
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> រង់ចាំទូទាត់
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(exp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="កែប្រែ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`តើអ្នកពិតជាចង់លុបការចំណាយ "${exp.title}" មែនទេ?`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="លុប"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Google Sheets Bottom Worksheets Status Strip */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Worksheet បច្ចុប្បន្ន៖
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
              {worksheetViewMode === 'by_month'
                ? selectedMonth === 'all'
                  ? 'សរុបគ្រប់ខែ (All Months)'
                  : `ខែ ${formatKhmerMonth(selectedMonth)}`
                : worksheetViewMode === 'by_category'
                ? selectedCategory === 'all'
                  ? 'គ្រប់ប្រភេទចំណាយ (All Categories)'
                  : CATEGORY_CONFIG[selectedCategory as ITExpenseCategory]?.labelKh || selectedCategory
                : `Google Sheets: ${selectedMonth}`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
            <span>ចំនួនជួរ៖ <strong className="text-slate-800">{toKhmerNumber(monthlyExpenses.length)}</strong></span>
            <span>•</span>
            <span>ទឹកប្រាក់សរុប៖ <strong className="text-indigo-700">${stats.totalUsd.toFixed(2)}</strong></span>
            <span>•</span>
            <span>(≈ {toKhmerNumber(stats.totalKhr.toLocaleString())} ៛)</span>
          </div>
        </div>
      </div>

      {/* Expense Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingExpense ? 'កែប្រែការកត់ត្រាចំណាយ IT' : 'កត់ត្រាការចំណាយ IT Support ថ្មី'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ព័ត៌មានលម្អិតអំពីការជួសជុល និងការទិញសម្ភារៈ/ឧបករណ៍
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Quick Presets for IT Support */}
              {!editingExpense && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" /> គំរូចំណាយញឹកញាប់ (ចុចដើម្បីបំពេញស្វ័យប្រវត្តិ)៖
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {quickPresets.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setTitle(p.title);
                          setCategory(p.cat);
                          setDepartment(p.dept);
                          setAmount(p.amt);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ចំណងជើងការចំណាយ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ ជួសជុលម៉ាស៊ីនព្រីន Canon 2900, ទិញ SSD 512GB..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  required
                />
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ប្រភេទចំណាយ <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ITExpenseCategory)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    {(Object.keys(CATEGORY_CONFIG) as ITExpenseCategory[]).map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {CATEGORY_CONFIG[catKey].labelKh}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ចំនួនទឹកប្រាក់ <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-bold"
                      required
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'USD' | 'KHR')}
                      className="w-24 px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    >
                      <option value="USD">$ USD</option>
                      <option value="KHR">៛ KHR</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    កាលបរិច្ឆេទ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ផ្នែក/ដេប៉ាតឺម៉ង់ដែលទទួលសេវា
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="ឧទាហរណ៍៖ គណនេយ្យ, រដ្ឋបាល, IT Support..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Vendor & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ហាងផ្គត់ផ្គង់ / Vendor
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="ឧទាហរណ៍៖ PTC Computer, ហាង Chantrea..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    លេខវិក្កយបត្រ (Invoice No.)
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="ឧទាហរណ៍៖ INV-2026-0901"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Technician Selector with Real User Database Verification */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>អ្នកបច្ចេកទេស IT Support (Technician)</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> ផ្ទៀងផ្ទាត់ជាមួយ DB
                    </span>
                  </span>
                </label>
                <select
                  value={technicianId}
                  onChange={(e) => setTechnicianId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      ✓ {u.khmerName || u.name} — {u.department} ({u.role.toUpperCase()}) — មនុស្សពិតប្រាកដ
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    វិធីសាស្រ្តទូទាត់
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    {(Object.keys(PAYMENT_METHODS) as ExpensePaymentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHODS[m]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ស្ថានភាពទូទាត់
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as ExpensePaymentStatus)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="paid">បានទូទាត់រួច (Paid)</option>
                    <option value="pending">រង់ចាំទូទាត់ (Pending)</option>
                    <option value="reimbursed">បានទូទាត់សំណងរួច (Reimbursed)</option>
                  </select>
                </div>
              </div>

              {/* Requester & Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  បុគ្គលិកដែលបានស្នើសុំ (Requested By)
                </label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="ឈ្មោះបុគ្គលិកដែលបានស្នើសុំជួសជុល ឬទិញ..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  កំណត់ចំណាំបន្ថែម (Notes / Description)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="មូលហេតុនៃការខូចខាត លម្អិតអំពីគ្រឿងបន្លាស់ដែលបានផ្លាស់ប្តូរ..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              {/* Linked Worksheet Section (រាល់ទិន្នន័យត្រូវតែភ្ជាប់ជាមួយ Worksheets) */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-emerald-50/60 rounded-2xl border-2 border-indigo-200/90 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>ភ្ជាប់ជាមួយ Worksheet (Linked Worksheet)</span>
                        <span className="text-rose-500">*</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded-md font-bold">
                          ចាំបាច់ភ្ជាប់
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-500">
                        រាល់ទិន្នន័យដែលបញ្ចូលក្នុង «កត់ត្រាចំណាយ IT Support» ត្រូវតែភ្ជាប់ជាមួយសន្លឹកកិច្ចការ
                      </p>
                    </div>
                  </div>

                  {/* Current Selected Worksheet Badge */}
                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-indigo-300 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] text-slate-500 font-medium">សន្លឹកកិច្ចការ៖</span>
                    <strong className="text-xs font-bold text-indigo-700">{targetWorksheet || 'មិនទាន់ជ្រើសរើស'}</strong>
                  </div>
                </div>

                {/* Quick Selection Chips */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                    <span>ជ្រើសរើសសន្លឹកកិច្ចការ (ចុចដើម្បីជ្រើស)៖</span>
                    <span className="text-[10px] text-slate-400 font-normal">អាចជ្រើសតាមខែ តាមប្រភេទ ឬវាយបញ្ចូលផ្ទាល់</span>
                  </div>

                  {/* Mode 1: Month Worksheets Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                      📅 តាមខែ៖
                    </span>
                    {availableMonths.slice(0, 6).map((m) => {
                      const wsName = `ខែ ${m}`;
                      const isSelected = targetWorksheet === wsName;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTargetWorksheet(wsName)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs scale-105'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {wsName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mode 2: Category Worksheets Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                      🏷️ តាមប្រភេទ៖
                    </span>
                    {(Object.keys(CATEGORY_CONFIG) as ITExpenseCategory[]).slice(0, 5).map((catKey) => {
                      const catCfg = CATEGORY_CONFIG[catKey];
                      const wsName = catCfg.labelKh;
                      const isSelected = targetWorksheet === wsName;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setTargetWorksheet(wsName)}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs scale-105'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {wsName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mode 3: Live Google Sheets Tabs (if connected) */}
                  {liveSheetTabs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" /> Google Sheet Tabs៖
                      </span>
                      {liveSheetTabs.map((tab) => {
                        const isSelected = targetWorksheet === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setTargetWorksheet(tab)}
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white hover:bg-emerald-50 text-slate-700 border-emerald-200'
                            }`}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom Worksheet Input */}
                  <div className="pt-1.5 flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">ឬឈ្មោះ Worksheet ផ្ទាល់ខ្លួន៖</span>
                    <input
                      type="text"
                      value={targetWorksheet}
                      onChange={(e) => setTargetWorksheet(e.target.value)}
                      placeholder="ឧទាហរណ៍៖ ខែ 2026-10 ឬ ការជួសជុល..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Auto Sync to Google Sheet Checkbox */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={syncRowToGoogleSheet}
                      onChange={(e) => setSyncRowToGoogleSheet(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Sync & Append ចូល Worksheet «{targetWorksheet || 'សន្លឹកកិច្ចការ'}» ក្នុង Google Sheet ស្វ័យប្រវត្តិ</span>
                      {savedSheet && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                          {savedSheet.title}
                        </span>
                      )}
                    </span>
                  </label>

                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ភ្ជាប់ជាមួយសន្លឹកកិច្ចការរួចរាល់</span>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  {editingExpense ? 'រក្សាទុកការកែប្រែ' : 'កត់ត្រាការចំណាយ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Monthly Summary Sheet */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Header with Print button */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">
                  ទម្រង់របាយការណ៍ចំណាយ IT Support ({formatKhmerMonth(selectedMonth)})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>បោះពុម្ពឥឡូវនេះ (Print)</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800">
              <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">របាយការណ៍ចំណាយ IT SUPPORT ប្រចាំខែ</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    កាលបរិច្ឆេទរបាយការណ៍៖ {formatKhmerMonth(selectedMonth)} • បង្កើតដោយ៖ {currentUser.khmerName || currentUser.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500">សរុបទឹកប្រាក់ខែនេះ</div>
                  <div className="text-2xl font-black text-indigo-600">${stats.totalUsd.toFixed(2)}</div>
                  <div className="text-[11px] text-slate-400">≈ {toKhmerNumber(stats.totalKhr.toLocaleString())} រៀល</div>
                </div>
              </div>

              {/* Summary Breakdown Table */}
              <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-medium">ការជួសជុល (Repairs)៖</span>
                  <div className="text-sm font-bold text-rose-600 mt-0.5">${stats.repairUsd.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">ទិញសម្ភារៈ/ឧបករណ៍៖</span>
                  <div className="text-sm font-bold text-indigo-600 mt-0.5">${stats.hardwareUsd.toFixed(2)}</div>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">គ្រឿងបន្លាស់ & ផ្សេងៗ៖</span>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">
                    ${(stats.suppliesUsd + stats.otherUsd).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Details Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">ល.រ</th>
                      <th className="py-2.5 px-3">កាលបរិច្ឆេទ</th>
                      <th className="py-2.5 px-3">លេខវិក្កយបត្រ</th>
                      <th className="py-2.5 px-3">បរិយាយការចំណាយ</th>
                      <th className="py-2.5 px-3">ប្រភេទ</th>
                      <th className="py-2.5 px-3">ផ្នែក</th>
                      <th className="py-2.5 px-3">ហាងផ្គត់ផ្គង់</th>
                      <th className="py-2.5 px-3 text-right">ទឹកប្រាក់ ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {monthlyExpenses.map((exp, idx) => (
                      <tr key={exp.id}>
                        <td className="py-2 px-3">{idx + 1}</td>
                        <td className="py-2 px-3">{exp.date}</td>
                        <td className="py-2 px-3 font-mono">{exp.invoiceNumber || '-'}</td>
                        <td className="py-2 px-3 font-medium">{exp.title}</td>
                        <td className="py-2 px-3">{CATEGORY_CONFIG[exp.category]?.labelKh || exp.category}</td>
                        <td className="py-2 px-3">{exp.department}</td>
                        <td className="py-2 px-3">{exp.vendor || '-'}</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {exp.currency === 'USD' ? `$${exp.amount.toFixed(2)}` : `${toKhmerNumber(exp.amount.toLocaleString())} ៛`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={7} className="py-2.5 px-3 text-right">
                        សរុបទឹកប្រាក់សរុប (Grand Total)៖
                      </td>
                      <td className="py-2.5 px-3 text-right text-indigo-700 font-black">
                        ${stats.totalUsd.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="font-bold text-slate-700">អ្នករៀបចំ (IT Support)</div>
                  <div className="h-16"></div>
                  <div className="border-t border-slate-300 pt-1 font-semibold">{currentUser.khmerName || currentUser.name}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-700">ប្រធានផ្នែក (IT Manager)</div>
                  <div className="h-16"></div>
                  <div className="border-t border-slate-300 pt-1 font-semibold">ហត្ថលេខា & ឈ្មោះ</div>
                </div>
                <div>
                  <div className="font-bold text-slate-700">គណនេយ្យ / ថ្នាក់ដឹកនាំ</div>
                  <div className="h-16"></div>
                  <div className="border-t border-slate-300 pt-1 font-semibold">ការអនុម័ត</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* New Worksheet Creation Modal */}
      {isNewWorksheetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">បង្កើត Worksheet ថ្មី</h3>
                  <p className="text-[11px] text-slate-500">បន្ថែមសន្លឹកកិច្ចការថ្មីសម្រាប់កត់ត្រាចំណាយ</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewWorksheetModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ប្រភេទ Worksheet ដែលចង់បង្កើត៖
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewWorksheetType('month')}
                    className={`p-2.5 rounded-xl border text-left font-semibold cursor-pointer ${
                      newWorksheetType === 'month'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📅 Worksheet ប្រចាំខែថ្មី
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewWorksheetType('category')}
                    className={`p-2.5 rounded-xl border text-left font-semibold cursor-pointer ${
                      newWorksheetType === 'category'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🏷️ Worksheet តាមប្រភេទ
                  </button>
                </div>
              </div>

              {newWorksheetType === 'month' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ជ្រើសរើសខែសម្រាប់ Worksheet ថ្មី (YYYY-MM)៖
                  </label>
                  <input
                    type="month"
                    defaultValue={currentMonthStr}
                    onChange={(e) => setNewWorksheetInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    ប្រព័ន្ធនឹងបង្កើត Worksheet Tab ថ្មី និងបើកផ្ទាំងសម្រាប់កត់ត្រាចំណាយក្នុងខែនេះ។
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ឈ្មោះ Worksheet ថ្មី៖
                  </label>
                  <input
                    type="text"
                    placeholder="ឧ. បណ្តាញខ្សែកាប & សេវា Cloud"
                    value={newWorksheetInput}
                    onChange={(e) => setNewWorksheetInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Add to Google Spreadsheet Checkbox */}
              {savedSheet && accessToken && (
                <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createInGoogleSheetToo}
                    onChange={(e) => setCreateInGoogleSheetToo(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-bold text-emerald-900">
                    បង្កើត Worksheet Tab នេះក្នុង Google Spreadsheet («{savedSheet.title}») ដោយផ្ទាល់
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setIsNewWorksheetModalOpen(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                បោះបង់
              </button>
              <button
                onClick={async () => {
                  let tabTitle = '';
                  if (newWorksheetType === 'month') {
                    const m = newWorksheetInput || currentMonthStr;
                    tabTitle = `ខែ ${m}`;
                    setSelectedMonth(m);
                    setWorksheetViewMode('by_month');
                  } else {
                    tabTitle = newWorksheetInput.trim() || 'Worksheet ថ្មី';
                    setWorksheetViewMode('by_category');
                  }

                  setTargetWorksheet(tabTitle);

                  // If user also wants to create in Google Sheets
                  if (createInGoogleSheetToo && savedSheet?.id && accessToken && tabTitle) {
                    try {
                      await addNewWorksheetToGoogleSheet(savedSheet.id, tabTitle, accessToken);
                      setLiveSheetTabs((prev) => Array.from(new Set([...prev, tabTitle])));
                    } catch (e: any) {
                      console.warn('Could not add sheet tab to Google Sheets:', e);
                    }
                  }

                  setSheetToast({
                    type: 'success',
                    message: `🎉 បានបង្កើត និងបើកដំណើរការ Worksheet «${tabTitle}» រួចរាល់!`,
                  });
                  setIsNewWorksheetModalOpen(false);
                  soundFx.playCelebration();
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                បង្កើត Worksheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        selectedMonth={selectedMonth}
        expenses={monthlyExpenses}
        currentUser={currentUser}
        onImportExpenses={handleImportAndShowExpenses}
      />
    </div>
  );
};
