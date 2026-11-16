import { addDays, startOfWeek } from "./dates.js"

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
    return { average: roundToTenth(sum / moods.length), count: moods.length }
}

function roundToTenth(value) {
    return Math.round(value * 10) / 10
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

// Logged days (entries) from `days` days ago up to today, oldest first.
// days: null = all entries up to today.
function loggedDaysInPeriod(entriesByDate, todayKey, days) {
    const firstDay = days === null ? null : addDays(todayKey, -(days - 1))
    return Object.keys(entriesByDate)
        .filter((date) => date <= todayKey && (firstDay === null || date >= firstDay))
        .sort()
        .map((date) => ({ date, ...entriesByDate[date] }))
}

// ---------------------------------------------------------------------------
// Mood chart

// Ranges of the mood chart. Rolling windows that include today.
export const MOOD_CHART_RANGES = {
    week: { label: "7 days", days: 7 },
    month: { label: "30 days", days: 30 },
    quarter: { label: "90 days", days: 90 },
    year: { label: "1 year", days: 365 },
}

// One point per calendar day of the range, oldest first:
// { date, mood, average, habits }
//
// - mood: the logged mood, or null for days without entry (a gap in the
//   chart, not a 0)
// - average: rolling average of the logged moods in the `averageDays` days
//   up to and including this day (one decimal), null if none of them is
//   logged. Entries before the range count too, so the line starts correctly.
// - habits: names of the habits done that day ([] without entry)
export function moodSeries(entriesByDate, { todayKey, days, averageDays = 7 }) {
    const points = []
    for (let daysAgo = days - 1; daysAgo >= 0; daysAgo--) {
        const date = addDays(todayKey, -daysAgo)
        const entry = entriesByDate[date]
        points.push({
            date,
            mood: entry ? entry.mood : null,
            average: rollingAverageMood(entriesByDate, date, averageDays),
            habits: entry ? [...(entry.habits ?? [])] : [],
        })
    }
    return points
}

function rollingAverageMood(entriesByDate, lastDay, days) {
    let sum = 0
    let count = 0
    for (let daysAgo = 0; daysAgo < days; daysAgo++) {
        const entry = entriesByDate[addDays(lastDay, -daysAgo)]
        if (entry) {
            sum += entry.mood
            count++
        }
    }
    return count === 0 ? null : roundToTenth(sum / count)
}

// ---------------------------------------------------------------------------
// Habit heatmap

// Number of color levels for days with at least one habit done (1 … 4);
// level 0 is a logged day with nothing done.
export const HEATMAP_LEVELS = 4

// Calendar grid for a GitHub-style heatmap: `weeks` columns of 7 days, the
// last column contains today. Columns start on `weekStartsOn`
// (0 = Sunday, 1 = Monday … 6 = Saturday).
//
// habit: null = all habits, or the name of one habit
//
// Like GitHub's contribution graph, the color shows how much was done that
// day (the number of habits done), scaled to the busiest day in the grid.
// It doesn't depend on the current habit list, so adding or removing a habit
// never changes past days. All habits of an entry count, including habits
// that were deleted later (the entry is the record of that day).
//
// Returns { weeks, max, monthLabels, loggedDays, activeDays }:
// - weeks: [[cell × 7] × weeks], each cell:
//   { date, future, hasEntry, done, level }
//   - future: day after today (the rest of the current week); not a real day yet
//   - done: number of habits done that day (one habit: 1 or 0)
//   - level: null without entry, 0 = logged but nothing done,
//     1 … HEATMAP_LEVELS = done relative to `max` (up to 25 %, 50 %, 75 %, 100 %)
// - max: most habits done on one day in the grid (0 if none)
// - monthLabels: [{ week, month: "YYYY-MM" }], the column where a month starts
// - loggedDays / activeDays: days in the grid with an entry / with ≥ 1 habit done
export function habitHeatmap(entriesByDate, { todayKey, habit = null, weeks = 53, weekStartsOn = 1 }) {
    const firstDay = addDays(startOfWeek(todayKey, weekStartsOn), -(weeks - 1) * 7)

    // first pass: the days and how many habits were done on each
    const grid = []
    for (let week = 0; week < weeks; week++) {
        const column = []
        for (let weekday = 0; weekday < 7; weekday++) {
            const date = addDays(firstDay, week * 7 + weekday)
            const entry = date <= todayKey ? entriesByDate[date] : undefined
            const names = entry?.habits ?? []
            const done = habit === null ? names.length : (names.includes(habit) ? 1 : 0)
            column.push({ date, future: date > todayKey, hasEntry: !!entry, done })
        }
        grid.push(column)
    }

    const cells = grid.flat()
    const max = Math.max(0, ...cells.map((cell) => cell.done))

    // second pass: levels relative to the busiest day
    for (const cell of cells) {
        cell.level = !cell.hasEntry ? null
            : cell.done === 0 ? 0
            // integer math, so e.g. 3 of 4 is exactly level 3
            : Math.ceil((cell.done * HEATMAP_LEVELS) / max)
    }

    return {
        weeks: grid,
        max,
        monthLabels: heatmapMonthLabels(grid),
        loggedDays: cells.filter((cell) => cell.hasEntry).length,
        activeDays: cells.filter((cell) => cell.done > 0).length,
    }
}

// A label for each column that contains the 1st of a month. The first
// column is labeled with its own month too, unless the next label follows
// within 3 columns (the labels would overlap).
function heatmapMonthLabels(grid) {
    const labels = []
    grid.forEach((column, week) => {
        const first = column.find((cell) => !cell.future && cell.date.endsWith("-01"))
        if (first) labels.push({ week, month: first.date.slice(0, 7) })
    })

    if (grid.length > 0 && labels[0]?.week !== 0 && (labels.length === 0 || labels[0].week >= 3)) {
        labels.unshift({ week: 0, month: grid[0][0].date.slice(0, 7) })
    }
    return labels
}

// ---------------------------------------------------------------------------
// Completion rate

// How many of their habits the user did on the days they logged in the
// period. Days without entry are unknown, not "missed", so they don't count.
//
// habits: the user's current habit list [{ name }]
// days:   rolling window including today, null = all entries
//
// Returns { rate, done, possible, loggedDays, perHabit }:
// - rate: done / possible (0 … 1), null without logged days or habits
// - perHabit: [{ name, done, loggedDays, rate }] in habit-list order
export function habitCompletion(entriesByDate, habits, { todayKey, days = null }) {
    const logged = loggedDaysInPeriod(entriesByDate, todayKey, days)
    const loggedDays = logged.length

    const perHabit = habits.map(({ name }) => {
        const done = logged.filter((entry) => entry.habits?.includes(name)).length
        return { name, done, loggedDays, rate: loggedDays === 0 ? null : done / loggedDays }
    })

    const done = perHabit.reduce((sum, habit) => sum + habit.done, 0)
    const possible = loggedDays * habits.length
    return { rate: possible === 0 ? null : done / possible, done, possible, loggedDays, perHabit }
}
