import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

// Shown in the navigation while the app runs in local mode.
export default function LocalModeBadge({ className }) {
    return (
        <span
            title="Demo login, data is stored in .data/ on this machine"
            className={cn(
                "inline-flex items-center gap-1 rounded-full bg-peach px-2.5 py-0.5 text-xs font-medium text-peach-foreground",
                className
            )}
        >
            <FlaskConical className="h-3 w-3" aria-hidden="true" />
            Local mode
        </span>
    )
}
