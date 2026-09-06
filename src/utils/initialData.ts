import { Task, DailyStreak } from '../types';

export function getInitialTasks(): Task[] {
  return [];
}

export function getInitialStreak(): DailyStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    totalCompletedAllTime: 0,
    totalFocusMinutesAllTime: 0,
  };
}

