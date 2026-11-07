const ICONS = {
  Dispositivos: 'memory',
  Cables: 'cable-data',
  Herramientas: 'wrench-outline',
  Redes: 'lan-connect',
};

export function articleIconName(categoria) {
  return ICONS[categoria] || 'package-variant';
}

export function getInitials(displayName) {
  if (!displayName) return 'PL';
  const parts = String(displayName).trim().split(/\s+/);
  const first = parts[0] ? parts[0][0] : '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || 'PL';
}

const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function formatLongDate(date = new Date()) {
  const d = date instanceof Date && !isNaN(date) ? date : new Date();
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function parseDateValue(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

export function getDaysRemaining(endDate) {
  const end = parseDateValue(endDate);
  if (!end) return null;
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((endDay - today) / 86400000);
}

export function formatDueDate(endDate) {
  if (!endDate) return '—';
  if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(endDate)) {
    return endDate.slice(0, 10);
  }
  const d = parseDateValue(endDate);
  if (!d) return String(endDate);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
