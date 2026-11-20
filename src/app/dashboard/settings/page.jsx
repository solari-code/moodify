import Link from "next/link"
import { cookies } from "next/headers"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import LanguageSwitcher from "@/components/nav/LanguageSwitcher"
import UserAvatar from "@/components/nav/UserAvatar"
import DisplayNameForm from "@/components/settings/DisplayNameForm"
import ColorModeSetting from "@/components/settings/ColorModeSetting"
import ThemeSetting from "@/components/settings/ThemeSetting"
import { COLOR_MODE_COOKIE, THEME_COOKIE, parseColorMode, parseTheme } from "@/lib/appearance"
import { DASHBOARD_PATH } from "@/lib/routes"
import { requireUser } from "@/lib/requireUser"
import { getTranslations } from "@/i18n/server"

export async function generateMetadata() {
    const t = await getTranslations("metadata.settings")
    return { title: t("title") }
}

// Profile settings: the user's name, the dashboard's appearance (theme,
// color mode) and the language (in the dashboard, the language is set here
// instead of in the navigation). Signed-in users only: everyone else is sent
// to the landing page.
export default async function SettingsPage() {

    const user = await requireUser()
    const t = await getTranslations("settings")
    // read here too, so the server renders the saved choices (no jump on load)
    const cookieStore = await cookies()
    const colorMode = parseColorMode(cookieStore.get(COLOR_MODE_COOKIE)?.value)
    const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value)

    return (
        <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8">
            <header className="space-y-3">
                <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
                    <Link href={DASHBOARD_PATH}>
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                        {t("backToDashboard")}
                    </Link>
                </Button>
                <div className="space-y-1">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("intro")}</p>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle as="h2">{t("profile.title")}</CardTitle>
                    <CardDescription>{t("profile.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* how the user appears in the app (updates after saving) */}
                    <div className="flex items-center gap-3">
                        <UserAvatar user={user} className="h-12 w-12" />
                        <div className="min-w-0">
                            {user.name && <p className="truncate font-medium">{user.name}</p>}
                            {user.email && <p className="truncate text-sm text-muted-foreground">{user.email}</p>}
                        </div>
                    </div>
                    <DisplayNameForm displayName={user.displayName} accountName={user.accountName} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle as="h2">{t("appearance.title")}</CardTitle>
                    <CardDescription>{t("appearance.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <ThemeSetting initialTheme={theme} />
                    <ColorModeSetting initialMode={colorMode} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle as="h2">{t("language.title")}</CardTitle>
                    <CardDescription>{t("language.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <LanguageSwitcher variant="field" className="sm:w-64" />
                </CardContent>
            </Card>
        </div>
    )
}
