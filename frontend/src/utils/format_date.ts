import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

export function formatDate(date: Date | string) {
  if (!date) {
    return '';
  }

  return dayjs(date).format('DD/MM/YY hh:ss');
}

// "18"
export function formatDay(date: Date | string) {
  return dayjs(date).format('DD');
}

// "18 MAI"
export function formatDayMonth(date: Date | string) {
  return dayjs(date).format('DD MMM').toUpperCase();
}

// "maio · 2026"
export function formatMonthYear(date: Date | string) {
  return dayjs(date).format('MMMM · YYYY');
}

// "18 de maio de 2026"
export function formatLongDate(date: Date | string) {
  return dayjs(date).format('D [de] MMMM [de] YYYY');
}

// "18:00"
export function formatTime(date: Date | string) {
  return dayjs(date).format('HH:mm');
}

// "4 horas"
export function formatDuration(start: Date | string, end: Date | string) {
  const minutes = dayjs(end).diff(start, 'minute');

  if (minutes < 60) {
    return `${minutes} minutos`;
  }

  const hours = Math.round(minutes / 60);

  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
}

// "18/05/2026 18:00"
export function formatDateTime(date: Date | string) {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

// Valor de um <input type="datetime-local"> no fuso de quem está usando
export function toDateTimeInputValue(date?: Date | string | null) {
  return date ? dayjs(date).format('YYYY-MM-DDTHH:mm') : '';
}
