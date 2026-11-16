"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addDays, fromDateKey, startOfWeek } from "@/lib/dates"
import { moodColor } from "@/lib/mood"
import { cn } from "@/lib/utils"

const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" })
const dayFormat = new Intl.DateTimeFormat(undefined, { day: "numeric" })
const fullFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })
const rangeFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" })

// One week (Monday to Sunday) to pick a day from, with the mood of each
// logged day as a colored dot. The arrows page through the weeks without
// changing the selected day; picking a day elsewhere (e.g. in the calendar)
// shows that day's week.
//
// selectedKey / todayKey: "YYYY-MM-DD"
// entries:  { "YYYY-MM-DD": entry }
// onSelect: called with the picked day key
export default function WeekStrip({ selectedKey, todayKey, entries, onSelect }) {

    const [weekStart, setWeekStart] = useState(() => startOfWeek(selectedKey))
    const [shownFor, setShownFor] = useState(selectedKey)

    // Another day was selected: show its week. (Adjusting state while
    // rendering instead of in an effect avoids one frame of the old week.)
    if (selectedKey !== shownFor) {
        setShownFor(selectedKey)
        setWeekStart(startOfWeek(selectedKey))
    }

    const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
    const weekEnd = days[6]
    const isCurrentWeek = weekEnd >= todayKey
    const rangeLabel = rangeFormat.formatRange(fromDateKey(weekStart), fromDateKey(weekEnd))

    return (
        <div className="rounded-xl border bg-card p-2 shadow-soft sm:p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Previous week"
                    onClick={() => setWeekStart((start) => addDays(start, -7))}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium text-muted-foreground" aria-live="polite">{rangeLabel}</p>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Next week"
                    disabled={isCurrentWeek}
                    onClick={() => setWeekStart((start) => addDays(start, 7))}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <ol className="grid grid-cols-7 gap-1 sm:gap-2" aria-label={`Week of ${rangeLabel}`}>
                {days.map((dateKey) => (
                    <li key={dateKey}>
                        <DayButton
                            dateKey={dateKey}
                            entry={entries[dateKey]}
                            selected={dateKey === selectedKey}
                            isToday={dateKey === todayKey}
                            future={dateKey > todayKey}
                            onSelect={onSelect}
                        />
                    </li>
                ))}
            </ol>
        </div>
    )
}

function DayButton({ dateKey, entry, selected, isToday, future, onSelect }) {
    const date = fromDateKey(dateKey)
    const hasMood = entry !== undefined

    // The visible text ("Mon 9" / "Today 15") starts the accessible name, so
    // voice control users can say what they see; the rest is screen reader only.
    let extra = `, ${fullFormat.format(date)}`
    if (!future) extra += hasMood ? `, mood ${entry.mood}` : ", no entry"

    return (
        <button
            type="button"
            onClick={() => onSelect(dateKey)}
            disabled={future}
            aria-pressed={selected}
            aria-current={isToday ? "date" : undefined}
            className={cn(
                "flex w-full flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent hover:text-accent-foreground",
                !selected && isToday && "bg-secondary text-secondary-foreground",
                future && "cursor-not-allowed opacity-40 hover:bg-transparent"
            )}
        >
            <span className={cn(
                "text-[11px] font-medium uppercase tracking-wide",
                selected ? "text-primary-foreground" : "text-muted-foreground",
                isToday && !selected && "text-secondary-foreground"
            )}>
                {isToday ? "Today" : weekdayFormat.format(date)}
            </span>
            <span className="text-lg font-semibold leading-none tabular-nums">{dayFormat.format(date)}</span>
            <span className="sr-only">{extra}</span>
            <span
                aria-hidden="true"
                className={cn("h-2 w-2 rounded-full", selected && hasMood && "ring-1 ring-primary-foreground/80")}
                style={{ background: hasMood ? moodColor(entry.mood) : "transparent" }}
            />
        </button>
    )
}
