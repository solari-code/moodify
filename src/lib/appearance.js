import { DASHBOARD_PATH } from "./routes.js"

// Appearance of the dashboard: the color theme (sage, ocean, dusk, clay) and
// the color mode (light, dark or the device's setting). The landing page
// always keeps the light sage look.
//
// Both choices are kept in cookies (like the language), so they survive
// reloads and the server can render the settings page with the right options
// chosen. They are applied on <html>: data-theme="<theme>" picks the theme's
// colors and the `dark` class its dark palette (Tailwind's dark mode, see
// globals.css), so the navigation, the page background and everything that
// opens in a portal (dialogs, menus) follow them.
//
// No flicker on page load: an inline script in <head> (appearanceScript)
// applies them before the first paint. While the app runs, the dashboard
// layout keeps them up to date (src/components/appearance/).
//
// Relative imports only, so this runs in Node's test runner directly.

export const COLOR_MODES = ["light", "dark", "system"]
export const DEFAULT_COLOR_MODE = "system"

// The themes, in the order of the settings. Each has a light and a dark
// palette in globals.css ([data-theme="<theme>"]).
export const THEMES = ["sage", "ocean", "dusk", "clay"]
export const DEFAULT_THEME = "sage"

export const COLOR_MODE_COOKIE = "moodify-color-mode"
export const THEME_COOKIE = "moodify-theme"
export const APPEARANCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // one year, in seconds

export function isColorMode(value) {
    return typeof value === "string" && COLOR_MODES.includes(value)
}

export function isTheme(value) {
    return typeof value === "string" && THEMES.includes(value)
}

// The chosen mode / theme, or the default for missing or unknown values.
export function parseColorMode(value) {
    return isColorMode(value) ? value : DEFAULT_COLOR_MODE
}

export function parseTheme(value) {
    return isTheme(value) ? value : DEFAULT_THEME
}

// One cookie's value from a Cookie header / document.cookie ("a=1; b=2").
function readCookie(cookieString, name) {
    const prefix = `${name}=`
    return String(cookieString ?? "").split(/;\s*/).find((part) => part.startsWith(prefix))?.slice(prefix.length)
}

export function colorModeFromCookies(cookieString) {
    return parseColorMode(readCookie(cookieString, COLOR_MODE_COOKIE))
}

export function themeFromCookies(cookieString) {
    return parseTheme(readCookie(cookieString, THEME_COOKIE))
}

// The Set-Cookie values for document.cookie.
function cookie(name, value) {
    return `${name}=${value}; path=/; max-age=${APPEARANCE_COOKIE_MAX_AGE}; samesite=lax`
}

export function colorModeCookie(mode) {
    return cookie(COLOR_MODE_COOKIE, parseColorMode(mode))
}

export function themeCookie(theme) {
    return cookie(THEME_COOKIE, parseTheme(theme))
}

// What applyAppearance needs to know (passed in: it can't import anything).
export const APPEARANCE_CONFIG = {
    modeCookie: COLOR_MODE_COOKIE,
    modes: COLOR_MODES,
    defaultMode: DEFAULT_COLOR_MODE,
    themeCookie: THEME_COOKIE,
    themes: THEMES,
    defaultTheme: DEFAULT_THEME,
}

// Sets the appearance on <html>: data-theme="<theme>", and the `dark` class
// when the mode is dark, or "system" and the device prefers dark. Also sets
// data-color-mode="<choice>".
// choice: { mode, theme }; what's missing is read from the cookies.
// Returns "light" or "dark".
//
// Runs in the browser only, and must stay self-contained (no imports, no
// helpers from outside): appearanceScript() puts its source into the page.
export function applyAppearance(config, choice) {
    var root = document.documentElement
    function fromCookie(name) {
        var match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"))
        return match ? match[1] : undefined
    }
    var mode = choice && choice.mode !== undefined ? choice.mode : fromCookie(config.modeCookie)
    var theme = choice && choice.theme !== undefined ? choice.theme : fromCookie(config.themeCookie)
    if (config.modes.indexOf(mode) < 0) mode = config.defaultMode
    if (config.themes.indexOf(theme) < 0) theme = config.defaultTheme
    var dark = mode === "dark"
        || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    root.classList.toggle("dark", dark)
    root.setAttribute("data-color-mode", mode)
    root.setAttribute("data-theme", theme)
    return dark ? "dark" : "light"
}

// Removes the appearance from <html>: back to the landing page's light sage look.
export function clearAppearance() {
    const root = document.documentElement
    root.classList.remove("dark")
    root.removeAttribute("data-color-mode")
    root.removeAttribute("data-theme")
}

// The inline script for <head>: applies the chosen appearance on dashboard
// pages before anything is painted. Other pages are left alone (light sage).
export function appearanceScript() {
    const dashboard = JSON.stringify(DASHBOARD_PATH)
    return `try{var p=location.pathname;if(p===${dashboard}||p.indexOf(${dashboard}+"/")===0)(${applyAppearance.toString()})(${JSON.stringify(APPEARANCE_CONFIG)})}catch(e){}`
}
