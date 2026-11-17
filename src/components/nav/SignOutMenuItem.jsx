"use client"

import { LogOut } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { signOutAction } from "@/app/actions/auth"
import { useTranslations } from "@/i18n/client"

// Client component: the menu closes (and unmounts its content) on select,
// so the server action is called directly instead of through a <form>.
export default function SignOutMenuItem() {
    const t = useTranslations("nav")

    return (
        <DropdownMenuItem onSelect={() => signOutAction()}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("signOut")}
        </DropdownMenuItem>
    )
}
