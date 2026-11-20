import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { validateEntryInput, normalizeHabitName, normalizeDisplayName, HABIT_NAME_MAX_LENGTH, HABITS_PER_ENTRY_MAX, DISPLAY_NAME_MAX_LENGTH, LIMITS } from "../src/lib/validation.js"

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
        assert.equal(future.error, "futureDate")
    })

    test("rejects moods that aren't whole numbers from 0 to 10", () => {
        for (const mood of [undefined, null, -1, 11, 7.5, "7", NaN, Infinity]) {
            const result = check({ ...valid, mood })
            assert.equal(result.ok, false, String(mood))
            assert.equal(result.error, "invalidMood")
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
        assert.equal(normalizeHabitName("   ").error, "habitNameRequired")
        assert.equal(normalizeHabitName(5).error, "habitNameNotText")
        assert.ok(normalizeHabitName("x".repeat(HABIT_NAME_MAX_LENGTH)).name)
        assert.equal(normalizeHabitName("x".repeat(HABIT_NAME_MAX_LENGTH + 1)).error, "habitNameTooLong")
    })
})

describe("normalizeDisplayName", () => {
    test("trims and collapses whitespace (also line breaks and tabs)", () => {
        assert.deepEqual(normalizeDisplayName("  Ada   Lovelace "), { name: "Ada Lovelace" })
        assert.deepEqual(normalizeDisplayName("Ada\n\tLovelace"), { name: "Ada Lovelace" })
    })

    test("keeps letters of any language and emojis", () => {
        assert.deepEqual(normalizeDisplayName("Zoë Müller-Núñez 🌱"), { name: "Zoë Müller-Núñez 🌱" })
    })

    test("empty or only spaces means: no name of its own (null)", () => {
        assert.deepEqual(normalizeDisplayName(""), { name: null })
        assert.deepEqual(normalizeDisplayName("   "), { name: null })
    })

    test("at most 50 characters (after trimming)", () => {
        assert.equal(DISPLAY_NAME_MAX_LENGTH, 50)
        assert.equal(LIMITS.maxNameLength, 50)
        assert.deepEqual(normalizeDisplayName("x".repeat(50)), { name: "x".repeat(50) })
        assert.deepEqual(normalizeDisplayName(`  ${"x".repeat(50)}  `), { name: "x".repeat(50) })
        assert.deepEqual(normalizeDisplayName("x".repeat(51)), { error: "displayNameTooLong" })
    })

    test("rejects control characters", () => {
        assert.deepEqual(normalizeDisplayName("Ada\u0000"), { error: "displayNameInvalid" })
        assert.deepEqual(normalizeDisplayName("Ada\u0007"), { error: "displayNameInvalid" })
        assert.deepEqual(normalizeDisplayName("Ada\u009F"), { error: "displayNameInvalid" })
    })

    test("rejects anything that isn't text", () => {
        for (const value of [undefined, null, 42, {}, ["Ada"]]) {
            assert.deepEqual(normalizeDisplayName(value), { error: "displayNameNotText" }, String(value))
        }
    })
})
