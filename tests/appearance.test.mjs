import { describe, test } from "node:test"
import assert from "node:assert/strict"
import vm from "node:vm"
import {
    APPEARANCE_CONFIG,
    COLOR_MODES,
    COLOR_MODE_COOKIE,
    DEFAULT_COLOR_MODE,
    DEFAULT_THEME,
    THEMES,
    THEME_COOKIE,
    appearanceScript,
    colorModeCookie,
    colorModeFromCookies,
    parseColorMode,
    parseTheme,
    themeCookie,
    themeFromCookies,
} from "../src/lib/appearance.js"

describe("appearance values", () => {
    test("light, dark and system; system is the default", () => {
        assert.deepEqual(COLOR_MODES, ["light", "dark", "system"])
        assert.equal(DEFAULT_COLOR_MODE, "system")
    })

    test("sage and three more themes; sage is the default", () => {
        assert.deepEqual(THEMES, ["sage", "ocean", "dusk", "clay"])
        assert.equal(DEFAULT_THEME, "sage")
    })

    test("unknown or missing values fall back to the defaults", () => {
        for (const value of [undefined, null, "", "Dark", "blue", 1]) {
            assert.equal(parseColorMode(value), "system", String(value))
            assert.equal(parseTheme(value), "sage", String(value))
        }
        assert.equal(parseColorMode("dark"), "dark")
        assert.equal(parseTheme("clay"), "clay")
    })

    test("the cookies can be read back", () => {
        for (const mode of COLOR_MODES) {
            for (const theme of THEMES) {
                const cookies = `moodify-locale=de; ${colorModeCookie(mode).split(";")[0]}; ${themeCookie(theme).split(";")[0]}; other=1`
                assert.equal(colorModeFromCookies(cookies), mode)
                assert.equal(themeFromCookies(cookies), theme)
            }
        }
        assert.equal(colorModeFromCookies(""), "system")
        assert.equal(themeFromCookies(undefined), "sage")
        // a cookie whose name only ends the same way doesn't count
        assert.equal(colorModeFromCookies(`x${COLOR_MODE_COOKIE}=dark`), "system")
        assert.equal(themeFromCookies(`x${THEME_COOKIE}=ocean`), "sage")
    })

    test("the cookies are kept for a year on the whole site", () => {
        for (const cookie of [colorModeCookie("dark"), themeCookie("ocean")]) {
            assert.match(cookie, /; path=\/;/)
            assert.match(cookie, /max-age=31536000/)
            assert.match(cookie, /samesite=lax/)
        }
    })
})

// Runs the inline <head> script against a minimal fake browser.
function runScript({ path, cookie = "", prefersDark = false }) {
    const classes = new Set()
    const attributes = {}
    const root = {
        classList: { toggle: (name, on) => (on ? classes.add(name) : classes.delete(name)) },
        setAttribute: (name, value) => { attributes[name] = value },
    }
    const context = {
        location: { pathname: path },
        document: { cookie, documentElement: root },
        window: { matchMedia: (query) => ({ matches: query === "(prefers-color-scheme: dark)" && prefersDark }) },
    }
    vm.runInNewContext(appearanceScript(), context)
    return {
        dark: classes.has("dark"),
        mode: attributes["data-color-mode"] ?? null,
        theme: attributes["data-theme"] ?? null,
    }
}

const cookies = (mode, theme) => [
    mode && `${COLOR_MODE_COOKIE}=${mode}`,
    theme && `${THEME_COOKIE}=${theme}`,
].filter(Boolean).join("; ")

describe("appearance script (before the first paint)", () => {
    test("applies the chosen mode and theme on dashboard pages", () => {
        for (const path of ["/dashboard", "/dashboard/settings"]) {
            assert.deepEqual(runScript({ path, cookie: cookies("dark", "ocean") }), { dark: true, mode: "dark", theme: "ocean" })
            assert.deepEqual(runScript({ path, cookie: cookies("light", "clay"), prefersDark: true }), { dark: false, mode: "light", theme: "clay" })
        }
    })

    test("without cookies: system mode (following the device) and sage", () => {
        assert.deepEqual(runScript({ path: "/dashboard", prefersDark: true }), { dark: true, mode: "system", theme: "sage" })
        assert.deepEqual(runScript({ path: "/dashboard", prefersDark: false }), { dark: false, mode: "system", theme: "sage" })
        assert.deepEqual(runScript({ path: "/dashboard", cookie: cookies("system", "dusk"), prefersDark: true }), { dark: true, mode: "system", theme: "dusk" })
    })

    test("unknown cookie values fall back to the defaults", () => {
        assert.deepEqual(runScript({ path: "/dashboard", cookie: cookies("neon", "plaid"), prefersDark: true }), { dark: true, mode: "system", theme: "sage" })
    })

    test("leaves every other page light sage", () => {
        for (const path of ["/", "/dashboards", "/not-found"]) {
            assert.deepEqual(runScript({ path, cookie: cookies("dark", "ocean"), prefersDark: true }), { dark: false, mode: null, theme: null })
        }
    })

    test("never throws (e.g. without matchMedia)", () => {
        const context = { location: { pathname: "/dashboard" }, document: { cookie: "", documentElement: {} }, window: {} }
        assert.doesNotThrow(() => vm.runInNewContext(appearanceScript(), context))
    })

    test("the config in the script matches the module", () => {
        assert.ok(appearanceScript().includes(JSON.stringify(APPEARANCE_CONFIG)))
    })
})
