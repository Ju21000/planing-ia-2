/**
 * Analyse une chaîne de date au format JJ/MM/AAAA en un objet Date.
 */
export const parseDate = (dateStr: string): Date | null => {
  const parts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!parts) return null;
  // parts est [full, DD, MM, YYYY]
  const [, day, month, year] = parts;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (isNaN(date.getTime()) || date.getUTCDate() !== parseInt(day)) {
    return null;
  }
  return date;
};

/**
 * Formate un objet Date en une chaîne DD/MM/AAAA.
 */
export const formatDate = (date: Date): string => {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Obtient le début de la semaine (lundi) pour une date donnée.
 */
export const getWeekStartDate = (date: Date): Date => {
  const dayOfWeek = date.getUTCDay(); // Dimanche est 0, Lundi est 1, etc.
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Ajustement pour dimanche
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0); // Normaliser l'heure
  return monday;
};

/**
 * Ajoute un certain nombre de jours à une date.
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

/**
 * Obtient le nom complet du jour en français.
 */
export const getDayName = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'UTC' });
}

/**
 * Calcule la durée en heures entre deux heures au format HH:mm.
 */
export const calculateDurationHours = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) return 0;

  const start = startTime.split(':');
  const end = endTime.split(':');
  if (start.length < 2 || end.length < 2) return 0;
  
  const startHour = parseInt(start[0], 10);
  const startMinute = parseInt(start[1], 10);
  const endHour = parseInt(end[0], 10);
  const endMinute = parseInt(end[1], 10);

  if (isNaN(startHour) || isNaN(startMinute) || isNaN(endHour) || isNaN(endMinute)) return 0;

  const startDate = new Date(0, 0, 0, startHour, startMinute, 0);
  const endDate = new Date(0, 0, 0, endHour, endMinute, 0);

  let diff = endDate.getTime() - startDate.getTime();
  return diff / (1000 * 60 * 60);
};