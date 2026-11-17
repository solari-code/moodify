import { cache } from "react"
import { cookies, headers } from "next/headers"
import { LOCALE_COOKIE, getLanguage, isSupportedLocale } from "./config.js"
import { negotiateLocale } from "./negotiate.js"
import { createReactTranslator } from "./react.js"
import { createFormatter } from "./formatter.js"

// i18n for server components, layouts, metadata and server actions.
// (Client components use the hooks in src/i18n/client.jsx.)

// The language of the current request:
// 1. the language the user picked in the switcher (cookie)
// 2. the first supported language in the browser's language list
// 3. the default language (English)
// Cached per request, so it's only worked out once.
export const getLocale = cache(async () => {
    const chosen = (await cookies()).get(LOCALE_COOKIE)?.value
    if (isSupportedLocale(chosen)) return chosen

    return negotiateLocale((await headers()).get("accept-language"))
})

// All messages of a language (the JSON file in src/i18n/messages/).
export const getMessages = cache(async (locale) => {
    const code = getLanguage(locale).code
    return (await import(`./messages/${code}.json`)).default
})

// Translation function for the current request, optionally for one
// namespace: const t = await getTranslations("nav"); t("signIn")
export async function getTranslations(namespace) {
    const locale = await getLocale()
    const messages = await getMessages(locale)
    return createReactTranslator({ locale: getLanguage(locale).intlLocale, messages, namespace })
}

// Date and number formatting in the current request's language.
export async function getFormatter() {
    return createFormatter(getLanguage(await getLocale()).intlLocale)
}
