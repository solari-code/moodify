"use client"

import { useState } from "react"
import { CalendarDays, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import DayCalendar from "@/components/dashboard/Calendar"
import { fromDateKey, toDateKey } from "@/lib/dates"

const todayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" })
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })

// Greeting by the user's local time.
function greeting(now) {
    const hour = now.getHours()
    if (hour < 5) return "Hello"
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
}

// Top of the dashboard: greeting, which day is shown, and the date controls
// ("Back to today" and a calendar to jump to any past day).
//
// userName: display name, only the first word is used (may be empty)
// today:    the user's today (Date, from the browser)
// selectedKey / todayKey: "YYYY-MM-DD"
// entries:  { "YYYY-MM-DD": entry } for the calendar's mood dots
// onSelect: called with a day key
export default function DashboardHeader({ userName, today, todayKey, selectedKey, entries, onSelect }) {

    const [calendarOpen, setCalendarOpen] = useState(false)
    const firstName = userName?.trim().split(/\s+/)[0]
    const isToday = selectedKey === todayKey

    function pickDay(date) {
        if (!date) return
        onSelect(toDateKey(date))
        setCalendarOpen(false)
    }

    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{todayFormat.format(today)}</p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {greeting(today)}{firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="text-muted-foreground" aria-live="polite">
                    {isToday
                        ? "Take a moment to check in with yourself."
                        : `Looking back at ${dayFormat.format(fromDateKey(selectedKey))}.`}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {!isToday && (
                    <Button variant="outline" size="sm" onClick={() => onSelect(todayKey)}>
                        <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Back to today
                    </Button>
                )}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                            Pick a date
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-1" aria-label="Choose a date">
                        <DayCalendar
                            selected={fromDateKey(selectedKey)}
                            onSelect={pickDay}
                            today={today}
                            entries={entries}
                        />
                    </PopoverContent>
                </Popover>
            </div>
        </header>
    )
}
