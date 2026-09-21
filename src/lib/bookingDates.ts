export const BOOKING_END_YEAR = 2027;
export const BOOKING_END_DATE = `${BOOKING_END_YEAR}-12-31`;

export function getBookingEndDate() {
  return new Date(BOOKING_END_YEAR, 11, 31, 23, 59, 59, 999);
}
