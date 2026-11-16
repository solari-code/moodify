"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

// Navigation link that highlights itself on its own page (aria-current="page").
export default function NavLink({ href, className, children, ...props }) {
    const pathname = usePathname()
    const active = pathname === href

    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
                active
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                className
            )}
            {...props}
        >
            {children}
        </Link>
    )
}
