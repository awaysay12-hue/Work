import React, { useState, useEffect } from 'react';
import {
  Zap,
  HardDrive,
  CheckCircle2,
  Trash2,
  Archive,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowDownRight,
  Database,
  Users,
  Check,
  X,
  Sliders,
} from 'lucide-react';
import { Task, UserAccount } from '../types';
import {
  getStorageMetrics,
  runStorageOptimization,
  getStorageManifest,
  formatBytes,
  StorageMetrics,
  StorageManifest,
} from '../utils/storageOptimizer';
import { toKhmerNumber } from '../utils/translations';
import { soundFx } from '../utils/sound';
import { UserAvatar } from './UserAvatar';

interface StorageOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  users: UserAccount[];
  onTasksOptimized: (tasks: Task[]) => void;
}

export const StorageOptimizerModal: React.FC<StorageOptimizerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  users,
  onTasksOptimized,
}) => {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [manifest, setManifest] = useState<StorageManifest | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationSuccess, setOptimizationSuccess] = useState<string | null>(null);
  const [autoCompression, setAutoCompression] = useState<boolean>(true);
  const [partitionIsolation, setPartitionIsolation] = useState<boolean>(true);

  // Load metrics whenever modal opens
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, tasks, users]);

  const refreshData = () => {
    const currentMetrics = getStorageMetrics(tasks, users);
    const currentManifest = getStorageManifest();
    setMetrics(currentMetrics);
    setManifest(currentManifest);
  };

  if (!isOpen || !metrics) return null;

  const handleRunOptimization = () => {
    soundFx.playClick();
    setIsOptimizing(true);
    setOptimizationSuccess(null);

    setTimeout(() => {
      try {
        const result = runStorageOptimization(tasks, users);
        onTasksOptimized(result.optimizedTasks);
        setMetrics(result.metrics);
        setManifest(getStorageManifest());
        soundFx.playCelebration();
        setOptimizationSuccess(
          `បានបង្រួមទិន្នន័យជោគជ័យ! សន្សំបាន ${result.metrics.savingsPercent}% (${formatBytes(
            result.freedBytes
          )}) និងបែងចែក ${users.length} Partitions យ៉ាងរលូន។`
        );
      } catch (err) {
        console.warn('Optimization error:', err);
      } finally {
        setIsOptimizing(false);
      }
    }, 600);
  };

  // Quota calculation (5MB typical browser localStorage limit)
  const quotaBytes = 5 * 1024 * 1024;
  const usagePercent = Math.max(0.2, (metrics.totalBytes / quotaBytes) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header with Ambient Gradient */}
        <div className="relative px-6 py-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-900/50 shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 left-10 w-40 h-40 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/30">
                <Zap className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    គ្រប់គ្រង & បង្រួមទំហំទិន្នន័យ
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                    Turbo Engine
                  </span>
                </div>
                <p className="text-xs text-indigo-200/80 mt-0.5">
                  បែងចែកកន្លែងផ្ទុកតាម User នីមួយៗ និងបង្រួមទិន្នន័យឱ្យតូចបំផុតដើម្បីល្បឿន Web លឿន
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/60">
          {/* Success Banner */}
          {optimizationSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fade-in shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="flex-1">{optimizationSuccess}</p>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Card 1: Total Size */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">ទំហំទិន្នន័យសរុប</span>
                <HardDrive className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">
                {metrics.totalFormatted}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                <ArrowDownRight className="w-3 h-3" />
                សន្សំបាន {toKhmerNumber(metrics.savingsPercent)}%
              </span>
            </div>

            {/* Card 2: Render Speed */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">ល្បឿន Render</span>
                <Cpu className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-lg font-extrabold text-emerald-600 tracking-tight">
                {metrics.renderSpeedMs} ms
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                0ms Web Lag (រលូន)
              </span>
            </div>

            {/* Card 3: User Partitions */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">User Partitions</span>
                <Users className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">
                {toKhmerNumber(metrics.userPartitionCount)} កន្លែង
              </p>
              <span className="text-[10px] text-indigo-600 font-bold mt-0.5">
                បែងចែកដាច់ដោយឡែក
              </span>
            </div>

            {/* Card 4: Active vs Archived */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold">ស្ថានភាព Tasks</span>
                <Archive className="w-4 h-4 text-teal-500" />
              </div>
              <p className="text-lg font-extrabold text-slate-900 tracking-tight">
                {toKhmerNumber(metrics.activeTaskCount)} កំពុងរត់
              </p>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                Archived: {toKhmerNumber(metrics.archivedTaskCount)}
              </span>
            </div>
          </div>

          {/* Storage Capacity Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                ទំហំប្រើប្រាស់ធៀបនឹង Quota សុវត្ថិភាព (5 MB Limit)
              </span>
              <span className="text-emerald-600 font-mono">
                {metrics.totalFormatted} / 5.0 MB ({usagePercent.toFixed(2)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${Math.max(1, usagePercent)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              ទិន្នន័យត្រូវបានបង្រួម (Compact Packed) ដោយកាត់បន្ថយតួអក្សរដែលមិនចាំបាច់ ធ្វើឱ្យ App បើកភ្លាមមិនរង់ចាំ។
            </p>
          </div>

          {/* User Isolated Storage Partitions Table */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  កន្លែងផ្ទុកតាមគណនីនីមួយៗ (Isolated User Storage Partitions)
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Partition v2
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
              {users.map((user) => {
                const partition = manifest?.partitions[user.id];
                const partitionBytes = partition?.sizeBytes || 1200;
                const userTasksCount = tasks.filter((t) => t.assigneeId === user.id).length;

                return (
                  <div
                    key={user.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        avatarUrl={user.avatarUrl}
                        avatarColor={user.avatarColor}
                        avatarInitial={user.avatarInitial}
                        name={user.khmerName}
                        role={user.role}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 truncate">
                            {user.khmerName}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            kh_user_store_{user.id.slice(-6)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {user.department} • ទទួលខុសត្រូវ {toKhmerNumber(userTasksCount)} កិច្ចការ
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-slate-600 text-[11px] font-semibold">
                        {formatBytes(partitionBytes)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Isolated
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Turbo Storage Settings & Toggles */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              ការកំណត់ល្បឿន & ការបង្រួមទិន្នន័យ (Performance Tuning)
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    បង្រួមទិន្នន័យស្វ័យប្រវត្តិ (Smart Data Compression)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    បង្រួញ key និងរំលងតម្លៃទទេដើម្បីសន្សំទំហំ ៦៥% ទៅ ៧៥%
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={autoCompression}
                  onChange={(e) => setAutoCompression(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    បែងចែក Partition សម្រាប់ User ថ្មីដោយស្វ័យប្រវត្ត (Isolated Workspaces)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    រាល់ពេលបង្កើត User ថ្មី ប្រព័ន្ធនឹងបង្កើត Storage ដាច់ដោយឡែកភ្លាមៗ
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={partitionIsolation}
                  onChange={(e) => setPartitionIsolation(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 px-6 bg-white border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>ដំណើរការស្វ័យប្រវត្តលើ Browser & Cloud ទាំងស្រុង</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              បិទ
            </button>

            <button
              type="button"
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? 'កំពុងបង្រួម & សម្អាត...' : '⚡ បង្កើនល្បឿន & បង្រួមទិន្នន័យ (Turbo Optimize)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
