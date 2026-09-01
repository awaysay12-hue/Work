import React from 'react';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Plus,
  BarChart3,
  Menu,
  CheckSquare,
} from 'lucide-react';
import { ViewFilterPeriod } from '../types';
import { toKhmerNumber } from '../utils/translations';

interface MobileBottomNavProps {
  currentView: ViewFilterPeriod;
  onNavigate: (view: ViewFilterPeriod) => void;
  onOpenNewTask: () => void;
  onOpenMobileMenu: () => void;
  todayCount?: number;
  overdueCount?: number;
  canCreateTask?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenNewTask,
  onOpenMobileMenu,
  todayCount = 0,
  overdueCount = 0,
  canCreateTask = true,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      aria-label="Mobile Navigation"
    >
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* 1. Dashboard (Today) */}
        <button
          onClick={() => onNavigate('today')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            currentView === 'today'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Dashboard"
        >
          <div className="relative">
            <LayoutDashboard className={`w-5 h-5 ${currentView === 'today' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {todayCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                {toKhmerNumber(todayCount)}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Dashboard</span>
        </button>

        {/* 2. All / My Tasks */}
        <button
          onClick={() => onNavigate('all')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            currentView === 'all'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Tasks"
        >
          <div className="relative">
            <CheckSquare className={`w-5 h-5 ${currentView === 'all' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {overdueCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white animate-pulse">
                {toKhmerNumber(overdueCount)}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">កិច្ចការ</span>
        </button>

        {/* 3. Center Floating Action Button (+) */}
        {canCreateTask && (
          <div className="relative -top-4 flex items-center justify-center px-1">
            <button
              onClick={onOpenNewTask}
              id="mobile-fab-add-task"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all border-2 border-white ring-2 ring-indigo-500/20"
              aria-label="Add Task"
              title="បន្ថែមការងារថ្មី"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* 4. Calendar */}
        <button
          onClick={() => onNavigate('calendar')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            currentView === 'calendar'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Calendar"
        >
          <CalendarIcon className={`w-5 h-5 ${currentView === 'calendar' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">ប្រតិទិន</span>
        </button>

        {/* 5. Analytics & More Menu */}
        <button
          onClick={() => onNavigate('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            currentView === 'analytics'
              ? 'text-indigo-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Analytics"
        >
          <BarChart3 className={`w-5 h-5 ${currentView === 'analytics' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">ស្ថិតិ</span>
        </button>

        {/* 6. Mobile Side Menu Toggle */}
        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-slate-800 active:scale-95 transition-all"
          aria-label="More Menu"
        >
          <Menu className="w-5 h-5 stroke-2" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">មីនុយ</span>
        </button>
      </div>
    </nav>
  );
};
