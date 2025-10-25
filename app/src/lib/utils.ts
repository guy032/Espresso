import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function getSeverityColor(severity: 'minor' | 'major' | 'critical'): string {
  const colors = {
    minor: 'badge-warning',
    major: 'badge-danger',
    critical: 'badge badge-danger bg-danger-600 text-white dark:bg-danger-600',
  };
  return colors[severity];
}

export function getStatusColor(status: 'open' | 'in_progress' | 'resolved'): string {
  const colors = {
    open: 'badge-danger',
    in_progress: 'badge-warning',
    resolved: 'badge-success',
  };
  return colors[status];
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
