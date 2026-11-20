"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// A choice between a few options shown as cards (e.g. in the settings), as a
// radio group: Tab focuses the chosen option, arrow keys change it. The chosen
// card has a check mark, so it doesn't depend on color alone.
//
// options:  [{ value, label, hint?, icon?, visual? }]
//           icon: a lucide icon component; visual: any element shown on top
//           of the card instead (e.g. color swatches)
// value:    the chosen value
// onChange: called with the new value
// labelledBy / describedBy: ids of the elements that name / describe the group
export function RadioCards({ options, value, onChange, labelledBy, describedBy, className }) {

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
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            onKeyDown={handleKeyDown}
            className={cn("grid gap-3 sm:grid-cols-3", className)}
        >
            {options.map(({ value: optionValue, label, hint, icon: Icon, visual }) => {
                const checked = optionValue === value
                return (
                    <button
                        key={optionValue}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        data-value={optionValue}
                        tabIndex={checked ? 0 : -1}
                        onClick={() => onChange(optionValue)}
                        className={cn(
                            "relative flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
                            "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                            checked
                                ? "border-primary ring-1 ring-primary"
                                : "hover:border-input hover:bg-accent/60"
                        )}
                    >
                        {checked && (
                            <span aria-hidden="true" className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                        )}
                        {visual ?? (Icon && (
                            <span aria-hidden="true" className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg",
                                checked ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                                <Icon className="h-5 w-5" />
                            </span>
                        ))}
                        <span className="space-y-0.5 pr-6">
                            <span className="block text-sm font-semibold text-foreground">{label}</span>
                            {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
