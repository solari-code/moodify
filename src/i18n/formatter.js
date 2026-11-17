// Dates and numbers in the app's language (not the browser's language).
//
// Only the language comes from the app: the time zone is left to the runtime,
// i.e. the browser's time zone on the client. That keeps day keys and the
// dates shown in sync (see src/lib/dates.js).
//
//   format.date(date, options)            Intl.DateTimeFormat options
//   format.dateRange(start, end, options) e.g. "Nov 9 – 15, 2026"
//   format.number(value, options)         Intl.NumberFormat options
//   format.decimal(value, digits = 1)     always `digits` decimals: 7 -> "7.0" / "7,0"
//   format.percent(rate)                  0.42 -> "42%" / "42 %"
//   format.list(items, options)           "a, b and c" / "a, b und c"
//   format.capitalize(text)               first letter upper case, for texts that
//                                         start with a date: Spanish writes
//                                         "lunes" in a sentence, "Lunes, 16 …" on its own
//
// Relative imports only, so this runs in Node's test runner directly.

// The full date used throughout the dashboard:
// "Sunday, November 15, 2026" / "Sonntag, 15. November 2026"
export const FULL_DATE = { weekday: "long", day: "numeric", month: "long", year: "numeric" }

const cache = new Map()

function cached(kind, locale, options, create) {
    const key = `${kind}|${locale}|${JSON.stringify(options)}`
    let value = cache.get(key)
    if (!value) {
        value = create()
        cache.set(key, value)
    }
    return value
}

// locale: Intl locale, e.g. "en-US" (see `intlLocale` in src/i18n/config.js)
export function createFormatter(locale) {
    const dateFormat = (options) => cached("date", locale, options, () => new Intl.DateTimeFormat(locale, options))
    const numberFormat = (options) => cached("number", locale, options, () => new Intl.NumberFormat(locale, options))

    return {
        locale,
        date: (date, options = {}) => dateFormat(options).format(date),
        dateRange: (start, end, options = {}) => dateFormat(options).formatRange(start, end),
        number: (value, options = {}) => numberFormat(options).format(value),
        decimal: (value, digits = 1) => numberFormat({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value),
        percent: (rate, options = {}) => numberFormat({ style: "percent", maximumFractionDigits: 0, ...options }).format(rate),
        list: (items, options = {}) => cached("list", locale, options, () => new Intl.ListFormat(locale, options)).format(items),
        capitalize: (text) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1),
    }
}
