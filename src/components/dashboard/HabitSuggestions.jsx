"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/i18n/client"

// Ideas for habits, offered to users with few or no habits: the keys of
// their translated names (sampleHabits.<key>). An added suggestion is saved
// with its name in the current language and is the user's own habit from then on.
const SUGGESTIONS = [
    "drinkWater",
    "morningWalk",
    "read20Pages",
    "meditate",
    "stretch",
    "journal",
    "noPhoneAfter10pm",
    "sleepBy11pm",
]

// One-click chips for the suggestions that aren't in the habit list yet.
// existing: current habit names
// onAdd:    called with a name (shows its own errors)
// label:    optional heading; nothing is rendered when all suggestions are taken
export default function HabitSuggestions({ existing, onAdd, label, className }) {

    const t = useTranslations()
    const [pending, setPending] = useState(null)
    const taken = existing.map((name) => name.toLowerCase())
    const open = SUGGESTIONS
        .map((key) => t(`sampleHabits.${key}`))
        .filter((name) => !taken.includes(name.toLowerCase()))

    if (open.length === 0) return null

    async function add(name) {
        setPending(name)
        try {
            await onAdd(name)
        } finally {
            setPending(null)
        }
    }

    return (
        <div className={cn("space-y-2", className)}>
            {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
            <ul className="flex flex-wrap gap-2" aria-label={t("habitSuggestions.label")}>
                {open.map((name) => (
                    <li key={name}>
                        <button
                            type="button"
                            onClick={() => add(name)}
                            disabled={pending !== null}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-solid hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <Plus className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            {/* visible: the name; screen readers: "Add habit Morning walk" */}
                            {t.rich("habitSuggestions.add", {
                                name,
                                hidden: (chunks) => <span className="sr-only">{chunks}</span>,
                            })}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
