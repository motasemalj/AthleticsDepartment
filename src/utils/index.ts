import { format, isToday, isYesterday, parseISO } from 'date-fns';

let counter = 0;
export function uid(prefix = 'id'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function dateKey(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd');
}

export function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dateKey(d);
}

export function formatAed(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && Math.abs(amount) >= 1000) {
    return `AED ${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `AED ${amount.toLocaleString('en-AE', { maximumFractionDigits: 0 })}`;
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const d = new Date(ts);
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
}

export function formatChatTime(ts: number): string {
  const d = new Date(ts);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
}

export function formatDateKey(key: string, pattern = 'EEE d MMM'): string {
  try {
    return format(parseISO(key), pattern);
  } catch {
    return key;
  }
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return s > 0 && m < 10 ? `${m}m ${s}s` : `${m} min`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Consecutive-day streak ending today or yesterday, from a set of completed date keys. */
export function computeStreak(completedKeys: Set<string>): number {
  let streak = 0;
  const cursor = new Date();
  if (!completedKeys.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // allow streak to survive until end of today
  }
  while (completedKeys.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function avatarColor(seed: string): string {
  const colors = ['#8B5CF6', '#3B82F6', '#22D3EE', '#F59E0B', '#F472B6', '#22C55E', '#FB923C'];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length]!;
}
