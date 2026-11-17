"use client"

import "./globals.css"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import ErrorScreen from "@/components/ErrorScreen"
import { DEFAULT_LOCALE, LOCALE_COOKIE, getLanguage, isSupportedLocale } from "@/i18n/config"
import { negotiateLocale } from "@/i18n/negotiate"
import { createTranslator } from "@/i18n/translator"
import { fontHeading, fontSans } from "./fonts"

// The root layout itself failed (e.g. the database can't be reached while
// checking the session). Replaces Next.js' English default and the whole
// document, so there is no navigation and no I18nProvider here: the language
// is worked out in the browser by the same rules as on the server (see
// getLocale in src/i18n/server.js), and only its messages are loaded.
//
// retry: renders the page again (fetching it from the server again)

function browserLocale() {
    const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`))
    const chosen = cookie?.slice(LOCALE_COOKIE.length + 1)
    if (isSupportedLocale(chosen)) return chosen
    return negotiateLocale(navigator.languages?.join(",") || navigator.language)
}

export default function GlobalError({ retry }) {

    const [i18n, setI18n] = useState(null) // { locale, messages } once loaded

    useEffect(() => {
        const locale = browserLocale()
        let cancelled = false
        import(`../i18n/messages/${locale}.json`).then((module) => {
            if (!cancelled) setI18n({ locale, messages: module.default })
        })
        return () => { cancelled = true }
    }, [])

    const t = i18n && createTranslator({
        locale: getLanguage(i18n.locale).intlLocale,
        messages: i18n.messages,
        namespace: "errorPages.error",
    })

    return (
        <html lang={i18n?.locale ?? DEFAULT_LOCALE}>
            <body className={`${fontSans.variable} ${fontHeading.variable} font-sans antialiased`}>
                {t && (
                    <>
                        <title>{t("title")}</title>
                        <ErrorScreen title={t("title")} text={t("text")}>
                            <Button onClick={() => retry()}>{t("retry")}</Button>
                        </ErrorScreen>
                    </>
                )}
            </body>
        </html>
    )
}
