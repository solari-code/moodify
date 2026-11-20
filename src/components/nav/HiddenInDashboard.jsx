"use client"

import { usePathname } from "next/navigation"
import { isDashboardPath } from "@/lib/routes"

// Shows its content everywhere except in the dashboard area (/dashboard and
// its sub-pages). The navigation is part of the root layout and can't tell
// the pages apart on the server, so this checks the path in the client.
//
// Used for the language switcher: in the dashboard, the language is set in
// the profile settings instead.
export default function HiddenInDashboard({ children }) {
    const pathname = usePathname()
    return isDashboardPath(pathname) ? null : children
}
