import dayjs from "dayjs"

export function formatDate(weekDay: Date) {
  return dayjs(weekDay).format('dddd[, ]DD[ de ]MMMM')
}