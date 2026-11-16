import { cn } from "@/lib/utils"

// Moodify brand: a lotus (mindfulness, calm growth). The sage center petal is
// flanked by a lavender and a peach petal, a nod to the range of moods.
//
// Colors come from the theme (primary, lavender-strong, peach-strong), so the
// mark adapts to dark mode. The favicon (src/app/icon.svg) is a copy with fixed
// colors, because CSS variables aren't available there. Keep the paths in sync.
//
// Works in server and client components (no hooks).

const PETAL_LEFT = "M24 39C15 37.5 7.5 31 5.5 20.5c8.5.5 15.5 6.5 18.5 18.5Z"
const PETAL_RIGHT = "M24 39c9-1.5 16.5-8 18.5-18.5C34 21 27 27 24 39Z"
const PETAL_CENTER = "M24 7c6.5 7 8 20.5 0 32-8-11.5-6.5-25 0-32Z"
const BASE = "M14 43.5h20"

// The symbol alone. Decorative by default; pass `title` when it stands alone
// without visible text (it then gets role="img" and an accessible name).
export function LogoMark({ className, title }) {
    return (
        <svg
            viewBox="0 0 48 48"
            className={cn("h-8 w-8 shrink-0", className)}
            {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
        >
            <path d={PETAL_LEFT} className="fill-lavender-strong" />
            <path d={PETAL_RIGHT} className="fill-peach-strong" />
            <path d={PETAL_CENTER} className="fill-primary" />
            <path d={BASE} className="stroke-primary" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
    )
}

// Symbol + wordmark ("Moodify" in the heading font).
export function Logo({ className, markClassName, textClassName }) {
    return (
        <span className={cn("inline-flex items-center gap-2", className)}>
            <LogoMark className={markClassName} />
            <span className={cn("font-heading text-xl font-semibold tracking-tight text-foreground", textClassName)}>
                Moodify
            </span>
        </span>
    )
}
