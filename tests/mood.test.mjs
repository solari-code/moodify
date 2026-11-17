import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { moodColor, moodEmoji } from "../src/lib/mood.js"

describe("moodColor", () => {
    test("maps each mood to its step of the scale", () => {
        assert.equal(moodColor(0), "hsl(var(--mood-0))")
        assert.equal(moodColor(7), "hsl(var(--mood-7))")
        assert.equal(moodColor(10), "hsl(var(--mood-10))")
    })

    test("rounds averages and clamps to 0–10", () => {
        assert.equal(moodColor(6.4), "hsl(var(--mood-6))")
        assert.equal(moodColor(6.5), "hsl(var(--mood-7))")
        assert.equal(moodColor(-2), "hsl(var(--mood-0))")
        assert.equal(moodColor(12), "hsl(var(--mood-10))")
    })

    test("optional alpha", () => {
        assert.equal(moodColor(3, 0.25), "hsl(var(--mood-3) / 0.25)")
    })

    test("no valid number -> neutral color", () => {
        assert.equal(moodColor(null), "hsl(var(--muted-foreground))")
        assert.equal(moodColor(undefined), "hsl(var(--muted-foreground))")
        assert.equal(moodColor(NaN), "hsl(var(--muted-foreground))")
    })
})

describe("moodEmoji", () => {
    test("one emoji per mood, fallback for unknown values", () => {
        assert.equal(moodEmoji(0), "😭")
        assert.equal(moodEmoji(10), "😍")
        assert.equal(moodEmoji(11), "🤷‍♂️")
    })
})

