"use client"

import { labelDayButton } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"
import { toDateKey } from "@/lib/dates"

// Day picker for the dashboard. Days that already have an entry get a small
// dot (and ", entry saved" in their accessible label).
//
// selected: the selected day (Date)
// today:    the user's today (Date), later days can't be picked
// entryDates: Set of "YYYY-MM-DD" keys that have an entry
export default function DayCalendar({ selected, onSelect, today, entryDates }) {

    return (
        <Calendar
            mode="single"
            selected={selected}
            onSelect={onSelect}
            defaultMonth={selected}
            today={today}
            className="rounded-md border calendar-component"
            disabled={{ after: today }}
            required
            modifiers={{ hasEntry: (day) => entryDates.has(toDateKey(day)) }}
            modifiersClassNames={{
                hasEntry: "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary aria-selected:after:bg-primary-foreground",
            }}
            labels={{
                labelDayButton: (date, modifiers, options, dateLib) => {
                    const label = labelDayButton(date, modifiers, options, dateLib)
                    return modifiers.hasEntry ? `${label}, entry saved` : label
                },
            }}
        />
    )

}
