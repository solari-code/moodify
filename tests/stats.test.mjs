import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { averageMood, habitStreak, habitStreaks, MOOD_PERIODS, MOOD_CHART_RANGES, moodSeries, habitHeatmap, HEATMAP_LEVELS, habitCompletion } from "../src/lib/stats.js"

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

// TODAY (2024-05-10) is a Friday.

describe("moodSeries", () => {
    test("one point per day of the range, oldest first, ending today", () => {
        const series = moodSeries({}, { todayKey: TODAY, days: 7 })
        assert.equal(series.length, 7)
        assert.equal(series[0].date, "2024-05-04")
        assert.equal(series[6].date, TODAY)
    })

    test("days without entry are gaps (null), mood 0 stays 0", () => {
        const data = entries({ "2024-05-10": [0], "2024-05-08": [6, ["Read"]] })
        const series = moodSeries(data, { todayKey: TODAY, days: 3 })
        assert.deepEqual(series.map((point) => point.mood), [6, null, 0])
        assert.deepEqual(series.map((point) => point.habits), [["Read"], [], []])
    })

    test("rolling 7-day average of the logged days, including days before the range", () => {
        const data = entries({
            "2024-05-10": [8],
            "2024-05-05": [4],  // 5 days before today: inside today's 7-day window
            "2024-05-03": [10], // outside today's window, inside the window of 2024-05-09
        })
        const series = moodSeries(data, { todayKey: TODAY, days: 2 })
        assert.deepEqual(series.map((point) => [point.date, point.mood, point.average]), [
            ["2024-05-09", null, 7],  // (4 + 10) / 2
            ["2024-05-10", 8, 6],     // (8 + 4) / 2
        ])
    })

    test("average is null when no day of its window is logged, rounded to one decimal otherwise", () => {
        const data = entries({ "2024-05-10": [7], "2024-05-09": [8], "2024-05-08": [8] })
        const series = moodSeries(data, { todayKey: TODAY, days: 10 })
        assert.equal(series[0].average, null)          // 2024-05-01: nothing logged in the 7 days before
        assert.equal(series.at(-1).average, 7.7)
    })

    test("the average window can be changed", () => {
        const data = entries({ "2024-05-10": [10], "2024-05-09": [0] })
        const series = moodSeries(data, { todayKey: TODAY, days: 1, averageDays: 1 })
        assert.equal(series[0].average, 10)
    })

    test("works for every chart range", () => {
        for (const { days } of Object.values(MOOD_CHART_RANGES)) {
            const series = moodSeries({}, { todayKey: TODAY, days })
            assert.equal(series.length, days)
            assert.equal(series.at(-1).date, TODAY)
        }
    })
})

