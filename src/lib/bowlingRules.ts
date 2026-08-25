export function parseLocalDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export function getBowlingOpeningHours(date: string) {
  const dayOfWeek = parseLocalDate(date).getDay();

  if (dayOfWeek === 0) return null;

  return {
    startHour: dayOfWeek === 6 ? 14 : 9,
    closingHour: dayOfWeek === 5 || dayOfWeek === 6 ? 21 : 20,
  };
}

export function getBowlingStartHours(date: string): string[] {
  const hours = getBowlingOpeningHours(date);
  if (!hours) return [];

  const slots: string[] = [];
  for (let h = hours.startHour; h < hours.closingHour; h++) {
    slots.push(String(h).padStart(2, "0"));
  }
  return slots;
}

export function isBowlingBookingWithinOpeningHours(date: string, time: string, duration: number): boolean {
  const hours = getBowlingOpeningHours(date);
  if (!hours || !time || duration < 1) return false;

  const [hStr, mStr] = time.split(":");
  const startMinutes = parseInt(hStr) * 60 + parseInt(mStr || "0");
  const openingMinutes = hours.startHour * 60;
  const closingMinutes = hours.closingHour * 60;

  return startMinutes >= openingMinutes && startMinutes + duration * 60 <= closingMinutes;
}

export function getMaxBowlingDuration(date: string, time: string): number {
  const hours = getBowlingOpeningHours(date);
  if (!hours || !time) return 3;

  const [hStr, mStr] = time.split(":");
  const startMinutes = parseInt(hStr) * 60 + parseInt(mStr || "0");
  const minutesUntilClosing = hours.closingHour * 60 - startMinutes;

  return Math.max(1, Math.min(3, Math.floor(minutesUntilClosing / 60)));
}
