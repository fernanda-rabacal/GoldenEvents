import dayjs from "dayjs"
import 'dayjs/locale/pt-br'
dayjs.locale('pt-br')

export function formatDateExtensive(weekDay: Date | string) {
  let formattedDate = dayjs(weekDay).format('dddd[, ]DD[ de ]MMMM');

  formattedDate = formattedDate.substring(0, 1).toUpperCase() + formattedDate.substring(1);

  return formattedDate;
}

export function formatDate(date: Date | string) {
  if (!date) {
    return "";
  }

  return dayjs(date).format("DD/MM/YY hh:ss")
}