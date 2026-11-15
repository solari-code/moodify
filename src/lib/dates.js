// Day keys: every entry belongs to one calendar day, identified by a
// "YYYY-MM-DD" string in the user's own timezone.
//
// The key is created in the browser from the day the user picked, so the
// server's timezone never changes which day an entry belongs to. (Converting
// a Date on the server, as before, could shift an entry to the previous or
// next day when server and user are in different timezones.)
//
// Used by client and server code. No "@/" imports, so it can run in Node's
// test runner directly.

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

// Date -> "YYYY-MM-DD", using the local calendar day of the Date.
export function toDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

// "YYYY-MM-DD" -> Date at local midnight of that day.
export function fromDateKey(dateKey) {
    const [, year, month, day] = DATE_KEY_PATTERN.exec(dateKey)
    return new Date(Number(year), Number(month) - 1, Number(day))
}

// True for well-formed keys of real calendar days ("2024-02-30" is false).
export function isValidDateKey(value) {
    if (typeof value !== "string") return false
    const match = DATE_KEY_PATTERN.exec(value)
    if (!match) return false
    const [, year, month, day] = match.map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day
}

// The server doesn't know the user's timezone, so it can't compute the user's
// "today" exactly. Instead it allows every day that is already "today"
// somewhere on earth: the most advanced timezone is UTC+14.
const MAX_UTC_OFFSET_MS = 14 * 60 * 60 * 1000

export function latestAllowedDateKey(now = new Date()) {
    const ahead = new Date(now.getTime() + MAX_UTC_OFFSET_MS)
    return ahead.toISOString().slice(0, 10)
}

export function isFutureDateKey(dateKey, now = new Date()) {
    // Keys have a fixed format, so string comparison is chronological.
    return dateKey > latestAllowedDateKey(now)
}

// "YYYY-MM-DD" + n days -> "YYYY-MM-DD" (n can be negative).
// Calculated in UTC on the key itself, so daylight saving changes (days with
// 23 or 25 hours) can't shift the result.
export function addDays(dateKey, days) {
    const [year, month, day] = dateKey.split("-").map(Number)
    const date = new Date(Date.UTC(year, month - 1, day + days))
    return date.toISOString().slice(0, 10)
}
