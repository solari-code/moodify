import { DEFAULT_LOCALE, LOCALES } from "./config.js"

// Picks the app language from the browser's language list (the
// Accept-Language header, e.g. "fr-FR,fr;q=0.9,de;q=0.8").
//
// The browser's languages are tried in order of preference; the first one the
// app supports wins, so "fr, de" gives German. Regional variants match their
// language ("de-AT" -> "de"). Without any match: the default language.
//
// Relative imports only, so this runs in Node's test runner directly.
export function negotiateLocale(acceptLanguage, { locales = LOCALES, defaultLocale = DEFAULT_LOCALE } = {}) {
    for (const tag of parseAcceptLanguage(acceptLanguage)) {
        const match = matchLocale(tag, locales)
        if (match) return match
    }
    return defaultLocale
}

// "de-CH,de;q=0.9,*;q=0.5" -> ["de-ch", "de"], most preferred first.
// Languages with q=0 ("not acceptable") and the wildcard are left out.
export function parseAcceptLanguage(header) {
    if (typeof header !== "string") return []

    return header
        .split(",")
        .map((part, index) => {
            const [tag, ...params] = part.trim().split(";")
            const qParam = params.map((param) => param.trim()).find((param) => param.startsWith("q="))
            const q = qParam === undefined ? 1 : Number(qParam.slice(2))
            return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0, index }
        })
        .filter(({ tag, q }) => tag && tag !== "*" && q > 0)
        // highest q first; equal q keeps the header's order
        .sort((a, b) => b.q - a.q || a.index - b.index)
        .map(({ tag }) => tag)
}

// The supported locale for one browser language: the exact locale
// ("pt-br" -> "pt-BR") or else the same base language ("de-at" -> "de").
function matchLocale(tag, locales) {
    const exact = locales.find((locale) => locale.toLowerCase() === tag)
    if (exact) return exact

    const base = tag.split("-")[0]
    return locales.find((locale) => locale.toLowerCase() === base)
        ?? locales.find((locale) => locale.toLowerCase().split("-")[0] === base)
}
