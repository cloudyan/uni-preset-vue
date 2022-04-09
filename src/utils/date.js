
export function getDate(diffYear = 0, startMonth = 6) {
  const date = new Date()
  let year = date.getFullYear()
  let month = startMonth // date.getMonth() + 1;
  let day = date.getDate()

  year = year + diffYear
  month = month > 9 ? month : '0' + month
  // day = day > 9 ? day : '0' + day;
  return `${year}-${month}`
}