describe("habitHeatmap", () => {
    const cell = (heatmap, date) => heatmap.weeks.flat().find((c) => c.date === date)

    test("weeks × 7 days, the last column contains today, columns start on Monday by default", () => {
        const heatmap = habitHeatmap({}, { todayKey: TODAY, weeks: 53 })
        assert.equal(heatmap.weeks.length, 53)
        assert.ok(heatmap.weeks.every((week) => week.length === 7))
        assert.equal(heatmap.weeks[0][0].date, "2023-05-08")   // a Monday, 52 weeks before this week's Monday
        assert.deepEqual(heatmap.weeks.at(-1).map((c) => c.date), [
            "2024-05-06", "2024-05-07", "2024-05-08", "2024-05-09", "2024-05-10", "2024-05-11", "2024-05-12",
        ])
    })

    test("weeks can start on Sunday", () => {
        const heatmap = habitHeatmap({}, { todayKey: TODAY, weeks: 2, weekStartsOn: 0 })
        assert.equal(heatmap.weeks[0][0].date, "2024-04-28")   // Sunday
        assert.equal(heatmap.weeks[1][5].date, TODAY)          // Friday in the last column
    })

    test("today on the first day of the week: the last column only has today", () => {
        const heatmap = habitHeatmap({}, { todayKey: "2024-05-13", weeks: 1 }) // Monday
        assert.deepEqual(heatmap.weeks[0].map((c) => c.future), [false, true, true, true, true, true, true])
    })

    test("days after today are future cells and ignore any data", () => {
        const data = entries({ "2024-05-11": [5, ["A"]] })
        const heatmap = habitHeatmap(data, { todayKey: TODAY, weeks: 1 })
        assert.deepEqual(cell(heatmap, "2024-05-11"), { date: "2024-05-11", future: true, hasEntry: false, done: 0, level: null })
        assert.equal(heatmap.max, 0)
    })

    test("level = habits done, relative to the busiest day, in quarters", () => {
        const data = entries({
            "2024-05-06": [5, []],
            "2024-05-07": [5, ["A"]],
            "2024-05-08": [5, ["A", "B"]],
            "2024-05-09": [5, ["A", "B", "C"]],
            "2024-05-10": [5, ["A", "B", "C", "D"]],
        })
        const heatmap = habitHeatmap(data, { todayKey: TODAY, weeks: 1 })
        assert.equal(heatmap.max, 4)
        assert.deepEqual(heatmap.weeks[0].map((c) => c.level), [0, 1, 2, 3, 4, null, null])
        assert.deepEqual(cell(heatmap, "2024-05-08"), { date: "2024-05-08", future: false, hasEntry: true, done: 2, level: 2 })
    })

    test("levels round up, so every done habit shows", () => {
        const data = entries({ "2024-05-07": [5, ["A"]], "2024-05-08": [5, ["A", "B"]], "2024-05-09": [5, ["A", "B", "C"]] })
        const heatmap = habitHeatmap(data, { todayKey: TODAY, weeks: 1 })
        assert.equal(cell(heatmap, "2024-05-07").level, 2)  // 1 of max 3
        assert.equal(cell(heatmap, "2024-05-08").level, 3)  // 2 of max 3
        assert.equal(cell(heatmap, "2024-05-09").level, HEATMAP_LEVELS)
    })

    test("doesn't depend on the habit list: habits deleted later still count for their day", () => {
        const data = entries({ "2024-05-09": [5, ["A", "Old 1", "Old 2"]], "2024-05-10": [5, ["A"]] })
        const heatmap = habitHeatmap(data, { todayKey: TODAY, weeks: 1 })
        assert.equal(cell(heatmap, "2024-05-09").done, 3)
        assert.equal(cell(heatmap, "2024-05-09").level, HEATMAP_LEVELS)
        assert.equal(cell(heatmap, "2024-05-10").level, 2)
    })

    test("the busiest day is searched in the grid only", () => {
        const data = entries({ "2024-05-10": [5, ["A"]], "2024-05-01": [5, ["A", "B", "C", "D"]] }) // 05-01 is before the 1-week grid
        const heatmap = habitHeatmap(data, { todayKey: TODAY, weeks: 1 })
        assert.equal(heatmap.max, 1)
        assert.equal(cell(heatmap, TODAY).level, HEATMAP_LEVELS)
    })

    test("a logged day without habits is level 0", () => {
        const heatmap = habitHeatmap(entries({ "2024-05-09": [5] }), { todayKey: TODAY, weeks: 1 })
        assert.equal(cell(heatmap, "2024-05-09").level, 0)
        assert.equal(cell(heatmap, "2024-05-08").level, null)
    })

    test("one habit: full level when done, 0 when logged without it, null without entry", () => {
        const data = entries({ "2024-05-08": [5, ["A", "B"]], "2024-05-09": [5, ["B"]] })
        const heatmap = habitHeatmap(data, { todayKey: TODAY, habit: "A", weeks: 1 })
        assert.deepEqual(
            ["2024-05-07", "2024-05-08", "2024-05-09"].map((date) => [cell(heatmap, date).level, cell(heatmap, date).done]),
            [[null, 0], [HEATMAP_LEVELS, 1], [0, 0]]
        )
        assert.equal(heatmap.max, 1)
    })

    test("counts logged and active days inside the grid only", () => {
        const data = entries({
            "2024-05-10": [5, ["A"]],
            "2024-05-09": [5, []],
            "2024-05-01": [5, ["A"]],   // before the 1-week grid
        })
        const heatmap = habitHeatmap(data, { todayKey: TODAY, weeks: 1 })
        assert.equal(heatmap.loggedDays, 2)
        assert.equal(heatmap.activeDays, 1)
    })

    test("month labels at the columns where a month starts", () => {
        // 6 weeks: columns start 2024-04-01, 04-08, 04-15, 04-22, 04-29, 05-06
        const heatmap = habitHeatmap({}, { todayKey: TODAY, weeks: 6 })
        assert.deepEqual(heatmap.monthLabels, [{ week: 0, month: "2024-04" }, { week: 4, month: "2024-05" }])
    })

    test("the first column gets its own month label, unless the next label is too close", () => {
        // 5 weeks from 04-08: May starts in column 3 -> April is labeled at column 0
        assert.deepEqual(habitHeatmap({}, { todayKey: TODAY, weeks: 5 }).monthLabels,
            [{ week: 0, month: "2024-04" }, { week: 3, month: "2024-05" }])
        // 4 weeks from 04-15: May starts in column 2 -> no April label
        assert.deepEqual(habitHeatmap({}, { todayKey: TODAY, weeks: 4 }).monthLabels,
            [{ week: 2, month: "2024-05" }])
    })

    test("a month that starts after today gets no label", () => {
        // today Thursday 2024-05-30; June 1 is in the last column, but in the future
        const heatmap = habitHeatmap({}, { todayKey: "2024-05-30", weeks: 2 })
        assert.ok(heatmap.monthLabels.every((label) => label.month !== "2024-06"))
    })
})

