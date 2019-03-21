import moment from 'moment';

export function addDays(date, days) {
  const newDate = (date instanceof Date) ? date : new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * 
 * @param {*} date UNIX timestamp
 */
export function getDifferenceInYears(date) {
  return (moment(new Date()).diff(moment(new Date(date * 1000)), 'year') + 1);
}