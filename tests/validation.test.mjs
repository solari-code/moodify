import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { validateEntryInput, normalizeHabitName, HABIT_NAME_MAX_LENGTH, HABITS_PER_ENTRY_MAX } from "../src/lib/validation.js"

const now = new Date("2024-05-10T12:00:00Z")
const valid = { date: "2024-05-10", mood: 7, habits: ["Read"] }

function check(input) {
    return validateEntryInput(input, { now })
}

describe("validateEntryInput", () => {
    test("accepts a valid entry", () => {
        assert.deepEqual(check(valid), { ok: true, value: valid })
    })

    test("accepts mood 0 and 10 and no habits", () => {
        assert.equal(check({ ...valid, mood: 0 }).ok, true)
        assert.equal(check({ ...valid, mood: 10 }).ok, true)
        assert.deepEqual(check({ date: "2024-05-10", mood: 5 }).value.habits, [])
        assert.deepEqual(check({ ...valid, habits: [] }).value.habits, [])
    })

    test("only returns known fields", () => {
        const result = check({ ...valid, userId: "someone-else", createdAt: "x" })
        assert.deepEqual(Object.keys(result.value).sort(), ["date", "habits", "mood"])
    })

    test("rejects invalid and future dates", () => {
        for (const date of [undefined, "2024-02-30", "10.05.2024", 123]) {
            assert.equal(check({ ...valid, date }).ok, false, String(date))
        }
        const future = check({ ...valid, date: "2024-05-12" })
        assert.equal(future.ok, false)
        assert.match(future.message, /future/)
    })

    test("rejects moods that aren't whole numbers from 0 to 10", () => {
        for (const mood of [undefined, null, -1, 11, 7.5, "7", NaN, Infinity]) {
            const result = check({ ...valid, mood })
            assert.equal(result.ok, false, String(mood))
            assert.match(result.message, /Mood/)
        }
    })

    test("trims habit names and removes duplicates", () => {
        assert.deepEqual(check({ ...valid, habits: [" Read ", "Read", "Walk"] }).value.habits, ["Read", "Walk"])
    })

    test("rejects invalid habit lists", () => {
        for (const habits of ["Read", { name: "Read" }, [""], ["   "], [42], [null], [{ name: "Read" }]]) {
            assert.equal(check({ ...valid, habits }).ok, false, JSON.stringify(habits))
        }
        const tooMany = Array.from({ length: HABITS_PER_ENTRY_MAX + 1 }, (_, i) => `Habit ${i}`)
        assert.equal(check({ ...valid, habits: tooMany }).ok, false)
    })

    test("handles missing input", () => {
        assert.equal(validateEntryInput(undefined).ok, false)
        assert.equal(validateEntryInput(null).ok, false)
    })
})

describe("normalizeHabitName", () => {
    test("trims valid names", () => {
        assert.deepEqual(normalizeHabitName("  Read  "), { name: "Read" })
    })

    test("rejects empty, non-text and too long names", () => {
        for (const value of ["", "   ", undefined, null, 5, {}]) {
            assert.ok(normalizeHabitName(value).error, String(value))
        }
        assert.ok(normalizeHabitName("x".repeat(HABIT_NAME_MAX_LENGTH)).name)
        assert.ok(normalizeHabitName("x".repeat(HABIT_NAME_MAX_LENGTH + 1)).error)
    })
})
