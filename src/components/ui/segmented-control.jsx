"use client"

import { cn } from "@/lib/utils"

// A row of mutually exclusive options in a pill (e.g. time ranges), as a
// radio group: Tab focuses the chosen option, arrow keys change it.
//
// options:   [{ value, label, ariaLabel? }]
// value:     the chosen value
// onChange:  called with the new value
// ariaLabel: name of the group
export function SegmentedControl({ options, value, onChange, ariaLabel, className }) {

    function handleKeyDown(event) {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
        if (!step) return
        event.preventDefault()
        const index = options.findIndex((option) => option.value === value)
        const next = options[(index + step + options.length) % options.length].value
        onChange(next)
        event.currentTarget.querySelector(`[data-value="${next}"]`)?.focus()
    }

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            onKeyDown={handleKeyDown}
            className={cn("grid auto-cols-fr grid-flow-col gap-1 rounded-full bg-muted p-1", className)}
        >
            {options.map((option) => {
                const checked = option.value === value
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        aria-label={option.ariaLabel}
                        data-value={option.value}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            checked ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
