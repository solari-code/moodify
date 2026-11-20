import { isValidDateKey, isFutureDateKey } from "./dates.js"

// Input validation for server actions. Everything coming from the client is
// untrusted, so it is checked here before it reaches the store.
//
// Problems are returned as error codes; the UI shows the translated text
// (errors.<code> in src/i18n/messages/, filled in with LIMITS).
//
// Relative imports only, so this runs in Node's test runner directly.

export const MOOD_MIN = 0
export const MOOD_MAX = 10
export const HABIT_NAME_MAX_LENGTH = 100
export const HABITS_PER_ENTRY_MAX = 100
export const DISPLAY_NAME_MAX_LENGTH = 50

// The limits as values for the error messages, e.g. "at most {maxLength} characters".
export const LIMITS = {
    moodMin: MOOD_MIN,
    moodMax: MOOD_MAX,
    maxLength: HABIT_NAME_MAX_LENGTH,
    maxHabits: HABITS_PER_ENTRY_MAX,
    maxNameLength: DISPLAY_NAME_MAX_LENGTH,
}

// Returns { name } (trimmed), or { error: code } if it isn't usable.
export function normalizeHabitName(value) {
    if (typeof value !== "string") return { error: "habitNameNotText" }
    const name = value.trim()
    if (!name) return { error: "habitNameRequired" }
    if (name.length > HABIT_NAME_MAX_LENGTH) return { error: "habitNameTooLong" }
    return { name }
}

// The name the user wants to be called in the app (profile settings).
// Returns { name } (trimmed, whitespace such as line breaks collapsed to
// single spaces), { name: null } for an empty value (= use the account's
// name again), or { error: code }.
export function normalizeDisplayName(value) {
    if (typeof value !== "string") return { error: "displayNameNotText" }
    // other control characters (not whitespace) have no place in a name
    if (/[\u0000-\u0008\u000E-\u001F\u007F-\u009F]/.test(value)) return { error: "displayNameInvalid" }
    const name = value.replace(/\s+/g, " ").trim()
    if (!name) return { name: null }
    if (name.length > DISPLAY_NAME_MAX_LENGTH) return { error: "displayNameTooLong" }
    return { name }
}

// Checks the input for saving an entry.
// Returns { ok: true, value: { date, mood, habits } } or { ok: false, error: code }.
//
// habits: names of the habits that were done that day. Not checked against the
// user's current habit list on purpose: past entries keep habits that were
// deleted later.
export function validateEntryInput(input, { now = new Date() } = {}) {
    const { date, mood, habits = [] } = input ?? {}

    if (!isValidDateKey(date)) {
        return { ok: false, error: "invalidDate" }
    }
    if (isFutureDateKey(date, now)) {
        return { ok: false, error: "futureDate" }
    }

    if (!Number.isInteger(mood) || mood < MOOD_MIN || mood > MOOD_MAX) {
        return { ok: false, error: "invalidMood" }
    }

    if (!Array.isArray(habits)) {
        return { ok: false, error: "habitsNotList" }
    }
    if (habits.length > HABITS_PER_ENTRY_MAX) {
        return { ok: false, error: "tooManyHabits" }
    }

    const names = []
    for (const habit of habits) {
        const { name, error } = normalizeHabitName(habit)
        if (error) return { ok: false, error }
        if (!names.includes(name)) names.push(name)
    }

    return { ok: true, value: { date, mood, habits: names } }
}
