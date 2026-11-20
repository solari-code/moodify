"use client"

import { useTransition } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLeaveGuard } from "@/components/LeaveGuard"
import { signOutAction } from "@/app/actions/auth"
import { useTranslations } from "@/i18n/client"

// "Sign Out" button of the mobile navigation. With unsaved changes on the
// page, it asks first (see LeaveGuard).
export default function SignOutButton({ className }) {
    const t = useTranslations("nav")
    const { requestLeave } = useLeaveGuard()
    const [pending, startTransition] = useTransition()

    return (
        <Button
            type="button"
            variant="outline"
            className={className}
            disabled={pending}
            onClick={() => requestLeave(() => startTransition(() => signOutAction()))}
        >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            {t("signOut")}
        </Button>
    )
}
