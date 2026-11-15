import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { createDemoData, DEMO_HABITS } from "../src/lib/demoData.js"
import { addDays, isValidDateKey } from "../src/lib/dates.js"
import { validateEntryInput } from "../src/lib/validation.js"
import { averageMood, habitStreak } from "../src/lib/stats.js"

const TODAY = "2024-05-10"
const demo = createDemoData(TODAY)
const byDate = Object.fromEntries(demo.entries.map((entry) => [entry.date, entry]))

describe("createDemoData", () => {
    test("contains the demo habits", () => {
        assert.deepEqual(demo.habits, DEMO_HABITS.map((name) => ({ name })))
    })

    test("a few months of entries, one per day at most, oldest first", () => {
        const dates = demo.entries.map((entry) => entry.date)
        assert.ok(dates.length >= 90, `only ${dates.length} entries`)
        assert.equal(new Set(dates).size, dates.length, "no day twice")
        assert.deepEqual(dates, [...dates].sort())
    })

    test("today stays empty, yesterday is the latest entry", () => {
        assert.equal(byDate[TODAY], undefined)
        assert.equal(demo.entries.at(-1).date, addDays(TODAY, -1))
    })

    test("every entry passes the same validation as user input", () => {
        const now = new Date(`${TODAY}T12:00:00Z`)
        for (const entry of demo.entries) {
            assert.ok(isValidDateKey(entry.date), entry.date)
            const result = validateEntryInput(entry, { now })
            assert.ok(result.ok, `${entry.date}: ${result.message}`)
            assert.deepEqual(result.value, entry, "nothing changed by validation")
            assert.ok(entry.habits.every((name) => DEMO_HABITS.includes(name)))
        }
    })

    test("looks realistic: some skipped days, varied moods", () => {
        const recent = demo.entries.filter((entry) => entry.date > addDays(TODAY, -121))
        assert.ok(recent.length < 120 && recent.length > 90, `${recent.length} of 120 days`)
        const moods = new Set(demo.entries.map((entry) => entry.mood))
        assert.ok(moods.size >= 5, `only moods ${[...moods]}`)
    })

    test("Morning walk has a 12-day streak (today empty -> counted from yesterday)", () => {
        assert.equal(habitStreak(byDate, "Morning walk", TODAY), 12)
    })

    test("has entries older than a year, so 'Last Year' and 'Total' differ", () => {
        const year = averageMood(byDate, { todayKey: TODAY, days: 365 })
        const total = averageMood(byDate, { todayKey: TODAY })
        assert.ok(total.count > year.count)
        assert.ok(averageMood(byDate, { todayKey: TODAY, days: 7 }).count > 0)
    })

    test("same day -> same data; other day -> shifted dates", () => {
        assert.deepEqual(createDemoData(TODAY), demo)
        const other = createDemoData("2024-06-01")
        assert.equal(other.entries.at(-1).date, "2024-05-31")
        assert.equal(habitStreak(Object.fromEntries(other.entries.map((e) => [e.date, e])), "Morning walk", "2024-06-01"), 12)
    })
})
