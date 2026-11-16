"use client"

import { Check, Flame } from "lucide-react"
import { cn } from "@/lib/utils"

// A habit as a large toggle: check circle, name and current streak.
export default function HabitRow({ name, done, streak, onToggle }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={done}
            onClick={onToggle}
            className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                done ? "border-primary/30 bg-secondary" : "bg-card hover:bg-accent"
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-input"
                )}
            >
                <Check className={cn("h-3.5 w-3.5 transition-transform", done ? "scale-100" : "scale-0")} strokeWidth={3} />
            </span>
            <span className={cn("min-w-0 flex-1 truncate font-medium", done && "text-secondary-foreground")}>{name}</span>
            {streak > 0 && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-peach px-2 py-0.5 text-xs font-semibold text-peach-foreground">
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    {streak}
                    <span className="sr-only">{streak === 1 ? "day" : "days"} streak</span>
                </span>
            )}
        </button>
    )
}
