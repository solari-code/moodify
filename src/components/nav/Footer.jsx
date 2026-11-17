import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { getTranslations } from "@/i18n/server"

// Site footer, shown on every page (root layout).
export default async function Footer() {

    const t = await getTranslations()

    return (
        <footer className="border-t border-border/60">
            <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
                <div className="flex flex-col items-center gap-1 sm:items-start">
                    <Link href="/" aria-label={t("nav.home")} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Logo markClassName="h-6 w-6" textClassName="text-lg" />
                    </Link>
                    <p>{t("footer.tagline")}</p>
                </div>
                <nav aria-label={t("footer.label")} className="flex gap-6">
                    <Link href="/#how-it-works" className="hover:text-foreground">{t("common.howItWorks")}</Link>
                    <Link href="/dashboard" className="hover:text-foreground">{t("nav.dashboard")}</Link>
                </nav>
            </div>
        </footer>
    )
}
