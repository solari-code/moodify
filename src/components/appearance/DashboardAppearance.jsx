"use client"

import { useLayoutEffect } from "react"
import { followAppearance } from "./appearanceStore"

// Part of the dashboard layout: applies the user's theme and color mode while
// a dashboard page is shown, and removes them when the user goes to another
// page (the landing page always stays light sage).
//
// On a full page load, the inline script in the root layout has already
// applied it before the first paint; this takes over for navigations inside
// the app (layout effects run before the browser paints, so nothing flickers)
// and follows changes of the device's setting.
export default function DashboardAppearance() {
    useLayoutEffect(() => followAppearance(), [])
    return null
}
