"use client"

import { useRef } from "react"
import { moodColor, moodEmoji, moodLabel } from "@/lib/mood"
import { MOOD_MIN, MOOD_MAX } from "@/lib/validation"
import { cn } from "@/lib/utils"

const MOODS = Array.from({ length: MOOD_MAX - MOOD_MIN + 1 }, (_, index) => MOOD_MIN + index)

// Mood check-in: the scale 0–10 as a row of emojis, each in its mood color.
// A radio group: Tab focuses the chosen mood (or 0 if none is chosen yet),
// arrow keys / Home / End change it.
//
// value:     chosen mood or null
// onChange:  called with the new mood
// labelId:   id of the element that labels the group
// emptyText: shown while no mood is chosen
export default function MoodPicker({ value, onChange, labelId, emptyText = "How does today feel?" }) {

    const buttons = useRef([])

    function choose(mood) {
        onChange(mood)
        buttons.current[mood]?.focus()
    }

    function handleKeyDown(event) {
        const current = value ?? MOOD_MIN
        const next = {
            ArrowRight: Math.min(MOOD_MAX, current + 1),
            ArrowUp: Math.min(MOOD_MAX, current + 1),
            ArrowLeft: Math.max(MOOD_MIN, current - 1),
            ArrowDown: Math.max(MOOD_MIN, current - 1),
            Home: MOOD_MIN,
            End: MOOD_MAX,
        }[event.key]
        if (next === undefined) return
        event.preventDefault()
        choose(next)
    }

    return (
        <div className="space-y-3">
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                onKeyDown={handleKeyDown}
                className="grid grid-cols-11 gap-0.5 sm:gap-1.5"
            >
                {MOODS.map((mood) => {
                    const checked = value === mood
                    const focusable = value === null ? mood === MOOD_MIN : checked
                    return (
                        <button
                            key={mood}
                            ref={(element) => { buttons.current[mood] = element }}
                            type="button"
                            role="radio"
                            aria-checked={checked}
                            aria-label={`${mood}, ${moodLabel(mood)}`}
                            tabIndex={focusable ? 0 : -1}
                            onClick={() => choose(mood)}
                            className={cn(
                                "group relative flex h-12 flex-col items-center justify-center rounded-lg transition-all duration-150 sm:h-14 sm:rounded-xl",
                                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                checked ? "scale-105 shadow-sm" : "hover:bg-accent"
                            )}
                            style={checked ? { background: moodColor(mood, 0.22), boxShadow: `inset 0 0 0 2px ${moodColor(mood)}` } : undefined}
                        >
                            <span
                                aria-hidden="true"
                                className={cn(
                                    "font-emoji text-lg leading-none transition-transform sm:text-2xl",
                                    checked ? "scale-110" : "group-hover:scale-110"
                                )}
                            >
                                {moodEmoji(mood)}
                            </span>
                            <span
                                aria-hidden="true"
                                className="mt-1 h-1 w-3 rounded-full sm:w-4"
                                style={{ background: moodColor(mood) }}
                            />
                        </button>
                    )
                })}
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{moodLabel(MOOD_MIN)}</span>
                <span
                    aria-live="polite"
                    className="rounded-full px-3 py-1 text-sm font-semibold text-foreground"
                    style={value === null ? undefined : { background: moodColor(value, 0.18) }}
                >
                    {value === null ? emptyText : `${value} · ${moodLabel(value)}`}
                </span>
                <span>{moodLabel(MOOD_MAX)}</span>
            </div>
        </div>
    )
}
