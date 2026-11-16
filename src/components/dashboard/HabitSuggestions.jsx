"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

// Ideas for habits, offered to users with few or no habits.
export const HABIT_SUGGESTIONS = [
    "Drink 2 l of water",
    "Morning walk",
    "Read 20 pages",
    "Meditate",
    "Stretch",
    "Journal",
    "No phone after 10 pm",
    "Sleep by 11 pm",
]

// One-click chips for the suggestions that aren't in the habit list yet.
// existing: current habit names
// onAdd:    called with a name (shows its own errors)
// label:    optional heading; nothing is rendered when all suggestions are taken
export default function HabitSuggestions({ existing, onAdd, label, className }) {

    const [pending, setPending] = useState(null)
    const taken = existing.map((name) => name.toLowerCase())
    const open = HABIT_SUGGESTIONS.filter((name) => !taken.includes(name.toLowerCase()))

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
            <ul className="flex flex-wrap gap-2" aria-label="Suggested habits">
                {open.map((name) => (
                    <li key={name}>
                        <button
                            type="button"
                            onClick={() => add(name)}
                            disabled={pending !== null}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-solid hover:bg-secondary disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                        >
                            <Plus className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                            <span className="sr-only">Add habit </span>
                            {name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
