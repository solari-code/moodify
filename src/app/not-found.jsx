import Link from "next/link"
import { Button } from "@/components/ui/button"
import ErrorScreen from "@/components/ErrorScreen"
import { getTranslations } from "@/i18n/server"

// Unknown URLs (replaces Next.js' English default page). Rendered inside the
// root layout, so navigation and footer stay.
export async function generateMetadata() {
    const t = await getTranslations("errorPages.notFound")
    return { title: t("title") }
}

export default async function NotFound() {
    const t = await getTranslations("errorPages.notFound")

    return (
        <div className="pt-16">
            <ErrorScreen title={t("title")} text={t("text")}>
                <Button asChild>
                    <Link href="/">{t("home")}</Link>
                </Button>
            </ErrorScreen>
        </div>
    )
}
