import { Task, DailyStreak } from '../types';
import { getTodayDateString, getTomorrowDateString } from './khmerDates';

export function getInitialTasks(): Task[] {
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  return [
    {
      id: 'task-1',
      title: 'ពិនិត្យរបាយការណ៍ និងរៀបចំកិច្ចប្រជុំក្រុមការងារ',
      description: 'ពិភាក្សាអំពីវឌ្ឍនភាពគម្រោង និងកំណត់គោលដៅសម្រាប់សប្តាហ៍ថ្មី។',
      category: 'work',
      priority: 'high',
      dueDate: today,
      dueTime: '09:30',
      reminderTiming: '15m_before',
      completed: true,
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      estimatedMinutes: 45,
      spentMinutes: 40,
      recurring: 'weekdays',
      tags: ['ប្រជុំ', 'របាយការណ៍'],
      subtasks: [
        { id: 'sub-1', title: 'ប្រមូលទិន្នន័យពីក្រុមការងារ', completed: true },
        { id: 'sub-2', title: 'បង្កើតស្លាយបទបង្ហាញខ្លី', completed: true },
        { id: 'sub-3', title: 'ផ្ញើរបៀបវារៈប្រជុំតាមអ៊ីមែល', completed: true },
      ],
    },
    {
      id: 'task-2',
      title: 'រៀន និងស្រាវជ្រាវបច្ចេកវិទ្យាថ្មី (TypeScript & AI)',
      description: 'អានឯកសារបច្ចេកទេស និងអនុវត្តសរសេរកូដជាក់ស្តែងយ៉ាងតិច ១ ម៉ោង។',
      category: 'study',
      priority: 'urgent',
      dueDate: today,
      dueTime: '14:00',
      reminderTiming: 'at_time',
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      estimatedMinutes: 60,
      spentMinutes: 25,
      recurring: 'daily',
      tags: ['សិក្សា', 'កូដ'],
      subtasks: [
        { id: 'sub-4', title: 'អានឯកសារ API Documentation', completed: true },
        { id: 'sub-5', title: 'អនុវត្តបង្កើត Mini-Project', completed: false },
        { id: 'sub-6', title: 'កត់ត្រាចំណុចសំខាន់ៗដែលបានរៀន', completed: false },
      ],
    },
    {
      id: 'task-3',
      title: 'ហាត់ប្រាណ រត់ និងពត់ខ្លួន ៣០ នាទី',
      description: 'រក្សាសុខភាពផ្លូវកាយ និងផ្លូវចិត្តឱ្យស្រស់ថ្លា។',
      category: 'health',
      priority: 'medium',
      dueDate: today,
      dueTime: '17:30',
      reminderTiming: '30m_before',
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      estimatedMinutes: 30,
      spentMinutes: 0,
      recurring: 'daily',
      tags: ['សុខភាព', 'កីឡា'],
      subtasks: [
        { id: 'sub-7', title: 'កម្តៅសាច់ដុំ ៥ នាទី', completed: false },
        { id: 'sub-8', title: 'រត់ចម្ងាយ ៣ គីឡូម៉ែត្រ', completed: false },
      ],
    },
    {
      id: 'task-4',
      title: 'ទូទាត់វិក្កយបត្រអគ្គិសនី និងទឹកប្រចាំខែ',
      description: 'ពិនិត្យមើលទឹកប្រាក់ និងទូទាត់តាមកម្មវិធីធនាគារចល័ត។',
      category: 'finance',
      priority: 'high',
      dueDate: tomorrow,
      dueTime: '10:00',
      reminderTiming: '1h_before',
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      estimatedMinutes: 15,
      spentMinutes: 0,
      recurring: 'monthly',
      tags: ['វិក្កយបត្រ', 'ហិរញ្ញវត្ថុ'],
      subtasks: [],
    },
    {
      id: 'task-5',
      title: 'អានសៀវភៅអភិវឌ្ឍន៍ខ្លួន ១៥ ទំព័រ',
      description: 'សៀវភៅស្តីពីការគ្រប់គ្រងពេលវេលា និងទម្លាប់ជោគជ័យ (Atomic Habits)។',
      category: 'personal',
      priority: 'low',
      dueDate: today,
      dueTime: '21:00',
      reminderTiming: '15m_before',
      completed: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      estimatedMinutes: 20,
      spentMinutes: 0,
      recurring: 'daily',
      tags: ['សៀវភៅ', 'ទម្លាប់ល្អ'],
      subtasks: [],
    },
  ];
}

export function getInitialStreak(): DailyStreak {
  return {
    currentStreak: 5,
    longestStreak: 12,
    lastActiveDate: getTodayDateString(),
    totalCompletedAllTime: 42,
    totalFocusMinutesAllTime: 580,
  };
}
