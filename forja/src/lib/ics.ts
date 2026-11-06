/**
 * Gera um arquivo .ics com lembretes semanais recorrentes.
 * Alternativa real a notificações agendadas, que o Safari/PWA não oferece
 * sem servidor de push: o Calendário do iPhone dispara os alertas.
 */
const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function buildIcs(days: number[], hour: number, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FORJA//Treino Inteligente//PT-BR', 'CALSCALE:GREGORIAN'];
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const sorted = [...new Set(days)].sort();
  if (sorted.length === 0) return '';
  // Primeira ocorrência: próximo dia preferido a partir de hoje.
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0);
  while (!sorted.includes(start.getDay())) start.setDate(start.getDate() + 1);
  const dt = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(hour)}0000`;
  lines.push(
    'BEGIN:VEVENT',
    `UID:forja-lembrete-${sorted.join('')}-${hour}@forja.local`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt}`,
    'DURATION:PT45M',
    `RRULE:FREQ=WEEKLY;BYDAY=${sorted.map((d) => BYDAY[d]).join(',')}`,
    'SUMMARY:Treino FORJA (opcional)',
    'DESCRIPTION:Seu treino está pronto no FORJA. Se hoje não der\\, tudo bem: a sequência espera por você.',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Treino FORJA em 15 minutos',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );
  return lines.join('\r\n');
}
