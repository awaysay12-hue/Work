import { PriorityLevel, TaskCategory, RecurrenceType, ReminderTiming } from '../types';

export const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];

export function toKhmerNumber(num: number | string): string {
  return String(num).replace(/\d/g, (digit) => KHMER_DIGITS[parseInt(digit, 10)]);
}

export const KHMER_MONTHS = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
];

export const KHMER_DAYS = [
  'អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'
];

export const KHMER_SHORT_DAYS = ['អា', 'ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស'];

export interface CategoryMeta {
  id: TaskCategory;
  labelKm: string;
  labelEn: string;
  iconName: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  badgeBg: string;
}

export const CATEGORIES_CONFIG: Record<TaskCategory, CategoryMeta> = {
  work: {
    id: 'work',
    labelKm: 'ការងារ',
    labelEn: 'Work',
    iconName: 'Briefcase',
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-700',
    colorBorder: 'border-blue-200',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  study: {
    id: 'study',
    labelKm: 'ការសិក្សា',
    labelEn: 'Study',
    iconName: 'GraduationCap',
    colorBg: 'bg-indigo-50',
    colorText: 'text-indigo-700',
    colorBorder: 'border-indigo-200',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  personal: {
    id: 'personal',
    labelKm: 'ផ្ទាល់ខ្លួន',
    labelEn: 'Personal',
    iconName: 'User',
    colorBg: 'bg-emerald-50',
    colorText: 'text-emerald-700',
    colorBorder: 'border-emerald-200',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  health: {
    id: 'health',
    labelKm: 'សុខភាព',
    labelEn: 'Health & Fitness',
    iconName: 'HeartPulse',
    colorBg: 'bg-rose-50',
    colorText: 'text-rose-700',
    colorBorder: 'border-rose-200',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  finance: {
    id: 'finance',
    labelKm: 'ហិរញ្ញវត្ថុ',
    labelEn: 'Finance',
    iconName: 'Coins',
    colorBg: 'bg-amber-50',
    colorText: 'text-amber-700',
    colorBorder: 'border-amber-200',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  family: {
    id: 'family',
    labelKm: 'គ្រួសារ',
    labelEn: 'Family',
    iconName: 'Home',
    colorBg: 'bg-purple-50',
    colorText: 'text-purple-700',
    colorBorder: 'border-purple-200',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  other: {
    id: 'other',
    labelKm: 'ផ្សេងៗ',
    labelEn: 'Other',
    iconName: 'Tag',
    colorBg: 'bg-slate-100',
    colorText: 'text-slate-700',
    colorBorder: 'border-slate-200',
    badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
  },
};

export interface PriorityMeta {
  id: PriorityLevel;
  labelKm: string;
  labelEn: string;
  colorBg: string;
  colorText: string;
  dotColor: string;
  badge: string;
}

export const PRIORITIES_CONFIG: Record<PriorityLevel, PriorityMeta> = {
  urgent: {
    id: 'urgent',
    labelKm: 'បន្ទាន់ខ្លាំង',
    labelEn: 'Urgent',
    colorBg: 'bg-red-50',
    colorText: 'text-red-700',
    dotColor: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200 ring-1 ring-red-400/30',
  },
  high: {
    id: 'high',
    labelKm: 'អាទិភាពខ្ពស់',
    labelEn: 'High',
    colorBg: 'bg-orange-50',
    colorText: 'text-orange-700',
    dotColor: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  medium: {
    id: 'medium',
    labelKm: 'មធ្យម',
    labelEn: 'Medium',
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-700',
    dotColor: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  low: {
    id: 'low',
    labelKm: 'ទាប',
    labelEn: 'Low',
    colorBg: 'bg-slate-100',
    colorText: 'text-slate-600',
    dotColor: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

export const REMINDER_OPTIONS: Array<{ id: ReminderTiming; labelKm: string; labelEn: string }> = [
  { id: 'none', labelKm: 'មិនរំលឹក', labelEn: 'No reminder' },
  { id: 'at_time', labelKm: 'ដល់ម៉ោងកំណត់', labelEn: 'At due time' },
  { id: '5m_before', labelKm: '៥ នាទីមុន', labelEn: '5 minutes before' },
  { id: '15m_before', labelKm: '១៥ នាទីមុន', labelEn: '15 minutes before' },
  { id: '30m_before', labelKm: '៣០ នាទីមុន', labelEn: '30 minutes before' },
  { id: '1h_before', labelKm: '១ ម៉ោងមុន', labelEn: '1 hour before' },
  { id: '1d_before', labelKm: '១ ថ្ងៃមុន', labelEn: '1 day before' },
];

export const RECURRING_OPTIONS: Array<{ id: RecurrenceType; labelKm: string; labelEn: string }> = [
  { id: 'none', labelKm: 'មិនកើតឡើងវិញ', labelEn: 'Does not repeat' },
  { id: 'daily', labelKm: 'រៀងរាល់ថ្ងៃ', labelEn: 'Daily' },
  { id: 'weekdays', labelKm: 'ថ្ងៃចន្ទ-សុក្រ (ថ្ងៃធ្វើការ)', labelEn: 'Weekdays' },
  { id: 'weekly', labelKm: 'រៀងរាល់សប្តាហ៍', labelEn: 'Weekly' },
  { id: 'monthly', labelKm: 'រៀងរាល់ខែ', labelEn: 'Monthly' },
];

export const MOTIVATIONAL_QUOTES_KM = [
  '« ភាពជោគជ័យកើតចេញពីការតស៊ូ និងការអនុវត្តកិច្ចការតូចៗជាប្រចាំថ្ងៃ »',
  '« ចាប់ផ្តើមកិច្ចការថ្ងៃនេះ កុំពន្យារពេលដល់ថ្ងៃស្អែក »',
  '« ការផ្តោតអារម្មណ៍តែមួយមុខ នាំឱ្យកិច្ចការសម្រេចបានលឿនជាងមុន »',
  '« ការរៀបចំផែនការច្បាស់លាស់ ស្មើនឹងការសម្រេចបានពាក់កណ្តាលរួចទៅហើយ »',
  '« រាល់ជំហានតូចៗថ្ងៃនេះ នឹងបង្កើតលទ្ធផលដ៏ធំធេងនៅថ្ងៃមុខ »',
  '« រក្សាវិន័យលើខ្លួនឯង នោះអ្នកនឹងឈានដល់គោលដៅដែលបានគ្រោងទុក »',
];
