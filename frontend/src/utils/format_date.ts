import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

export function formatDateExtensive(weekDay: Date | string) {
  let formattedDate = dayjs(weekDay).format('dddd[, ]DD[ de ]MMMM');

  formattedDate =
    formattedDate.substring(0, 1).toUpperCase() + formattedDate.substring(1);

  return formattedDate;
}

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
