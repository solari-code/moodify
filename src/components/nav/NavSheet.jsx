"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sheet } from "@/components/ui/sheet"

// Sheet for the mobile navigation that closes itself when the route changes
// (e.g. after signing in, signing out or tapping "Dashboard"). Navigations
// inside the app don't reload the page, so it would stay open otherwise.
export default function NavSheet({ children }) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const [openedOn, setOpenedOn] = useState(pathname)

    // Adjusting state while rendering (instead of in an effect) avoids
    // showing the open sheet for one extra frame on the new page.
    if (pathname !== openedOn) {
        setOpenedOn(pathname)
        setOpen(false)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            {children}
        </Sheet>
    )
}
