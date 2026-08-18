/** Parse schedule string into normalized HH:mm times (supports comma/semicolon/space separated). */
export function parseScheduleTimes(schedule: string): string[] {
  const times = new Set<string>();
  const parts = schedule.split(/[,;|]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/(\d{1,2}):(\d{2})/);
    if (!match) continue;
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) continue;
    times.add(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }

  return Array.from(times).sort();
}

export function todayDateKey(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function currentTimeKey(date = new Date()): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function weekStartKey(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}
