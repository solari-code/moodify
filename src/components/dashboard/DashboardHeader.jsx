"use client"

import { useState } from "react"
import { CalendarDays, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import DayCalendar from "@/components/dashboard/Calendar"
import { fromDateKey, toDateKey } from "@/lib/dates"
import { useFormatter, useTranslations } from "@/i18n/client"
import { FULL_DATE } from "@/i18n/formatter"

// Part of the day for the greeting, by the user's local time
// (dashboard.header.greeting.<part> in the messages).
function partOfDay(now) {
    const hour = now.getHours()
    if (hour < 5) return "night"
    if (hour < 12) return "morning"
    if (hour < 18) return "afternoon"
    return "evening"
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

    const t = useTranslations("dashboard.header")
    const format = useFormatter()
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
                <p className="text-sm font-medium text-muted-foreground">
                    {format.capitalize(format.date(today, { weekday: "long", day: "numeric", month: "long" }))}
                </p>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    {firstName
                        ? t(`greetingNamed.${partOfDay(today)}`, { name: firstName })
                        : t(`greeting.${partOfDay(today)}`)}
                </h1>
                <p className="text-muted-foreground" aria-live="polite">
                    {isToday
                        ? t("checkInToday")
                        : t("lookingBack", { date: format.date(fromDateKey(selectedKey), FULL_DATE) })}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {!isToday && (
                    <Button variant="outline" size="sm" onClick={() => onSelect(todayKey)}>
                        <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        {t("backToToday")}
                    </Button>
                )}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                            <CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />
                            {t("pickDate")}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-1" aria-label={t("chooseDate")}>
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
