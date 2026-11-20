"use client"

import { useSyncExternalStore } from "react"
import {
    APPEARANCE_CONFIG,
    applyAppearance,
    clearAppearance,
    colorModeCookie,
    colorModeFromCookies,
    themeCookie,
    themeFromCookies,
} from "@/lib/appearance"

// The appearance in the browser: the cookies are the source of truth
// (see src/lib/appearance.js), this keeps React and <html> in sync with them.

const CHANGE_EVENT = "moodify:appearance"
const DARK_QUERY = "(prefers-color-scheme: dark)"

function subscribe(callback) {
    window.addEventListener(CHANGE_EVENT, callback)
    return () => window.removeEventListener(CHANGE_EVENT, callback)
}

// The chosen mode ("light", "dark" or "system").
// serverMode: the mode the server rendered with (from the cookie), used
// until the page is hydrated, so both render the same.
export function useColorMode(serverMode) {
    return useSyncExternalStore(subscribe, () => colorModeFromCookies(document.cookie), () => serverMode)
}

// The chosen theme ("sage", "ocean", …); serverTheme: as for useColorMode.
export function useTheme(serverTheme) {
    return useSyncExternalStore(subscribe, () => themeFromCookies(document.cookie), () => serverTheme)
}

// Save the choice (cookie, for a year) and apply it right away.
export function setColorMode(mode) {
    document.cookie = colorModeCookie(mode)
    update({ mode })
}

export function setTheme(theme) {
    document.cookie = themeCookie(theme)
    update({ theme })
}

function update(choice) {
    withoutTransitions(() => applyAppearance(APPEARANCE_CONFIG, choice))
    window.dispatchEvent(new Event(CHANGE_EVENT))
}

// Applies the saved appearance and follows the device's setting while the
// mode is "system". Returns a function that undoes it (back to light sage).
export function followAppearance() {
    const apply = () => withoutTransitions(() => applyAppearance(APPEARANCE_CONFIG))
    apply()
    const query = window.matchMedia(DARK_QUERY)
    query.addEventListener("change", apply)
    return () => {
        query.removeEventListener("change", apply)
        withoutTransitions(clearAppearance)
    }
}

// Switches colors in one step: without this, everything with a color
// transition (buttons, links) would fade to the new colors one by one.
function withoutTransitions(change) {
    const style = document.createElement("style")
    style.textContent = "*,*::before,*::after{transition:none!important}"
    document.head.appendChild(style)
    change()
    // make the browser apply the new colors while transitions are off
    window.getComputedStyle(document.body).getPropertyValue("color")
    requestAnimationFrame(() => style.remove())
}
