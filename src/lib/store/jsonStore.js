import { promises as fs } from "node:fs"
import path from "node:path"

// Local-mode storage: everything is kept in one JSON file.
//
// File layout:
// {
//   "version": 1,
//   "users": {
//     "<userId>": {
//       "habits": [{ "name": "Read" }],
//       "entries": {
//         "2024-05-10": { "mood": 7, "habits": ["Read"], "createdAt": "...", "updatedAt": "..." }
//       }
//     }
//   }
// }
//
// Entries are keyed by their day ("YYYY-MM-DD"), so there can only ever be
// one entry per user and day: saving the same day again overwrites it.
//
// Meant for a single local dev/test server process. All operations on a file
// go through a queue so concurrent server actions can't overwrite each other,
// and writes go to a temp file first and are then renamed, so a crash while
// writing never leaves a half-written file behind.

export const DEFAULT_DATA_FILE = path.join(process.cwd(), ".data", "moodify.json")

export function createJsonStore(filePath = DEFAULT_DATA_FILE) {

    // Runs `fn(user)` for one user and saves the file afterwards.
    function updateUser(userId, fn) {
        return withFileLock(filePath, async () => {
            const data = await readData(filePath)
            data.users[userId] = normalizeUser(data.users[userId])
            const result = fn(data.users[userId])
            await writeData(filePath, data)
            return result
        })
    }

    function readUser(userId, fn) {
        return withFileLock(filePath, async () => {
            const data = await readData(filePath)
            return fn(normalizeUser(data.users[userId]))
        })
    }

    return {
        getHabits(userId) {
            return readUser(userId, (user) => user.habits.map((habit) => ({ name: habit.name })))
        },

        addHabit(userId, habit) {
            return updateUser(userId, (user) => {
                user.habits.push({ name: habit.name })
            })
        },

        removeHabit(userId, habitName) {
            return updateUser(userId, (user) => {
                user.habits = user.habits.filter((habit) => habit.name !== habitName)
            })
        },

        // All entries of the user, oldest first.
        getEntries(userId) {
            return readUser(userId, (user) =>
                Object.keys(user.entries)
                    .sort()
                    .map((date) => toEntry(date, user.entries[date]))
            )
        },

        getEntry(userId, date) {
            return readUser(userId, (user) =>
                user.entries[date] ? toEntry(date, user.entries[date]) : null
            )
        },

        // Creates the entry for the day or overwrites the existing one
        // (createdAt of an existing entry is kept).
        saveEntry(userId, { date, mood, habits }) {
            return updateUser(userId, (user) => {
                const now = new Date().toISOString()
                const existing = user.entries[date]
                user.entries[date] = {
                    mood,
                    habits: [...habits],
                    createdAt: existing?.createdAt ?? now,
                    updatedAt: now,
                }
                return toEntry(date, user.entries[date])
            })
        },

        // Returns true if an entry was deleted, false if there was none.
        deleteEntry(userId, date) {
            return updateUser(userId, (user) => {
                if (!user.entries[date]) return false
                delete user.entries[date]
                return true
            })
        },

        // Replaces all habits and entries of one user (other users are kept).
        // Local mode only (demo data); the MongoDB store has no equivalent on purpose.
        replaceUserData(userId, { habits, entries }) {
            return updateUser(userId, (user) => {
                const now = new Date().toISOString()
                user.habits = habits.map((habit) => ({ name: habit.name }))
                user.entries = Object.fromEntries(entries.map((entry) => [
                    entry.date,
                    { mood: entry.mood, habits: [...entry.habits], createdAt: now, updatedAt: now },
                ]))
            })
        },
    }
}

function emptyData() {
    return { version: 1, users: {} }
}

// Fills in missing fields, e.g. for users saved before entries existed.
function normalizeUser(user) {
    return {
        ...user,
        habits: user?.habits ?? [],
        entries: user?.entries ?? {},
    }
}

// The entry as returned to callers: plain data, a copy of the stored object.
function toEntry(date, stored) {
    return {
        date,
        mood: stored.mood,
        habits: [...(stored.habits ?? [])],
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
    }
}

async function readData(filePath) {
    let raw
    try {
        raw = await fs.readFile(filePath, "utf8")
    } catch (error) {
        if (error.code === "ENOENT") return emptyData()
        throw error
    }

    try {
        const data = JSON.parse(raw)
        data.users ??= {}
        return data
    } catch {
        // Never overwrite a file we can't read; it may contain the user's test data.
        throw new Error(`Moodify: the local data file ${filePath} is not valid JSON. Fix or delete it.`)
    }
}

async function writeData(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    const tempFile = `${filePath}.${process.pid}.tmp`
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2))
    await fs.rename(tempFile, filePath)
}

// One queue per file, kept on globalThis so it survives hot reloads in development.
function withFileLock(filePath, fn) {
    const locks = (globalThis.__moodifyJsonStoreLocks ??= new Map())
    const previous = locks.get(filePath) ?? Promise.resolve()
    const run = previous.then(fn)
    // The next operation waits for this one, whether it succeeded or failed.
    locks.set(filePath, run.catch(() => {}))
    return run
}
