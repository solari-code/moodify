"use server"

import { cookies } from "next/headers"
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, isSupportedLocale } from "@/i18n/config"

// Remembers the language the user picked in the switcher (for a year).
// Setting a cookie in a server action makes Next.js render the current page
// again on the server, so it comes back in the new language; client state
// (e.g. an unsaved check-in) is kept.
export async function setLocale(locale) {
    if (!isSupportedLocale(locale)) {
        return { success: false }
    }

    (await cookies()).set(LOCALE_COOKIE, locale, {
        path: "/",
        maxAge: LOCALE_COOKIE_MAX_AGE,
        sameSite: "lax",
    })
    return { success: true }
}
