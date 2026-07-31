export type CalendarWindow = {
  start: Date;
  end: Date;
  label: string;
};

const weekdays = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function clone(value: Date) {
  return new Date(value.getTime());
}

function startOfDay(value: Date) {
  const result = clone(value);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(value: Date, days: number) {
  const result = clone(value);
  result.setDate(result.getDate() + days);
  return result;
}

function mondayOfWeek(value: Date) {
  const monday = startOfDay(value);
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return monday;
}

function nextMonday(value: Date) {
  return addDays(mondayOfWeek(value), 7);
}

function withTime(value: Date, hour: number) {
  const result = clone(value);
  result.setHours(hour, 0, 0, 0);
  return result;
}

function weekdayDate(
  description: string,
  now: Date,
): { date: Date; weekday: string } | null {
  const match = description.match(
    /\b(next|this)?\s*(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (!match) return null;

  const targetDay = weekdays.indexOf(match[2]);
  let daysAhead = (targetDay - now.getDay() + 7) % 7;
  if (match[1] === "next" && daysAhead === 0) daysAhead = 7;
  return {
    date: addDays(startOfDay(now), daysAhead),
    weekday: match[2],
  };
}

export function resolveCalendarReadWindow(
  description: string,
  now = new Date(),
): CalendarWindow {
  const normalized = description.trim().toLowerCase();

  if (/\bnext\s+week\b/.test(normalized)) {
    const start = nextMonday(now);
    return { start, end: addDays(start, 7), label: "next week" };
  }

  if (/\bthis\s+week\b/.test(normalized)) {
    const start = mondayOfWeek(now);
    return { start, end: addDays(start, 7), label: "this week" };
  }

  if (/\btomorrow\b/.test(normalized)) {
    const start = addDays(startOfDay(now), 1);
    return { start, end: addDays(start, 1), label: "tomorrow" };
  }

  if (/\btoday\b/.test(normalized)) {
    const start = startOfDay(now);
    return { start, end: addDays(start, 1), label: "today" };
  }

  if (/\bnext\s+month\b/.test(normalized)) {
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 1);
    return { start, end, label: "next month" };
  }

  const nextDays = normalized.match(/\bnext\s+(\d{1,2})\s+days?\b/);
  if (nextDays) {
    const count = Math.min(31, Math.max(1, Number(nextDays[1])));
    const start = startOfDay(now);
    return {
      start,
      end: addDays(start, count),
      label: `the next ${count} days`,
    };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    return { start, end: addDays(start, 1), label: normalized };
  }

  const weekday = weekdayDate(normalized, now);
  if (weekday) {
    return {
      start: weekday.date,
      end: addDays(weekday.date, 1),
      label: weekday.weekday,
    };
  }

  const start = startOfDay(now);
  return {
    start,
    end: addDays(start, 14),
    label: "the next two weeks",
  };
}

export function resolveSchedulingWindow(
  description: string,
  now = new Date(),
): CalendarWindow {
  const normalized = description.trim().toLowerCase();

  if (/\bnext\s+week\b/.test(normalized)) {
    const monday = nextMonday(now);
    return {
      start: withTime(monday, 9),
      end: withTime(addDays(monday, 4), 17),
      label: "next week",
    };
  }

  if (/\bthis\s+week\b/.test(normalized)) {
    const monday = mondayOfWeek(now);
    return {
      start: new Date(Math.max(now.getTime(), withTime(monday, 9).getTime())),
      end: withTime(addDays(monday, 4), 17),
      label: "this week",
    };
  }

  const nextDays = normalized.match(
    /\b(?:within\s+(?:the\s+)?)?next\s+(\d{1,2}|seven)\s+days?\b/,
  );
  if (nextDays) {
    const count = nextDays[1] === "seven" ? 7 : Number(nextDays[1]);
    const end = addDays(now, Math.min(31, Math.max(1, count)));
    end.setHours(17, 0, 0, 0);
    return { start: clone(now), end, label: `the next ${count} days` };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [year, month, day] = normalized.split("-").map(Number);
    return {
      start: clone(now),
      end: new Date(year, month - 1, day, 17, 0, 0, 0),
      label: normalized,
    };
  }

  const weekday = weekdayDate(normalized, now);
  if (weekday) {
    if (/\b(before|by|deadline|no later than)\b/.test(normalized)) {
      return {
        start: clone(now),
        end: withTime(weekday.date, 17),
        label: `before ${weekday.weekday}`,
      };
    }
    return {
      start: withTime(weekday.date, 9),
      end: withTime(weekday.date, 17),
      label: weekday.weekday,
    };
  }

  const fallbackEnd = addDays(now, 7);
  fallbackEnd.setHours(17, 0, 0, 0);
  return { start: clone(now), end: fallbackEnd, label: "the next seven days" };
}
