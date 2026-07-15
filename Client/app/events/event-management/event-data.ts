export type EventRecord = { name: string; date: string; dateTime: string; client: string; email: string; guests: number; status: string; statusStyle: string }
export const eventRecords: Record<string, EventRecord> = {
  '1': { name: 'Acme Quarterly Lunch', date: 'Jul 4, 2026', dateTime: 'July 4, 2026, 12:00 PM', client: 'Acme Corp', email: 'events@acmecorp.com', guests: 40, status: 'Confirmed', statusStyle: 'bg-blue-100 text-blue-700' },
  '2': { name: 'Ruracia', date: 'Jul 6, 2026', dateTime: 'July 6, 2026, 1:00 PM', client: 'Gari Zetu', email: 'events@garizetu.co.ke', guests: 180, status: 'Inquiry', statusStyle: 'bg-purple-100 text-purple-700' },
  '3': { name: 'Johnson Wedding Reception', date: 'Jul 11, 2026', dateTime: 'July 11, 2026, 3:00 PM', client: 'David & Emily Johnson', email: 'david.johnson@email.com', guests: 150, status: 'Tentative', statusStyle: 'bg-orange-100 text-orange-700' },
  '4': { name: 'Acme Annual Conference', date: 'Jul 23, 2026', dateTime: 'July 23, 2026, 9:00 AM', client: 'Acme Corp', email: 'events@acmecorp.com', guests: 80, status: 'Inquiry', statusStyle: 'bg-purple-100 text-purple-700' },
}
