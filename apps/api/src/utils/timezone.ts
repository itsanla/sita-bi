export function parseWIBToUTC(dateString: string): Date {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Format tanggal tidak valid');
  }
  return date;
}

export function getCurrentWIB(): Date {
  return new Date();
}

export function isDateInPast(date: Date): boolean {
  return date <= new Date();
}
