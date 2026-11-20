import { LayoutDashboard } from "lucide-react"

import { Logo } from "@/components/brand/Logo"
import UserMenu from "./UserMenu"
import MobileNav from "./MobileNav"
import NavLink from "./NavLink"
import ButtonSignIn from "./ButtonSignIn"
import LocalModeBadge from "./LocalModeBadge"
import LanguageSwitcher from "./LanguageSwitcher"
import HiddenInDashboard from "./HiddenInDashboard"
import { GuardedLink } from "@/components/LeaveGuard"
import { isLocalMode } from "@/lib/mode"
import { getCurrentUser } from "@/lib/currentUser"

import { getTranslations } from "@/i18n/server"


export default async function Nav() {

    // with the name from the profile settings (same as everywhere else)
    const user = await getCurrentUser()
    const localMode = isLocalMode()
    const t = await getTranslations("nav")

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <nav aria-label={t("mainLabel")} className="container mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">

                {/* LOGO - BRAND */}
                <GuardedLink
                    href="/"
                    aria-label={t("home")}
                    className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                    <Logo />
                </GuardedLink>
                {localMode && <LocalModeBadge className="hidden sm:inline-flex" />}

                {/* Desktop Navigation */}
                <div className="ml-auto hidden items-center gap-2 md:flex">
                    {user ? (<>
                        <NavLink href="/dashboard">
                            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                            {t("dashboard")}
                        </NavLink>
                        {/* in the dashboard, the language is set in the profile settings */}
                        <HiddenInDashboard>
                            <LanguageSwitcher />
                        </HiddenInDashboard>
                        <UserMenu user={user} />
                    </>
                    ) : (<>
                        <LanguageSwitcher />
                        <ButtonSignIn compact size="sm" />
                    </>
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className="ml-auto md:hidden">
                    <MobileNav user={user} localMode={localMode} />
                </div>
            </nav>
        </header>
    )
}
