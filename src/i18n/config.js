// The languages Moodify is available in.
//
// To add a language:
// 1. add an entry to LANGUAGES below
// 2. add src/i18n/messages/<code>.json with every key of en.json
//    (`npm test` checks that all languages are complete)
//
// code:       short language code, used in the cookie and in <html lang>
// name:       the language's name in its own language, shown in the switcher
// intlLocale: the locale for dates and numbers (Intl), e.g. "en-US" for the
//             US date format in English
//
// Relative imports only, so this runs in Node's test runner directly.

export const LANGUAGES = [
    { code: "en", name: "English", intlLocale: "en-US" },
    { code: "de", name: "Deutsch", intlLocale: "de-DE" },
    { code: "es", name: "Español", intlLocale: "es-ES" },
]

export const LOCALES = LANGUAGES.map((language) => language.code)

// Used when neither the user's choice nor the browser's languages match.
export const DEFAULT_LOCALE = "en"

// The language the user picked in the switcher. Without it, the language
// follows the browser's language list on every visit.
export const LOCALE_COOKIE = "moodify-locale"
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // one year, in seconds

export function isSupportedLocale(value) {
    return typeof value === "string" && LOCALES.includes(value)
}

// Settings of a supported language (falls back to the default language).
export function getLanguage(locale) {
    return LANGUAGES.find((language) => language.code === locale)
        ?? LANGUAGES.find((language) => language.code === DEFAULT_LOCALE)
}
