import { addDays } from "./dates.js"

// Demo data for local mode: a few months of realistic entries, so the
// dashboard (calendar, averages, streaks) has something to show.
//
// - generated relative to the user's today (a day key from the browser)
// - today itself stays empty, so logging a new day can be tried right away
// - always the same data for the same day (fixed seed), so it is reproducible
// - moods tend to be higher on days with more habits done, and on weekends
// - "Morning walk" has a 12-day streak up to yesterday
//
// Relative imports only, so this runs in Node's test runner directly.

export const DEMO_HABITS = ["Morning walk", "Read 20 pages", "No phone after 10 pm", "Meditate"]

const RECENT_DAYS = 120         // daily history before today
const SKIP_CHANCE = 0.15        // share of days without entry
const STREAK_DAYS = 12          // Morning walk streak up to yesterday
const OLD_ENTRIES = 6           // entries more than a year ago
const OLD_START_DAYS_AGO = 400

// probability that each habit was done on a normal day
const HABIT_CHANCE = {
    "Morning walk": 0.6,
    "Read 20 pages": 0.5,
    "No phone after 10 pm": 0.4,
    "Meditate": 0.3,
}

// Small deterministic random number generator (mulberry32).
function createRandom(seed) {
    let state = seed >>> 0
    return function random() {
        state = (state + 0x6D2B79F5) >>> 0
        let t = state
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function isWeekend(dateKey) {
    const day = new Date(`${dateKey}T00:00:00Z`).getUTCDay()
    return day === 0 || day === 6
}

function clampMood(value) {
    return Math.min(10, Math.max(0, Math.round(value)))
}

// Returns { habits: [{ name }], entries: [{ date, mood, habits }] }, entries oldest first.
export function createDemoData(todayKey, { seed = 2024 } = {}) {
    const random = createRandom(seed)
    const entries = []

    // older history: a few entries more than a year ago, about one per month
    for (let i = OLD_ENTRIES - 1; i >= 0; i--) {
        const date = addDays(todayKey, -(OLD_START_DAYS_AGO + i * 30))
        entries.push({ date, mood: clampMood(3 + random() * 5), habits: [] })
    }

    // recent history: up to yesterday
    for (let daysAgo = RECENT_DAYS; daysAgo >= 1; daysAgo--) {
        const date = addDays(todayKey, -daysAgo)
        const inStreak = daysAgo <= STREAK_DAYS

        // skip some days, but never inside the streak (that would end it)
        if (!inStreak && random() < SKIP_CHANCE) continue

        const habits = DEMO_HABITS.filter((name) => {
            if (name === "Morning walk") {
                if (inStreak) return true
                if (daysAgo === STREAK_DAYS + 1) return false // the day before the streak
            }
            return random() < HABIT_CHANCE[name]
        })

        const noise = random() * 4 - 2
        const mood = clampMood(3.5 + habits.length * 1.1 + (isWeekend(date) ? 1 : 0) + noise)
        entries.push({ date, mood, habits })
    }

    return {
        habits: DEMO_HABITS.map((name) => ({ name })),
        entries,
    }
}
