import { SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import NavSheet from "./NavSheet"
import NavLink from "./NavLink"
import UserAvatar from "./UserAvatar"
import LocalModeBadge from "./LocalModeBadge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Menu, LayoutDashboard, UserCog } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import ButtonSignIn from "./ButtonSignIn"
import SignOutButton from "./SignOutButton"
import LanguageSwitcher from "./LanguageSwitcher"
import HiddenInDashboard from "./HiddenInDashboard"
import { DASHBOARD_PATH, SETTINGS_PATH } from "@/lib/routes"
import { getTranslations } from "@/i18n/server"


export default async function MobileNav({ user, localMode = false }) {

    const t = await getTranslations("nav")

    return (
        <NavSheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("openMenu")}>
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            {/* focus the first menu entry (Dashboard or sign-in), not "Sign Out" */}
            <SheetContent side="left" className="flex w-[300px] flex-col gap-6 sm:w-[360px]" initialFocus="nav a, nav button">
                {/* SheetTitle gives the dialog its accessible name */}
                <SheetTitle className="flex items-center">
                    <Logo />
                </SheetTitle>
                <SheetDescription className="sr-only">{t("menuDescription")}</SheetDescription>

                <nav aria-label={t("mobileLabel")} className="flex flex-1 flex-col gap-4">
                    {user ? (
                        <>
                            <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-soft">
                                <UserAvatar user={user} />
                                <div className="min-w-0">
                                    {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
                                    {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                <NavLink href={DASHBOARD_PATH} className="px-4 py-2.5">
                                    <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                                    {t("dashboard")}
                                </NavLink>
                                <NavLink href={SETTINGS_PATH} className="px-4 py-2.5">
                                    <UserCog className="h-4 w-4" aria-hidden="true" />
                                    {t("settings")}
                                </NavLink>
                            </div>
                            <Separator />
                            <SignOutButton className="w-full" />
                        </>
                    ) : (
                        <ButtonSignIn compact className="[&>button]:w-full" />
                    )}
                </nav>

                {/* in the dashboard, the language is set in the profile settings */}
                <HiddenInDashboard>
                    <LanguageSwitcher variant="block" />
                </HiddenInDashboard>
                {localMode && <LocalModeBadge className="self-start" />}
            </SheetContent>
        </NavSheet>
    )
}
