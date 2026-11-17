"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import ErrorScreen from "@/components/ErrorScreen"
import { useTranslations } from "@/i18n/client"

// A page failed to render (replaces Next.js' English default). Rendered
// inside the root layout, so navigation, footer and translations are there.
// Errors in the root layout itself are handled by global-error.jsx.
//
// retry: renders the page again (fetching it from the server again)
export default function Error({ retry }) {
    const t = useTranslations("errorPages.error")

    return (
        <div className="pt-16">
            <title>{t("title")}</title>
            <ErrorScreen title={t("title")} text={t("text")}>
                <Button onClick={() => retry()}>{t("retry")}</Button>
                <Button asChild variant="outline">
                    <Link href="/">{t("home")}</Link>
                </Button>
            </ErrorScreen>
        </div>
    )
}
