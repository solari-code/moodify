"use client"

import { LogOut } from "lucide-react"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useLeaveGuard } from "@/components/LeaveGuard"
import { signOutAction } from "@/app/actions/auth"
import { useTranslations } from "@/i18n/client"

// Client component: the menu closes (and unmounts its content) on select,
// so the server action is called directly instead of through a <form>.
// With unsaved changes on the page, it asks first (see LeaveGuard).
export default function SignOutMenuItem() {
    const t = useTranslations("nav")
    const { requestLeave } = useLeaveGuard()

    return (
        <DropdownMenuItem onSelect={() => requestLeave(() => signOutAction())}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("signOut")}
        </DropdownMenuItem>
    )
}
