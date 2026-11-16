import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

import { Logo } from "@/components/brand/Logo"
import UserMenu from "./UserMenu"
import MobileNav from "./MobileNav"
import NavLink from "./NavLink"
import ButtonSignIn from "./ButtonSignIn"
import LocalModeBadge from "./LocalModeBadge"
import { isLocalMode } from "@/lib/mode"

import { auth } from "@/../auth"


export default async function Nav() {

    const session = await auth()
    const localMode = isLocalMode()

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <nav aria-label="Main" className="container mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">

                {/* LOGO - BRAND */}
                <Link
                    href="/"
                    aria-label="Moodify home"
                    className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                    <Logo />
                </Link>
                {localMode && <LocalModeBadge className="hidden sm:inline-flex" />}

                {/* Desktop Navigation */}
                <div className="ml-auto hidden items-center gap-2 md:flex">
                    {session ? (<>
                        <NavLink href="/dashboard">
                            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                            Dashboard
                        </NavLink>
                        <UserMenu user={session.user} />
                    </>
                    ) : (
                        <ButtonSignIn compact size="sm" />
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className="ml-auto md:hidden">
                    <MobileNav user={session?.user} localMode={localMode} />
                </div>
            </nav>
        </header>
    )
}
