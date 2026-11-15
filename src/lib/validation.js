import { isValidDateKey, isFutureDateKey } from "./dates.js"

// Input validation for server actions. Everything coming from the client is
// untrusted, so it is checked here before it reaches the store.
//
// Relative imports only, so this runs in Node's test runner directly.

export const MOOD_MIN = 0
export const MOOD_MAX = 10
export const HABIT_NAME_MAX_LENGTH = 100
export const HABITS_PER_ENTRY_MAX = 100

// Returns the trimmed habit name, or { error } if it isn't usable.
export function normalizeHabitName(value) {
    if (typeof value !== "string") return { error: "Habit name must be text" }
    const name = value.trim()
    if (!name) return { error: "Habit name is required" }
    if (name.length > HABIT_NAME_MAX_LENGTH) {
        return { error: `Habit name can be at most ${HABIT_NAME_MAX_LENGTH} characters` }
    }
    return { name }
}

// Checks the input for saving an entry.
// Returns { ok: true, value: { date, mood, habits } } or { ok: false, message }.
//
// habits: names of the habits that were done that day. Not checked against the
// user's current habit list on purpose: past entries keep habits that were
// deleted later.
export function validateEntryInput(input, { now = new Date() } = {}) {
    const { date, mood, habits = [] } = input ?? {}

    if (!isValidDateKey(date)) {
        return { ok: false, message: "Date must be a valid day in the format YYYY-MM-DD" }
    }
    if (isFutureDateKey(date, now)) {
        return { ok: false, message: "Entries for future days are not allowed" }
    }

    if (!Number.isInteger(mood) || mood < MOOD_MIN || mood > MOOD_MAX) {
        return { ok: false, message: `Mood must be a whole number from ${MOOD_MIN} to ${MOOD_MAX}` }
    }

    if (!Array.isArray(habits)) {
        return { ok: false, message: "Habits must be a list" }
    }
    if (habits.length > HABITS_PER_ENTRY_MAX) {
        return { ok: false, message: `An entry can have at most ${HABITS_PER_ENTRY_MAX} habits` }
    }

    const names = []
    for (const habit of habits) {
        const { name, error } = normalizeHabitName(habit)
        if (error) return { ok: false, message: error }
        if (!names.includes(name)) names.push(name)
    }

    return { ok: true, value: { date, mood, habits: names } }
}
