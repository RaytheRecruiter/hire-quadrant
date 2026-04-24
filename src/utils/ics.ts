// Minimal RFC 5545 .ics builder. Single-event, no recurrence, no
// timezone database — uses UTC for simplicity. Good enough for
// employer-scheduled interviews.

function fmt(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startUtc: Date;
  endUtc: Date;
  organizerEmail?: string;
  attendeeEmail?: string;
  url?: string;
}

function escape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
}

export function buildIcs(ev: IcsEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HireQuadrant//Interview//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(ev.startUtc)}`,
    `DTEND:${fmt(ev.endUtc)}`,
    `SUMMARY:${escape(ev.title)}`,
  ];
  if (ev.description) lines.push(`DESCRIPTION:${escape(ev.description)}`);
  if (ev.location) lines.push(`LOCATION:${escape(ev.location)}`);
  if (ev.url) lines.push(`URL:${escape(ev.url)}`);
  if (ev.organizerEmail) lines.push(`ORGANIZER:MAILTO:${ev.organizerEmail}`);
  if (ev.attendeeEmail) lines.push(`ATTENDEE;RSVP=TRUE:MAILTO:${ev.attendeeEmail}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(ev: IcsEvent, filename = 'interview.ics'): void {
  const ics = buildIcs(ev);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
