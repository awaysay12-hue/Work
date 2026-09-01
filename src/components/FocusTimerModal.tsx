import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task } from '../types';
import { toKhmerNumber } from '../utils/translations';
import { soundFx } from '../utils/sound';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAddFocusMinutes: (taskId: string, minutes: number) => void;
  onCompleteTask: (task: Task) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  task,
  onAddFocusMinutes,
  onCompleteTask,
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro');
  const [sessionSecondsElapsed, setSessionSecondsElapsed] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize timer on task or mode change
  useEffect(() => {
    if (task && mode === 'pomodoro') {
      const mins = task.estimatedMinutes || 25;
      setSelectedMinutes(mins);
      setTimeLeftSeconds(mins * 60);
    }
  }, [task, mode, isOpen]);

  const setTimerDuration = (mins: number, newMode: 'pomodoro' | 'shortBreak' | 'longBreak') => {
    setIsActive(false);
    setMode(newMode);
    setSelectedMinutes(mins);
    setTimeLeftSeconds(mins * 60);
    setSessionSecondsElapsed(0);
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            soundFx.playTimerAlarm();

            // Fire confetti
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch {
              // Ignore
            }

            // Log time
            if (task && mode === 'pomodoro') {
              onAddFocusMinutes(task.id, selectedMinutes);
            }
            return 0;
          }
          return prev - 1;
        });
        setSessionSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, selectedMinutes, task, mode, onAddFocusMinutes]);

  if (!isOpen || !task) return null;

  const toggleTimer = () => {
    soundFx.playClick();
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeftSeconds(selectedMinutes * 60);
    setSessionSecondsElapsed(0);
  };

  const handleFinishAndSave = () => {
    if (sessionSecondsElapsed >= 60) {
      const minutesSpent = Math.round(sessionSecondsElapsed / 60);
      onAddFocusMinutes(task.id, minutesSpent);
    }
    onClose();
  };

  const handleFinishAndComplete = () => {
    if (sessionSecondsElapsed >= 60) {
      const minutesSpent = Math.round(sessionSecondsElapsed / 60);
      onAddFocusMinutes(task.id, minutesSpent);
    }
    onCompleteTask(task);
    onClose();
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = selectedMinutes * 60;
  const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeftSeconds) / totalDuration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>កម្មវិធីកំណត់ពេលផ្ដោត (Focus Timer)</span>
          </div>
          <button
            onClick={handleFinishAndSave}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Target Task info */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 text-left">
            <span className="text-[10px] font-bold text-indigo-700 uppercase">
              កិច្ចការគោលដៅ
            </span>
            <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
              {task.title}
            </h3>
          </div>

          {/* Mode Selector Presets */}
          <div className="flex items-center justify-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTimerDuration(25, 'pomodoro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'pomodoro'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ផ្ដោត (២៥ នាទី)
            </button>
            <button
              onClick={() => setTimerDuration(5, 'shortBreak')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'shortBreak'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              សម្រាកខ្លី (៥ នាទី)
            </button>
            <button
              onClick={() => setTimerDuration(15, 'longBreak')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'longBreak'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              សម្រាកវែង (១៥ នាទី)
            </button>
          </div>

          {/* Big Countdown Timer Circle */}
          <div className="relative flex items-center justify-center py-4">
            <div className="w-56 h-56 rounded-full border-8 border-slate-100 relative flex items-center justify-center shadow-inner">
              {/* Progress ring fill */}
              <svg className="w-56 h-56 absolute inset-0 -rotate-90">
                <circle
                  cx="112"
                  cy="112"
                  r="100"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  className={
                    mode === 'pomodoro'
                      ? 'text-indigo-600'
                      : mode === 'shortBreak'
                      ? 'text-emerald-500'
                      : 'text-blue-500'
                  }
                  strokeDasharray={2 * Math.PI * 100}
                  strokeDashoffset={2 * Math.PI * 100 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                />
              </svg>

              <div className="z-10 flex flex-col items-center">
                <span className="text-4xl font-extrabold text-slate-900 font-mono">
                  {toKhmerNumber(timeFormatted)}
                </span>
                <span className="text-xs text-slate-500 font-medium mt-1">
                  {isActive ? '⚡ កំពុងដំណើរការ...' : '⏸️ បានផ្អាក'}
                </span>
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={resetTimer}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="កំណត់ឡើងវិញ"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={toggleTimer}
              className={`px-8 py-3.5 rounded-2xl font-bold text-white shadow-lg flex items-center space-x-2 transition-all transform active:scale-95 ${
                isActive
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-5 h-5 fill-white" />
                  <span>ផ្អាក</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>ចាប់ផ្តើមផ្ដោត</span>
                </>
              )}
            </button>

            <button
              onClick={handleFinishAndComplete}
              className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
              title="បញ្ចប់កិច្ចការនេះតែម្តង"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>

          {/* Focus Tips */}
          <p className="text-xs text-slate-500 italic">
            💡 ព័ត៌មានជំនួយ៖ បិទការរំខានផ្សេងៗ និងផ្ដោតតែលើកិច្ចការមួយនេះឱ្យចប់សិន។
          </p>
        </div>
      </div>
    </div>
  );
};
