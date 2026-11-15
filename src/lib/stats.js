import { addDays } from "./dates.js"

// Statistics for the overview. Pure functions on the entries, so they can be
// tested without a browser. "today" is always the user's today as a day key
// (the browser's date), never the server's.
//
// entriesByDate: { "YYYY-MM-DD": { mood, habits: [names] } }
//
// Relative imports only, so this runs in Node's test runner directly.

// Periods of the "Average Mood" select. Rolling windows that include today;
// days: null = all entries.
export const MOOD_PERIODS = {
    week: { label: "Last Week", days: 7 },
    month: { label: "Last Month", days: 30 },
    year: { label: "Last Year", days: 365 },
    total: { label: "Total", days: null },
}

// Average mood of the logged days in the period.
// Returns { average, count }; average is rounded to one decimal, null without entries.
export function averageMood(entriesByDate, { todayKey, days = null }) {
    const firstDay = days === null ? null : addDays(todayKey, -(days - 1))

    const moods = Object.entries(entriesByDate)
        .filter(([date]) => days === null || (date >= firstDay && date <= todayKey))
        .map(([, entry]) => entry.mood)

    if (moods.length === 0) return { average: null, count: 0 }

    const sum = moods.reduce((total, mood) => total + mood, 0)
    return { average: Math.round((sum / moods.length) * 10) / 10, count: moods.length }
}

// Number of consecutive days, up to today, on which the habit was done.
// If today has no entry yet, counting starts yesterday, so an open day
// doesn't break the streak before the user had a chance to log it.
// A day without entry, or with the habit not done, ends the streak.
export function habitStreak(entriesByDate, habitName, todayKey) {
    let day = entriesByDate[todayKey] ? todayKey : addDays(todayKey, -1)
    let streak = 0

    while (entriesByDate[day]?.habits?.includes(habitName)) {
        streak++
        day = addDays(day, -1)
    }
    return streak
}

// Streaks for the user's current habits (deleted habits aren't listed),
// in the order of the habit list.
export function habitStreaks(entriesByDate, habits, todayKey) {
    return habits.map((habit) => ({
        name: habit.name,
        streak: habitStreak(entriesByDate, habit.name, todayKey),
    }))
}
