import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { DASHBOARD_PATH, SETTINGS_PATH, isDashboardPath } from "../src/lib/routes.js"

describe("isDashboardPath", () => {
    test("the dashboard and its sub-pages belong to the dashboard area", () => {
        assert.equal(isDashboardPath(DASHBOARD_PATH), true)
        assert.equal(isDashboardPath(SETTINGS_PATH), true)
        assert.equal(isDashboardPath("/dashboard/"), true)
    })

    test("other pages don't", () => {
        for (const path of ["/", "/#how-it-works", "/dashboards", "/dashboard-old", "/about/dashboard", ""]) {
            assert.equal(isDashboardPath(path), false, path)
        }
    })

    test("no path (e.g. before the router knows it) is not the dashboard", () => {
        assert.equal(isDashboardPath(null), false)
        assert.equal(isDashboardPath(undefined), false)
    })
})
