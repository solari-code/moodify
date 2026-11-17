"use client"

import { createContext, useContext, useMemo } from "react"
import { getLanguage } from "./config.js"
import { createReactTranslator } from "./react.js"
import { createFormatter } from "./formatter.js"

// i18n for client components. The root layout works out the language on the
// server and passes it here with its messages, so server and client always
// render the same language (no flash, no hydration mismatch).

const I18nContext = createContext(null)

export function I18nProvider({ locale, messages, children }) {
    const value = useMemo(() => ({
        locale,
        intlLocale: getLanguage(locale).intlLocale,
        messages,
    }), [locale, messages])

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

function useI18n() {
    const context = useContext(I18nContext)
    if (!context) throw new Error("i18n hooks need an <I18nProvider> (see src/app/layout.js)")
    return context
}

// The app language's code, e.g. "de".
export function useLocale() {
    return useI18n().locale
}

// Translation function, optionally for one namespace:
// const t = useTranslations("dashboard"); t("title")
export function useTranslations(namespace) {
    const { intlLocale, messages } = useI18n()
    return useMemo(
        () => createReactTranslator({ locale: intlLocale, messages, namespace }),
        [intlLocale, messages, namespace]
    )
}

// Date and number formatting in the app language (see src/i18n/formatter.js).
export function useFormatter() {
    const { intlLocale } = useI18n()
    return useMemo(() => createFormatter(intlLocale), [intlLocale])
}
