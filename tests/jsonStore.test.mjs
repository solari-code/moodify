import { test, describe, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, mkdir, rm, readFile, writeFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { createJsonStore } from "../src/lib/store/jsonStore.js"

let dir, file, store

beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "moodify-test-"))
    file = path.join(dir, "nested", "moodify.json")
    store = createJsonStore(file)
})

afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
})

const ALICE = "alice"
const BOB = "bob"

describe("entries", () => {
    test("a new user has no entries", async () => {
        assert.deepEqual(await store.getEntries(ALICE), [])
        assert.equal(await store.getEntry(ALICE, "2024-05-10"), null)
    })

    test("saves an entry and reads it back", async () => {
        const saved = await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: ["Read"] })
        assert.equal(saved.date, "2024-05-10")
        assert.equal(saved.mood, 7)
        assert.deepEqual(saved.habits, ["Read"])
        assert.ok(saved.createdAt)
        assert.equal(saved.createdAt, saved.updatedAt)

        assert.deepEqual(await store.getEntry(ALICE, "2024-05-10"), saved)
        assert.deepEqual(await store.getEntries(ALICE), [saved])
    })

    test("saving the same day again overwrites it: one entry per day", async () => {
        const first = await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: ["Read"] })
        await new Promise((resolve) => setTimeout(resolve, 5))
        const second = await store.saveEntry(ALICE, { date: "2024-05-10", mood: 3, habits: [] })

        assert.equal(second.mood, 3)
        assert.deepEqual(second.habits, [])
        assert.equal(second.createdAt, first.createdAt, "createdAt is kept")
        assert.ok(second.updatedAt > first.updatedAt, "updatedAt changes")

        const entries = await store.getEntries(ALICE)
        assert.equal(entries.length, 1)
        assert.deepEqual(entries[0], second)
    })

    test("returns entries sorted by day, oldest first", async () => {
        for (const date of ["2024-05-10", "2023-12-31", "2024-01-15"]) {
            await store.saveEntry(ALICE, { date, mood: 5, habits: [] })
        }
        assert.deepEqual((await store.getEntries(ALICE)).map((e) => e.date), ["2023-12-31", "2024-01-15", "2024-05-10"])
    })

    test("deletes an entry", async () => {
        await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: [] })
        await store.saveEntry(ALICE, { date: "2024-05-11", mood: 8, habits: [] })

        assert.equal(await store.deleteEntry(ALICE, "2024-05-10"), true)
        assert.equal(await store.getEntry(ALICE, "2024-05-10"), null)
        assert.deepEqual((await store.getEntries(ALICE)).map((e) => e.date), ["2024-05-11"])

        assert.equal(await store.deleteEntry(ALICE, "2024-05-10"), false, "second delete finds nothing")
        assert.equal(await store.deleteEntry(BOB, "2024-05-11"), false, "can't delete another user's entry")
    })

    test("users only see their own entries", async () => {
        await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: [] })
        await store.saveEntry(BOB, { date: "2024-05-10", mood: 2, habits: [] })

        assert.equal((await store.getEntry(ALICE, "2024-05-10")).mood, 7)
        assert.equal((await store.getEntry(BOB, "2024-05-10")).mood, 2)
        assert.equal((await store.getEntries(ALICE)).length, 1)
    })

    test("returned entries are copies: changing them doesn't change the store", async () => {
        const saved = await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: ["Read"] })
        saved.habits.push("Walk")
        saved.mood = 1
        const loaded = await store.getEntry(ALICE, "2024-05-10")
        assert.equal(loaded.mood, 7)
        assert.deepEqual(loaded.habits, ["Read"])
    })

    test("data survives a new store instance (persisted to the file)", async () => {
        await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: ["Read"] })
        const reopened = createJsonStore(file)
        assert.equal((await reopened.getEntry(ALICE, "2024-05-10")).mood, 7)
    })
})

