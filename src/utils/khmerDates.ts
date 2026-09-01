import { KHMER_DAYS, KHMER_MONTHS, toKhmerNumber } from './translations';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKhmerFormatted(): string {
  return formatKhmerDate(getTodayDateString(), true);
}

export function formatKhmerDate(dateStr: string, includeDayOfWeek: boolean = true): string {
  if (!dateStr) return '';
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const dateObj = new Date(year, monthIdx, day);
  const dayOfWeek = KHMER_DAYS[dateObj.getDay()];
  const khmerMonth = KHMER_MONTHS[monthIdx] || '';

  const dayKh = toKhmerNumber(day);
  const yearKh = toKhmerNumber(year);

  if (includeDayOfWeek) {
    return `ថ្ងៃ${dayOfWeek} ទី${dayKh} ខែ${khmerMonth} ឆ្នាំ${yearKh}`;
  }
  return `ទី${dayKh} ខែ${khmerMonth} ឆ្នាំ${yearKh}`;
}

export function formatKhmerShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [, monthStr, dayStr] = dateStr.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const khmerMonth = KHMER_MONTHS[monthIdx] || '';
  return `ទី${toKhmerNumber(day)} ${khmerMonth}`;
}

export function formatKhmerTime(timeStr?: string): string {
  if (!timeStr) return '';
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  const isPM = hour >= 12;
  const period = isPM ? (hour >= 18 ? 'យប់' : 'រសៀល') : (hour >= 11 ? 'ថ្ងៃត្រង់' : 'ព្រឹក');

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  const minFormatted = min > 0 ? `:${String(min).padStart(2, '0')}` : '';
  return `ម៉ោង ${toKhmerNumber(hour)}${min > 0 ? toKhmerNumber(minFormatted) : ':០០'} ${period}`;
}

export function getRelativeDueDateText(dueDate: string, dueTime?: string): {
  text: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  badgeColor: string;
} {
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  if (dueDate < today) {
    return {
      text: 'ហួសកាលកំណត់',
      isOverdue: true,
      isToday: false,
      isTomorrow: false,
      badgeColor: 'bg-red-100 text-red-700 border-red-200',
    };
  }

  if (dueDate === today) {
    // Check if time is overdue today
    if (dueTime) {
      const now = new Date();
      const [h, m] = dueTime.split(':').map(Number);
      const dueDateTime = new Date();
      dueDateTime.setHours(h, m, 0, 0);

      if (now > dueDateTime) {
        return {
          text: `ហួសម៉ោង (${formatKhmerTime(dueTime)})`,
          isOverdue: true,
          isToday: true,
          isTomorrow: false,
          badgeColor: 'bg-red-100 text-red-700 border-red-200',
        };
      }
      return {
        text: `ថ្ងៃនេះ ${formatKhmerTime(dueTime)}`,
        isOverdue: false,
        isToday: true,
        isTomorrow: false,
        badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      };
    }
    return {
      text: 'ថ្ងៃនេះ',
      isOverdue: false,
      isToday: true,
      isTomorrow: false,
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
  }

  if (dueDate === tomorrow) {
    return {
      text: dueTime ? `ថ្ងៃស្អែក ${formatKhmerTime(dueTime)}` : 'ថ្ងៃស្អែក',
      isOverdue: false,
      isToday: false,
      isTomorrow: true,
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    };
  }

  return {
    text: formatKhmerShortDate(dueDate) + (dueTime ? ` (${formatKhmerTime(dueTime)})` : ''),
    isOverdue: false,
    isToday: false,
    isTomorrow: false,
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}
