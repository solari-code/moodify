import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { averageMood, habitStreak, habitStreaks, MOOD_PERIODS } from "../src/lib/stats.js"

const TODAY = "2024-05-10"

// helper: { "YYYY-MM-DD": [mood, [habits]] } -> entriesByDate
function entries(spec) {
    return Object.fromEntries(Object.entries(spec).map(([date, [mood, habits = []]]) => [date, { mood, habits }]))
}

describe("averageMood", () => {
    test("no entries -> no average", () => {
        assert.deepEqual(averageMood({}, { todayKey: TODAY, days: 7 }), { average: null, count: 0 })
        assert.deepEqual(averageMood({}, { todayKey: TODAY }), { average: null, count: 0 })
    })

    test("averages only the logged days, rounded to one decimal", () => {
        const data = entries({ "2024-05-10": [7], "2024-05-09": [8], "2024-05-07": [8] })
        assert.deepEqual(averageMood(data, { todayKey: TODAY, days: 7 }), { average: 7.7, count: 3 })
    })

    test("the 7-day window includes today and the 6 days before", () => {
        const data = entries({ "2024-05-04": [10], "2024-05-03": [0] })
        assert.deepEqual(averageMood(data, { todayKey: TODAY, days: 7 }), { average: 10, count: 1 })
    })

    test("each period only counts its own days", () => {
        const data = entries({
            "2024-05-10": [10],
            "2024-04-20": [5],  // 20 days ago
            "2023-12-01": [0],  // ~160 days ago
            "2022-01-01": [3],  // more than a year ago
        })
        const avg = (period) => averageMood(data, { todayKey: TODAY, days: MOOD_PERIODS[period].days })
        assert.deepEqual(avg("week"), { average: 10, count: 1 })
        assert.deepEqual(avg("month"), { average: 7.5, count: 2 })
        assert.deepEqual(avg("year"), { average: 5, count: 3 })
        assert.deepEqual(avg("total"), { average: 4.5, count: 4 })
    })

    test("period boundaries: first day inside, day before outside", () => {
        // 30-day window ending 2024-05-10 starts 2024-04-11
        const data = entries({ "2024-04-11": [4], "2024-04-10": [9] })
        assert.deepEqual(averageMood(data, { todayKey: TODAY, days: 30 }), { average: 4, count: 1 })
    })

    test("windows don't include days after today", () => {
        const data = entries({ "2024-05-11": [0], "2024-05-10": [6] })
        assert.deepEqual(averageMood(data, { todayKey: TODAY, days: 7 }), { average: 6, count: 1 })
    })

    test("mood 0 counts", () => {
        const data = entries({ "2024-05-10": [0], "2024-05-09": [10] })
        assert.deepEqual(averageMood(data, { todayKey: TODAY, days: 7 }), { average: 5, count: 2 })
    })
})

describe("habitStreak", () => {
    test("counts consecutive days up to today", () => {
        const data = entries({ "2024-05-10": [5, ["Read"]], "2024-05-09": [5, ["Read"]], "2024-05-08": [5, ["Read"]], "2024-05-06": [5, ["Read"]] })
        assert.equal(habitStreak(data, "Read", TODAY), 3)
    })

    test("today not logged yet: counting starts yesterday", () => {
        const data = entries({ "2024-05-09": [5, ["Read"]], "2024-05-08": [5, ["Read"]] })
        assert.equal(habitStreak(data, "Read", TODAY), 2)
    })

    test("today logged without the habit: streak is 0", () => {
        const data = entries({ "2024-05-10": [5, []], "2024-05-09": [5, ["Read"]] })
        assert.equal(habitStreak(data, "Read", TODAY), 0)
    })

    test("a day without entry ends the streak", () => {
        const data = entries({ "2024-05-10": [5, ["Read"]], "2024-05-08": [5, ["Read"]] })
        assert.equal(habitStreak(data, "Read", TODAY), 1)
    })

    test("neither today nor yesterday logged: streak is 0", () => {
        const data = entries({ "2024-05-08": [5, ["Read"]], "2024-05-07": [5, ["Read"]] })
        assert.equal(habitStreak(data, "Read", TODAY), 0)
    })

    test("no entries: streak is 0", () => {
        assert.equal(habitStreak({}, "Read", TODAY), 0)
    })

    test("works across month and year boundaries", () => {
        const data = entries({ "2024-01-01": [5, ["Read"]], "2023-12-31": [5, ["Read"]], "2023-12-30": [5, ["Read"]] })
        assert.equal(habitStreak(data, "Read", "2024-01-01"), 3)
    })

    test("habit names must match exactly", () => {
        const data = entries({ "2024-05-10": [5, ["read"]] })
        assert.equal(habitStreak(data, "Read", TODAY), 0)
    })
})

describe("habitStreaks", () => {
    test("one streak per current habit, in habit-list order; deleted habits are not listed", () => {
        const data = entries({
            "2024-05-10": [5, ["Walk", "Old habit"]],
            "2024-05-09": [5, ["Read", "Walk", "Old habit"]],
        })
        const habits = [{ name: "Read" }, { name: "Walk" }, { name: "Yoga" }]
        assert.deepEqual(habitStreaks(data, habits, TODAY), [
            { name: "Read", streak: 0 },
            { name: "Walk", streak: 2 },
            { name: "Yoga", streak: 0 },
        ])
    })
})
