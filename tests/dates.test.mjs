import { test, describe, afterEach } from "node:test"
import assert from "node:assert/strict"
import { toDateKey, fromDateKey, isValidDateKey, latestAllowedDateKey, isFutureDateKey, addDays } from "../src/lib/dates.js"

// Node applies changes to process.env.TZ immediately, so each test can
// simulate a user (browser) in a different timezone.
const originalTz = process.env.TZ
afterEach(() => { process.env.TZ = originalTz })

describe("toDateKey", () => {
    test("uses the local calendar day, not the UTC day", () => {
        process.env.TZ = "Europe/Berlin"
        // Midnight May 10 in Berlin is still May 9 in UTC. The old
        // formatDateToUTC on a UTC server turned this into May 9.
        const picked = new Date(2024, 4, 10)
        assert.equal(picked.toISOString(), "2024-05-09T22:00:00.000Z")
        assert.equal(toDateKey(picked), "2024-05-10")
    })

    test("late evening west of UTC stays on the same day", () => {
        process.env.TZ = "Pacific/Pago_Pago" // UTC-11
        const lateEvening = new Date(2024, 11, 31, 23, 59)
        assert.equal(lateEvening.toISOString(), "2025-01-01T10:59:00.000Z")
        assert.equal(toDateKey(lateEvening), "2024-12-31")
    })

    test("pads month and day", () => {
        process.env.TZ = "UTC"
        assert.equal(toDateKey(new Date(2024, 0, 5)), "2024-01-05")
    })
})

describe("fromDateKey", () => {
    test("round-trips with toDateKey in several timezones", () => {
        for (const tz of ["UTC", "Europe/Berlin", "America/Los_Angeles", "Pacific/Kiritimati", "Pacific/Pago_Pago"]) {
            process.env.TZ = tz
            for (const key of ["2024-01-01", "2024-02-29", "2024-03-31", "2024-10-27", "2024-12-31"]) {
                assert.equal(toDateKey(fromDateKey(key)), key, `${key} in ${tz}`)
            }
        }
    })

    test("works on a day where local midnight doesn't exist (DST switch at midnight)", () => {
        process.env.TZ = "America/Sao_Paulo" // clocks jumped from 00:00 to 01:00 on 2018-11-04
        assert.equal(toDateKey(fromDateKey("2018-11-04")), "2018-11-04")
    })
})

describe("isValidDateKey", () => {
    test("accepts real days", () => {
        for (const key of ["2024-05-10", "2024-02-29", "1999-12-31", "2024-01-01"]) {
            assert.equal(isValidDateKey(key), true, key)
        }
    })

    test("rejects days that don't exist", () => {
        for (const key of ["2023-02-29", "2024-02-30", "2024-04-31", "2024-13-01", "2024-00-10", "2024-05-00"]) {
            assert.equal(isValidDateKey(key), false, key)
        }
    })

    test("rejects other formats and types", () => {
        for (const value of ["2024-5-10", "10.05.2024", "2024-05-10T00:00:00Z", " 2024-05-10", "", null, undefined, 20240510, new Date(), {}]) {
            assert.equal(isValidDateKey(value), false, String(value))
        }
    })
})

describe("future days (server side)", () => {
    test("allows every day that is already 'today' somewhere (up to UTC+14)", () => {
        // 09:59 UTC is 23:59 in UTC+14: May 11 hasn't started anywhere yet
        assert.equal(latestAllowedDateKey(new Date("2024-05-10T09:59:00Z")), "2024-05-10")
        // 10:00 UTC is midnight May 11 in UTC+14
        assert.equal(latestAllowedDateKey(new Date("2024-05-10T10:00:00Z")), "2024-05-11")
    })

    test("isFutureDateKey", () => {
        const now = new Date("2024-05-10T12:00:00Z")
        assert.equal(isFutureDateKey("2024-05-10", now), false)
        assert.equal(isFutureDateKey("2024-05-11", now), false) // already May 11 in UTC+14
        assert.equal(isFutureDateKey("2024-05-12", now), true)
        assert.equal(isFutureDateKey("2023-01-01", now), false)
    })
})

describe("addDays", () => {
    test("adds and subtracts days across month and year boundaries", () => {
        assert.equal(addDays("2024-05-10", 1), "2024-05-11")
        assert.equal(addDays("2024-05-31", 1), "2024-06-01")
        assert.equal(addDays("2024-01-01", -1), "2023-12-31")
        assert.equal(addDays("2024-03-01", -1), "2024-02-29")
        assert.equal(addDays("2023-03-01", -1), "2023-02-28")
        assert.equal(addDays("2024-05-10", -365), "2023-05-11")
        assert.equal(addDays("2024-05-10", 0), "2024-05-10")
    })

    test("is not affected by daylight saving changes in the local timezone", () => {
        for (const tz of ["Europe/Berlin", "America/New_York", "America/Sao_Paulo"]) {
            process.env.TZ = tz
            assert.equal(addDays("2024-03-31", -1), "2024-03-30", tz) // EU spring forward
            assert.equal(addDays("2024-10-27", 1), "2024-10-28", tz)  // EU fall back
            assert.equal(addDays("2024-03-10", 1), "2024-03-11", tz)  // US spring forward
            assert.equal(addDays("2018-11-04", -1), "2018-11-03", tz) // Sao Paulo midnight switch
        }
    })
})
