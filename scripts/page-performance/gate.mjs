import { appendFileSync } from 'node:fs';
import { isMainModule } from './paths.mjs';

const DEFAULT_SCHEDULE = '0 8 * * 1';

export function parseEnabled(value) {
  if (value == null || String(value).trim() === '') return true;
  return !['false', '0', 'off', 'paused', 'no'].includes(String(value).trim().toLowerCase());
}

function fieldMatches(field, value) {
  if (field === '*') return true;
  return field.split(',').some((part) => {
    const token = part.trim();
    if (token.startsWith('*/')) {
      const step = Number(token.slice(2));
      return Number.isInteger(step) && step > 0 && value % step === 0;
    }
    if (token.includes('-')) {
      const [start, end] = token.split('-').map(Number);
      return value >= start && value <= end;
    }
    return Number(token) === value;
  });
}

export function cronMatches(expr, date = new Date()) {
  const fields = String(expr || '')
    .trim()
    .split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`PAGE_PERFORMANCE_SCHEDULE must be a 5-field cron, got: ${expr}`);
  }
  const hour = date.getUTCHours();
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const dow = date.getUTCDay();
  // YAML ticks at minute 0 of every hour; GitHub often starts the job several minutes late.
  // Match hour / day / month / weekday and ignore the minute field.
  return (
    fieldMatches(fields[1], hour) &&
    fieldMatches(fields[2], day) &&
    fieldMatches(fields[3], month) &&
    fieldMatches(fields[4], dow)
  );
}

export function shouldRun({ eventName, enabled, schedule = DEFAULT_SCHEDULE, skipUntil, now = new Date() } = {}) {
  if (eventName !== 'schedule') {
    return { run: true, reason: 'manual' };
  }
  if (!parseEnabled(enabled)) {
    return { run: false, reason: 'paused' };
  }
  if (skipUntil) {
    const until = new Date(skipUntil);
    if (!Number.isNaN(until.getTime()) && now < until) {
      return { run: false, reason: 'skip-until' };
    }
  }
  const expr = String(schedule || DEFAULT_SCHEDULE).trim() || DEFAULT_SCHEDULE;
  try {
    if (!cronMatches(expr, now)) {
      return { run: false, reason: 'schedule-miss' };
    }
  } catch {
    return { run: false, reason: 'invalid-schedule' };
  }
  return { run: true, reason: 'schedule' };
}

export { DEFAULT_SCHEDULE };

if (isMainModule(import.meta.url, process.argv[1])) {
  const result = shouldRun({
    eventName: process.env.GITHUB_EVENT_NAME || process.env.EVENT_NAME,
    enabled: process.env.PAGE_PERFORMANCE_ENABLED,
    schedule: process.env.PAGE_PERFORMANCE_SCHEDULE || DEFAULT_SCHEDULE,
    skipUntil: process.env.PAGE_PERFORMANCE_SKIP_UNTIL,
  });
  const line = `run=${result.run}\nreason=${result.reason}\n`;
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, line);
  }
  console.log(JSON.stringify(result));
}
