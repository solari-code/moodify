"use client"

import { Calendar } from "@/components/ui/calendar"
import { toDateKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

// Dot under a day with an entry, in the color of that day's mood.
// Written out in full so Tailwind can find the class names (bg-mood-0 … bg-mood-10).
const DOT = "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:ring-1 after:ring-card"
const MOOD_DOTS = [
    "after:bg-mood-0", "after:bg-mood-1", "after:bg-mood-2", "after:bg-mood-3", "after:bg-mood-4", "after:bg-mood-5",
    "after:bg-mood-6", "after:bg-mood-7", "after:bg-mood-8", "after:bg-mood-9", "after:bg-mood-10",
]

// Accessible name of a day: "November 1, 2026, Sunday" (in the user's locale).
// Contains the visible day number as a word, so voice control users can say
// what they see (react-day-picker's default "November 1st" doesn't).
const dateFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "long", year: "numeric" })
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long" })

// Day picker for the dashboard. Weeks start on Monday. Days that already have
// an entry get a dot in their mood color (and ", entry saved" in their
// accessible label).
//
// selected: the selected day (Date)
// onSelect: called with the picked day (Date)
// today:    the user's today (Date), later days can't be picked
// entries:  { "YYYY-MM-DD": entry }
export default function DayCalendar({ selected, onSelect, today, entries, className }) {

    const moodOf = (day) => entries[toDateKey(day)]?.mood

    return (
        <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            defaultMonth={selected}
            today={today}
            weekStartsOn={1}
            className={cn("mx-auto w-fit", className)}
            disabled={{ after: today }}
            required
            modifiers={{
                hasEntry: (day) => moodOf(day) !== undefined,
                ...Object.fromEntries(MOOD_DOTS.map((_, mood) => [`mood${mood}`, (day) => moodOf(day) === mood])),
            }}
            modifiersClassNames={{
                hasEntry: DOT,
                ...Object.fromEntries(MOOD_DOTS.map((className, mood) => [`mood${mood}`, className])),
            }}
            labels={{
                labelDayButton: (date, modifiers) => [
                    dateFormat.format(date),
                    weekdayFormat.format(date),
                    modifiers.today && "today",
                    modifiers.selected && "selected",
                    modifiers.hasEntry && "entry saved",
                ].filter(Boolean).join(", "),
            }}
        />
    )

}