describe("habitCompletion", () => {
    const habits = [{ name: "Read" }, { name: "Walk" }]

    test("share of habits done on the logged days of the period", () => {
        const data = entries({
            "2024-05-10": [5, ["Read", "Walk"]],
            "2024-05-09": [5, ["Read"]],
            "2024-05-07": [5, []],
            "2024-05-01": [5, ["Read", "Walk"]],   // outside the 7-day window
        })
        assert.deepEqual(habitCompletion(data, habits, { todayKey: TODAY, days: 7 }), {
            rate: 3 / 6,
            done: 3,
            possible: 6,
            loggedDays: 3,
            perHabit: [
                { name: "Read", done: 2, loggedDays: 3, rate: 2 / 3 },
                { name: "Walk", done: 1, loggedDays: 3, rate: 1 / 3 },
            ],
        })
    })

    test("days without entry don't count as missed", () => {
        const data = entries({ "2024-05-10": [5, ["Read", "Walk"]] })
        assert.equal(habitCompletion(data, habits, { todayKey: TODAY, days: 30 }).rate, 1)
    })

    test("deleted habits and days after today are not counted", () => {
        const data = entries({ "2024-05-10": [5, ["Read", "Old habit"]], "2024-05-11": [5, ["Read", "Walk"]] })
        const result = habitCompletion(data, habits, { todayKey: TODAY, days: 7 })
        assert.equal(result.done, 1)
        assert.equal(result.possible, 2)
    })

    test("days: null uses all entries up to today", () => {
        const data = entries({ "2024-05-10": [5, ["Read"]], "2020-01-01": [5, ["Read"]] })
        assert.equal(habitCompletion(data, habits, { todayKey: TODAY }).perHabit[0].done, 2)
    })

    test("no logged days or no habits: no rate", () => {
        assert.deepEqual(habitCompletion({}, habits, { todayKey: TODAY, days: 7 }).rate, null)
        assert.deepEqual(habitCompletion({}, habits, { todayKey: TODAY, days: 7 }).perHabit.map((h) => h.rate), [null, null])
        assert.deepEqual(habitCompletion(entries({ "2024-05-10": [5] }), [], { todayKey: TODAY, days: 7 }),
            { rate: null, done: 0, possible: 0, loggedDays: 1, perHabit: [] })
    })
})
