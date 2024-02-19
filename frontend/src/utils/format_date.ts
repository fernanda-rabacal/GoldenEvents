import dayjs from "dayjs"

export function formatDateExtensive(weekDay: Date | string) {
  return dayjs(weekDay).format('dddd[, ]DD[ de ]MMMM')
}

export function formatDate(date: Date | string) {
  if (!date) {
    return "";
  }

  return dayjs(date).format("DD/MM/YY hh:ss")
}