describe("concurrency and file safety", () => {
    test("parallel saves don't overwrite each other", async () => {
        const days = Array.from({ length: 25 }, (_, i) => `2024-03-${String(i + 1).padStart(2, "0")}`)
        await Promise.all(days.map((date, i) => store.saveEntry(ALICE, { date, mood: i % 11, habits: [] })))
        assert.equal((await store.getEntries(ALICE)).length, 25)
    })

    test("parallel saves of the same day still leave exactly one entry", async () => {
        await Promise.all([1, 2, 3, 4, 5].map((mood) => store.saveEntry(ALICE, { date: "2024-05-10", mood, habits: [] })))
        const entries = await store.getEntries(ALICE)
        assert.equal(entries.length, 1)
        assert.equal(entries[0].mood, 5, "last save wins")
    })

    test("a failed operation doesn't block the following ones", async () => {
        const broken = createJsonStore(path.join(dir, "broken.json"))
        await writeFile(path.join(dir, "broken.json"), "{ not json")
        await assert.rejects(broken.getEntries(ALICE))
        await writeFile(path.join(dir, "broken.json"), JSON.stringify({ version: 1, users: {} }))
        assert.deepEqual(await broken.getEntries(ALICE), [])
    })

    test("an unreadable file is never overwritten", async () => {
        const corruptFile = path.join(dir, "corrupt.json")
        await writeFile(corruptFile, "{ not json")
        const corrupt = createJsonStore(corruptFile)

        await assert.rejects(corrupt.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: [] }), /not valid JSON/)
        assert.equal(await readFile(corruptFile, "utf8"), "{ not json")
    })

    test("no temp files are left behind", async () => {
        await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: [] })
        assert.deepEqual(await readdir(path.dirname(file)), ["moodify.json"])
    })
})

describe("habits and entries together", () => {
    test("data from before entries existed still works", async () => {
        // a file written by the habits-only version (Bundle 1)
        await mkdir(path.dirname(file), { recursive: true })
        const legacy = { version: 1, users: { [ALICE]: { habits: [{ name: "Read" }] } } }
        await writeFile(file, JSON.stringify(legacy))

        assert.deepEqual(await store.getEntries(ALICE), [])
        await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: ["Read"] })
        assert.deepEqual(await store.getHabits(ALICE), [{ name: "Read" }])
        assert.equal((await store.getEntries(ALICE)).length, 1)
    })

    test("removing a habit keeps it in past entries", async () => {
        await store.addHabit(ALICE, { name: "Read" })
        await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: ["Read"] })
        await store.removeHabit(ALICE, "Read")

        assert.deepEqual(await store.getHabits(ALICE), [])
        assert.deepEqual((await store.getEntry(ALICE, "2024-05-10")).habits, ["Read"])
    })

    test("deleting an entry keeps the habits", async () => {
        await store.addHabit(ALICE, { name: "Read" })
        await store.saveEntry(ALICE, { date: "2024-05-10", mood: 7, habits: ["Read"] })
        await store.deleteEntry(ALICE, "2024-05-10")
        assert.deepEqual(await store.getHabits(ALICE), [{ name: "Read" }])
    })
})

describe("replaceUserData (demo data)", () => {
    test("replaces all habits and entries of the user", async () => {
        await store.addHabit(ALICE, { name: "Old habit" })
        await store.saveEntry(ALICE, { date: "2024-01-01", mood: 1, habits: ["Old habit"] })

        await store.replaceUserData(ALICE, {
            habits: [{ name: "Read" }, { name: "Walk" }],
            entries: [
                { date: "2024-05-08", mood: 6, habits: ["Read"] },
                { date: "2024-05-09", mood: 8, habits: ["Read", "Walk"] },
            ],
        })

        assert.deepEqual(await store.getHabits(ALICE), [{ name: "Read" }, { name: "Walk" }])
        const entries = await store.getEntries(ALICE)
        assert.deepEqual(entries.map((e) => [e.date, e.mood, e.habits]), [
            ["2024-05-08", 6, ["Read"]],
            ["2024-05-09", 8, ["Read", "Walk"]],
        ])
        assert.ok(entries.every((e) => e.createdAt && e.updatedAt))
    })

    test("keeps other users' data", async () => {
        await store.addHabit(BOB, { name: "Bob's habit" })
        await store.saveEntry(BOB, { date: "2024-05-09", mood: 3, habits: [] })

        await store.replaceUserData(ALICE, { habits: [], entries: [{ date: "2024-05-09", mood: 9, habits: [] }] })

        assert.deepEqual(await store.getHabits(BOB), [{ name: "Bob's habit" }])
        assert.equal((await store.getEntry(BOB, "2024-05-09")).mood, 3)
    })
})
