import React, { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Link2,
  LogOut,
  PlusCircle,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initGoogleAuth,
  signInWithGoogle,
  signOutGoogle,
  createITExpenseSpreadsheet,
  syncExpensesToExistingSheet,
  getSpreadsheetDetails,
  fetchExpensesFromGoogleSheet,
  fetchAllWorksheetsFromGoogleSheet,
  getSampleGoogleSheetExpenses,
  addNewWorksheetToGoogleSheet,
  syncAllWorksheetsToExistingSheet,
  WorksheetOrgMode,
} from '../services/googleSheets';
import { ITExpense, UserAccount } from '../types';
import { toKhmerNumber } from '../utils/translations';
import { soundFx } from '../utils/sound';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  expenses: ITExpense[];
  currentUser?: UserAccount;
  onImportExpenses?: (importedExpenses: ITExpense[], mode?: 'replace' | 'merge') => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  expenses,
  currentUser,
  onImportExpenses,
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tab: 'create' | 'link'
  const [activeTab, setActiveTab] = useState<'create' | 'link'>('create');

  // Creation State
  const defaultSheetTitle = `របាយការណ៍ចំណាយ IT Support - ${selectedMonth}`;
  const [newSheetTitle, setNewSheetTitle] = useState(defaultSheetTitle);
  const [worksheetOrgMode, setWorksheetOrgMode] = useState<WorksheetOrgMode>('by_month');

  // Link Existing State
  const [existingInput, setExistingInput] = useState('');
  const [existingSheetInfo, setExistingSheetInfo] = useState<{ id: string; title: string; sheetNames: string[] } | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState('');
  const [syncMode, setSyncMode] = useState<'overwrite' | 'append'>('overwrite');

  // Saved Linked Sheet for this month
  const storageKey = `it_expense_sheet_${selectedMonth}`;
  const [savedSheet, setSavedSheet] = useState<{ id: string; url: string; title: string; lastSynced?: string } | null>(() => {
    try {
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  // Destructive Overwrite Confirmation State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSyncAction, setPendingSyncAction] = useState<(() => Promise<void>) | null>(null);

  // Initialize Auth listener
  useEffect(() => {
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

  // Update default title if month changes
  useEffect(() => {
    setNewSheetTitle(`របាយការណ៍ចំណាយ IT Support - ${selectedMonth}`);
    try {
      const item = localStorage.getItem(`it_expense_sheet_${selectedMonth}`);
      setSavedSheet(item ? JSON.parse(item) : null);
    } catch {
      setSavedSheet(null);
    }
  }, [selectedMonth]);

  if (!isOpen) return null;

  // Handle Google Sign-In
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
      setAccessToken(res.accessToken);
      setStatusMessage({
        type: 'success',
        text: `បានភ្ជាប់គណនី Google (${res.user.email}) ដោយជោគជ័យ!`,
      });
      soundFx.playCelebration();
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'មិនអាចភ្ជាប់គណនី Google បានទេ សូមព្យាយាមម្តងទៀត។',
      });
      soundFx.playAlert();
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle Sign-Out
  const handleSignOut = async () => {
    try {
      await signOutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      setStatusMessage({ type: 'info', text: 'បានចាកចេញពីគណនី Google រួចរាល់។' });
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  // Extract Sheet ID from URL or Raw ID
  const extractSpreadsheetId = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return trimmed;
  };

  // Check Existing Sheet
  const handleInspectExistingSheet = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'សូមចុះឈ្មោះចូលគណនី Google ជាមុនសិន។' });
      return;
    }
    const id = extractSpreadsheetId(existingInput);
    if (!id) {
      setStatusMessage({ type: 'error', text: 'សូមបញ្ចូល URL ឬ ID នៃ Google Sheet ឱ្យបានត្រឹមត្រូវ។' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const details = await getSpreadsheetDetails(id, accessToken);
      setExistingSheetInfo({
        id,
        title: details.title,
        sheetNames: details.sheetNames,
      });
      setSelectedSheetTab(details.sheetNames[0] || 'Sheet1');
      setStatusMessage({
        type: 'success',
        text: `បានរកឃើញ Google Sheet៖ "${details.title}" (${details.sheetNames.length} tabs)`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'មិនអាចចូលដំណើរការ Google Sheet នេះបានទេ។',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Create & Sync New Sheet
  const handleCreateAndSync = async () => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'សូមចុះឈ្មោះចូលគណនី Google ជាមុនសិន។' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const result = await createITExpenseSpreadsheet(
        newSheetTitle || defaultSheetTitle,
        expenses,
        accessToken,
        worksheetOrgMode
      );

      const savedData = {
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        title: newSheetTitle || defaultSheetTitle,
        lastSynced: new Date().toISOString(),
      };

      setSavedSheet(savedData);
      localStorage.setItem(storageKey, JSON.stringify(savedData));
      localStorage.setItem('it_expense_sheet_active', JSON.stringify(savedData));

      const orgLabel =
        worksheetOrgMode === 'by_month'
          ? 'តាមខែ (By Month)'
          : worksheetOrgMode === 'by_category'
          ? 'តាមប្រភេទ (By Category)'
          : 'សន្លឹកទោល (Single)';

      setStatusMessage({
        type: 'success',
        text: `🎉 បានបង្កើត Google Sheet រៀបចំតាម ${result.sheetNames.length} Worksheets (${orgLabel}) និងបានផ្ទេរទិន្នន័យចំណាយ ${expenses.length} ប្រតិបត្តិការដោយជោគជ័យ!`,
      });
      soundFx.playCelebration();
    } catch (err: any) {
      console.error('Create and sync failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'បរាជ័យក្នុងការបង្កើត Google Sheet។',
      });
      soundFx.playAlert();
    } finally {
      setIsProcessing(false);
    }
  };

  // Fetch all worksheets combined from linked Google Sheet
  const handleFetchAllWorksheetsFromSheet = async (sheetId: string) => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'សូម Sign in ជាមួយគណនី Google ជាមុនសិន។' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const fetched = await fetchAllWorksheetsFromGoogleSheet(
        sheetId,
        accessToken,
        currentUser?.id || 'admin-user',
        currentUser?.khmerName || 'IT Support'
      );

      if (fetched.length === 0) {
        setStatusMessage({
          type: 'info',
          text: 'ពុំទាន់មានជួរទិន្នន័យចំណាយណាត្រូវបានរកឃើញក្នុង Worksheets ទាំងអស់ឡើយ។',
        });
        soundFx.playAlert();
      } else {
        const savedData = {
          id: sheetId,
          url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          title: existingSheetInfo?.title || savedSheet?.title || 'របាយការណ៍ចំណាយ IT Support',
          lastSynced: new Date().toISOString(),
        };
        setSavedSheet(savedData);
        localStorage.setItem(storageKey, JSON.stringify(savedData));
        localStorage.setItem('it_expense_sheet_active', JSON.stringify(savedData));

        if (onImportExpenses) {
          onImportExpenses(fetched, 'merge');
        }
        setStatusMessage({
          type: 'success',
          text: `🎉 បានទាញយកទិន្នន័យពីគ្រប់ Worksheets ទាំងអស់ (${toKhmerNumber(fetched.length)} ប្រតិបត្តិការ) ចូលក្នុងផ្ទាំង IT Support រួចរាល់!`,
        });
        soundFx.playCelebration();
      }
    } catch (err: any) {
      console.error('Fetch all worksheets error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'បរាជ័យក្នុងការទាញយកទិន្នន័យពី Worksheets ទាំងអស់។',
      });
      soundFx.playAlert();
    } finally {
      setIsProcessing(false);
    }
  };

  // Trigger Sync to Existing Sheet (With Mandatory Destructive Confirmation)
  const handleSyncExistingWithConfirmation = () => {
    if (!existingSheetInfo || !accessToken) {
      setStatusMessage({ type: 'error', text: 'សូមផ្ទៀងផ្ទាត់ Google Sheet ជាមុនសិន។' });
      return;
    }

    const action = async () => {
      setIsProcessing(true);
      setStatusMessage(null);
      try {
        await syncExpensesToExistingSheet(
          existingSheetInfo.id,
          selectedSheetTab || 'Sheet1',
          expenses,
          accessToken,
          syncMode
        );

        const savedData = {
          id: existingSheetInfo.id,
          url: `https://docs.google.com/spreadsheets/d/${existingSheetInfo.id}/edit`,
          title: existingSheetInfo.title,
          lastSynced: new Date().toISOString(),
        };
        setSavedSheet(savedData);
        localStorage.setItem(storageKey, JSON.stringify(savedData));

        setStatusMessage({
          type: 'success',
          text: `បានធ្វើសមកាលកម្ម (${syncMode === 'overwrite' ? 'សរសេរជាន់លើ' : 'បន្ថែមបន្ត'}) ទៅ "${existingSheetInfo.title}" ដោយជោគជ័យ!`,
        });
        soundFx.playCelebration();
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'បរាជ័យក្នុងការ sync ទៅ Google Sheet។',
        });
        soundFx.playAlert();
      } finally {
        setIsProcessing(false);
      }
    };

    if (syncMode === 'overwrite') {
      setPendingSyncAction(() => action);
      setShowConfirmModal(true);
    } else {
      action();
    }
  };

  // Reorganize existing Google Sheet into multiple structured worksheets (By Month or By Category)
  const handleReorganizeExistingSheetIntoWorksheets = async (sheetId: string) => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'សូម Sign in ជាមួយគណនី Google ជាមុនសិន។' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await syncAllWorksheetsToExistingSheet(sheetId, expenses, accessToken, worksheetOrgMode);
      setStatusMessage({
        type: 'success',
        text: `🎉 បានរៀបចំ Google Sheet នេះតាម ${res.sheetNames.length} Worksheets និង Sync ទិន្នន័យចំណាយ ${expenses.length} ប្រតិបត្តិការរួចរាល់!`,
      });
      soundFx.playCelebration();
      // Refresh sheet info
      const details = await getSpreadsheetDetails(sheetId, accessToken);
      setExistingSheetInfo({ id: sheetId, title: details.title, sheetNames: details.sheetNames });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'បរាជ័យក្នុងការរៀបចំ Worksheets ក្នុង Google Sheet។',
      });
      soundFx.playAlert();
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Resync to currently saved sheet
  const handleQuickResync = () => {
    if (!savedSheet || !accessToken) return;

    const action = async () => {
      setIsProcessing(true);
      setStatusMessage(null);
      try {
        // Default to first tab or sheet name
        const details = await getSpreadsheetDetails(savedSheet.id, accessToken);
        const tab = details.sheetNames[0] || 'Sheet1';

        await syncExpensesToExistingSheet(
          savedSheet.id,
          tab,
          expenses,
          accessToken,
          'overwrite'
        );

        const updated = {
          ...savedSheet,
          lastSynced: new Date().toISOString(),
        };
        setSavedSheet(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));

        setStatusMessage({
          type: 'success',
          text: `បានធ្វើសមកាលកម្មទិន្នន័យ ${expenses.length} ប្រតិបត្តិការ ទៅកាន់ "${savedSheet.title}" រួចរាល់!`,
        });
        soundFx.playCelebration();
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'បរាជ័យក្នុងការ Resync។',
        });
      } finally {
        setIsProcessing(false);
      }
    };

    setPendingSyncAction(() => action);
    setShowConfirmModal(true);
  };

  // Fetch and display data from linked/existing sheet into IT Support Expense Tracker
  const handleFetchAndDisplayFromSheet = async (sheetId: string, sheetTab?: string) => {
    if (!accessToken) {
      setStatusMessage({ type: 'error', text: 'សូម Sign in ជាមួយគណនី Google ជាមុនសិន។' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);
    try {
      let targetTab = sheetTab;
      if (!targetTab) {
        const details = await getSpreadsheetDetails(sheetId, accessToken);
        targetTab = details.sheetNames[0] || 'Sheet1';
      }

      const fetched = await fetchExpensesFromGoogleSheet(
        sheetId,
        targetTab,
        accessToken,
        currentUser?.id || 'admin-user',
        currentUser?.khmerName || 'IT Support'
      );

      if (fetched.length === 0) {
        setStatusMessage({
          type: 'info',
          text: `Google Sheet tab "${targetTab}" ពុំទាន់មានជួរទិន្នន័យចំណាយណាត្រូវបានរកឃើញឡើយ។`,
        });
        soundFx.playAlert();
      } else {
        const savedData = {
          id: sheetId,
          url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
          title: existingSheetInfo?.title || savedSheet?.title || 'របាយការណ៍ចំណាយ IT Support',
          lastSynced: new Date().toISOString(),
        };
        setSavedSheet(savedData);
        localStorage.setItem(storageKey, JSON.stringify(savedData));
        localStorage.setItem('it_expense_sheet_active', JSON.stringify(savedData));

        if (onImportExpenses) {
          onImportExpenses(fetched, 'merge');
        }
        setStatusMessage({
          type: 'success',
          text: `🎉 បានទាញយក និងបង្ហាញទិន្នន័យចំណាយ ${toKhmerNumber(fetched.length)} ប្រតិបត្តិការពី Google Sheet ចូលក្នុងផ្ទាំង IT Support រួចរាល់!`,
        });
        soundFx.playCelebration();
      }
    } catch (err: any) {
      console.error('Fetch from sheet failed:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'មិនអាចទាញទិន្នន័យពី Google Sheet បានទេ។',
      });
      soundFx.playAlert();
    } finally {
      setIsProcessing(false);
    }
  };

  // Demo sample loader for testing Google Sheets data display immediately
  const handleLoadSampleDemo = () => {
    const demoItems = getSampleGoogleSheetExpenses(
      currentUser?.id || 'admin-user',
      currentUser?.khmerName || 'IT Support'
    );
    const demoSheetData = {
      id: 'demo-google-sheet-it-expense',
      url: 'https://docs.google.com/spreadsheets/u/0/',
      title: 'Google Sheets គំរូ - ចំណាយ IT Support',
      lastSynced: new Date().toISOString(),
    };
    setSavedSheet(demoSheetData);
    localStorage.setItem(storageKey, JSON.stringify(demoSheetData));
    localStorage.setItem('it_expense_sheet_active', JSON.stringify(demoSheetData));

    if (onImportExpenses) {
      onImportExpenses(demoItems, 'merge');
    }
    setStatusMessage({
      type: 'success',
      text: `🎉 បានទាញយក និងបង្ហាញទិន្នន័យចំណាយគំរូពី Google Sheet (${demoItems.length} ប្រតិបត្តិការ) ចូលក្នុងផ្ទាំង IT Support រួចរាល់!`,
    });
    soundFx.playCelebration();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>ភ្ជាប់កត់ត្រាចំណាយ IT Support ជាមួយ Google Sheets</span>
                <span className="text-[10px] uppercase font-extrabold bg-white/25 px-2 py-0.5 rounded-full">
                  Google Workspace
                </span>
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                ខែ៖ {selectedMonth} • ចំនួនចំណាយសរុប {expenses.length} ប្រតិបត្តិការ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Banner */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              {statusMessage.type === 'success' && (
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  ទៅមើលផ្ទាំង IT Support →
                </button>
              )}
            </div>
          )}

          {/* Google Account Authentication Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                {googleUser ? (
                  <>
                    <img
                      src={
                        googleUser.photoURL ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${googleUser.email}`
                      }
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{googleUser.displayName || 'Google User'}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> បានភ្ជាប់
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{googleUser.email}</div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                      មិនទាន់បានចូលគណនី Google ឡើយ
                    </div>
                    <div className="text-xs text-slate-500">
                      ចុះឈ្មោះចូលគណនី Google របស់អ្នកដើម្បី Sync ទិន្នន័យទៅកាន់ Google Sheets
                    </div>
                  </div>
                )}
              </div>

              <div>
                {googleUser ? (
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>ចាកចេញ (Disconnect)</span>
                  </button>
                ) : (
                  /* Official Google Sign-in Button Design */
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="px-4 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>{isSigningIn ? 'កំពុងភ្ជាប់...' : 'Sign in with Google'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Currently Saved Sheet for this month */}
          {savedSheet && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <span>{savedSheet.title}</span>
                      <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.2 rounded font-medium">
                        ភ្ជាប់រួចរាល់
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Sync ចុងក្រោយ៖{' '}
                      {savedSheet.lastSynced
                        ? new Date(savedSheet.lastSynced).toLocaleString('km-KH')
                        : 'ថ្មីៗ'}
                    </div>
                  </div>
                </div>

                <a
                  href={savedSheet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors shadow-xs"
                >
                  <span>បើកមើល Sheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="pt-2.5 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-800 font-medium">
                  ទិន្នន័យបច្ចុប្បន្នក្នុង App: <b>{expenses.length}</b> កំណត់ត្រា
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFetchAndDisplayFromSheet(savedSheet.id)}
                    disabled={!googleUser || isProcessing}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    title="ទាញយកទិន្នន័យពី Google Sheet នេះ មកបង្ហាញក្នុងផ្ទាំងកត់ត្រាចំណាយ IT Support"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>📥 ទាញយកមកបង្ហាញក្នុងផ្ទាំង IT</span>
                  </button>

                  <button
                    onClick={handleQuickResync}
                    disabled={!googleUser || isProcessing}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Sync ទិន្នន័យពី App ទៅ Google Sheet"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>📤 Sync ទៅ Sheet វិញ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sync Setup Tabs */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveTab('create')}
                className={`pb-2.5 px-3 sm:px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'create'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>ជម្រើសទី ១៖ បង្កើត Google Sheet ថ្មី</span>
              </button>
              <button
                onClick={() => setActiveTab('link')}
                className={`pb-2.5 px-3 sm:px-4 border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeTab === 'link'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>ជម្រើសទី ២៖ ភ្ជាប់ Sheet ដែលមានស្រាប់</span>
              </button>
            </div>

            {/* TAB 1: Create New Sheet */}
            {activeTab === 'create' && (
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះឯកសារ Google Sheet (Spreadsheet Title)
                  </label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="ឧ. របាយការណ៍ចំណាយ IT Support - 2026-09"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ប្រព័ន្ធនឹងបង្កើត Google Sheet ថ្មីក្នុង Google Drive របស់អ្នក រួចរៀបចំ Header ពណ៌បៃតងស្អាត និងបញ្ចូលចំណាយទាំង {expenses.length} ប្រតិបត្តិការ។
                  </p>
                </div>

                {/* Worksheet Organization Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>រៀបចំតាមសន្លឹកកិច្ចការ (Worksheets Organization Structure)</span>
                    <span className="text-[10px] text-emerald-600 font-medium">ជ្រើសរើសទម្រង់ Sheets</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setWorksheetOrgMode('by_month')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        worksheetOrgMode === 'by_month'
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <span>📅 តាមខែ (By Month)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                        បង្កើត Worksheet តាមខែនីមួយៗ + Overview សរុប
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorksheetOrgMode('by_category')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        worksheetOrgMode === 'by_category'
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <span>🏷️ តាមប្រភេទ (Category)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                        Worksheet តាមផ្នែកជួសជុល, សម្ភារៈ, គ្រឿងបន្លាស់...
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setWorksheetOrgMode('single_sheet')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        worksheetOrgMode === 'single_sheet'
                          ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        <span>📄 សន្លឹកទោល (Single)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                        ដាក់ទិន្នន័យទាំងអស់ក្នុង 1 Worksheet តែមួយ
                      </p>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    ព័ត៌មានដែលនឹងត្រូវបញ្ចូលទៅ Google Sheet៖
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-slate-500 pt-1">
                    <div>• កាលបរិច្ឆេទ & លេខវិក្កយបត្រ</div>
                    <div>• ឈ្មោះចំណាយ & ប្រភេទ</div>
                    <div>• តម្លៃជាដុល្លារ ($) & រៀល (៛)</div>
                    <div>• ហាង/អ្នកផ្គត់ផ្គង់ & ដេប៉ាតឺម៉ង់</div>
                    <div>• អ្នកបច្ចេកទេស IT Support</div>
                    <div>• ស្ថានភាព & វិធីសាស្រ្តទូទាត់</div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCreateAndSync}
                    disabled={!googleUser || isProcessing || expenses.length === 0}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <FileSpreadsheet className={`w-4 h-4 ${isProcessing ? 'animate-bounce' : ''}`} />
                    <span>
                      {isProcessing
                        ? 'កំពុងបង្កើត និង Sync ទៅ Google Sheet...'
                        : `បង្កើត & Sync ចំណាយ (${expenses.length}) ទៅ Google Sheet`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {!googleUser && (
                    <p className="text-center text-[11px] text-amber-600 font-medium mt-1.5">
                      * សូម Sign in with Google ខាងលើជាមុនសិន ដើម្បីអនុវត្ត
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Link Existing Sheet */}
            {activeTab === 'link' && (
              <div className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    តំណភ្ជាប់ (URL) ឬ Spreadsheet ID នៃ Google Sheet
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={existingInput}
                      onChange={(e) => setExistingInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XR..."
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                    <button
                      onClick={handleInspectExistingSheet}
                      disabled={!googleUser || isProcessing || !existingInput.trim()}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isProcessing ? 'កំពុងត្រួតពិនិត្យ...' : 'ស្វែងរក'}
                    </button>
                  </div>
                </div>

                {existingSheetInfo && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-800">
                        សន្លឹកកិច្ចការ៖ <span className="text-emerald-700 font-extrabold">{existingSheetInfo.title}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {existingSheetInfo.sheetNames.length} Worksheets
                      </span>
                    </div>

                    {/* Interactive Worksheets Tabs preview */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-600">
                        បញ្ជី Worksheets ក្នុង Sheet នេះ (ចុចជ្រើសរើស Tab)៖
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
                        {existingSheetInfo.sheetNames.map((name) => {
                          const isSelected = (selectedSheetTab || existingSheetInfo.sheetNames[0]) === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setSelectedSheetTab(name)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>{name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Tab ដែលបានជ្រើស
                        </label>
                        <select
                          value={selectedSheetTab}
                          onChange={(e) => setSelectedSheetTab(e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        >
                          {existingSheetInfo.sheetNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          របៀប Sync (Sync Mode)
                        </label>
                        <select
                          value={syncMode}
                          onChange={(e) => setSyncMode(e.target.value as 'overwrite' | 'append')}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        >
                          <option value="overwrite">សរសេរជាន់លើទាំងអស់ (Overwrite all)</option>
                          <option value="append">បន្ថែមបន្តបន្ទាប់ (Append rows)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleFetchAndDisplayFromSheet(existingSheetInfo.id, selectedSheetTab || existingSheetInfo.sheetNames[0])}
                        disabled={isProcessing}
                        className="py-2.5 px-3 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02]"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>📥 ទាញយក Tab «{selectedSheetTab || existingSheetInfo.sheetNames[0]}»</span>
                      </button>

                      <button
                        onClick={handleSyncExistingWithConfirmation}
                        disabled={isProcessing}
                        className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02]"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                        <span>📤 Sync ទិន្នន័យ ({expenses.length}) ទៅ Sheet</span>
                      </button>
                    </div>

                    {/* Multi-Worksheets Sync & Reorganize Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                      <button
                        onClick={() => handleFetchAllWorksheetsFromSheet(existingSheetInfo.id)}
                        disabled={isProcessing}
                        className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        title="ទាញយកទិន្នន័យពីគ្រប់ Worksheets ទាំងអស់ចូលគ្នាក្នុងផ្ទាំង IT Support"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span>📥 ទាញគ្រប់ Worksheets ({existingSheetInfo.sheetNames.length} Tabs)</span>
                      </button>

                      <button
                        onClick={() => handleReorganizeExistingSheetIntoWorksheets(existingSheetInfo.id)}
                        disabled={isProcessing}
                        className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-indigo-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        title="រៀបចំសន្លឹកកិច្ចការទាំងអស់ក្នុង Google Sheet តាមខែ ឬតាមប្រភេទ"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>⚡ រៀបចំតាម Worksheets ស្វ័យប្រវត្ត</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSampleDemo}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="សាកល្បងទាញយកទិន្នន័យគំរូពី Google Sheet ចូលក្នុងផ្ទាំង IT Support"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>សាកល្បងទាញយកទិន្នន័យគំរូ (Demo Template)</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            បិទ (Close)
          </button>
        </div>
      </div>

      {/* Explicit User Confirmation Dialog for Destructive Overwrite Operations */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                បញ្ជាក់ការសរសេរជាន់លើទិន្នន័យ (Confirm Overwrite)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                តើអ្នកពិតជាចង់ធ្វើសមកាលកម្មដោយជំនួស (Overwrite) ទិន្នន័យទាំងអស់ក្នុង Google Sheet នេះមែនទេ? សកម្មភាពនេះនឹងសរសេរជាន់លើទិន្នន័យចាស់ដែលមានស្រាប់ជាមួយទិន្នន័យថ្មីចំនួន <b>{expenses.length} ប្រតិបត្តិការ</b> នៃខែ {selectedMonth}។
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingSyncAction(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                បោះបង់ (Cancel)
              </button>
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  if (pendingSyncAction) {
                    await pendingSyncAction();
                    setPendingSyncAction(null);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                យល់ព្រម Overwrite (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
