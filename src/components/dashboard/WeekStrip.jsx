"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { addDays, fromDateKey, startOfWeek } from "@/lib/dates"
import { moodColor } from "@/lib/mood"
import { cn } from "@/lib/utils"
import { useFormatter, useTranslations } from "@/i18n/client"
import { FULL_DATE } from "@/i18n/formatter"

// One week (Monday to Sunday) to pick a day from, with the mood of each
// logged day as a colored dot. The arrows page through the weeks without
// changing the selected day; picking a day elsewhere (e.g. in the calendar)
// shows that day's week.
//
// selectedKey / todayKey: "YYYY-MM-DD"
// entries:  { "YYYY-MM-DD": entry }
// onSelect: called with the picked day key
export default function WeekStrip({ selectedKey, todayKey, entries, onSelect }) {

    const t = useTranslations("dashboard.weekStrip")
    const format = useFormatter()

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
    const rangeLabel = format.dateRange(fromDateKey(weekStart), fromDateKey(weekEnd), { day: "numeric", month: "short", year: "numeric" })

    return (
        <div className="rounded-xl border bg-card p-2 shadow-soft sm:p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t("previous")}
                    onClick={() => setWeekStart((start) => addDays(start, -7))}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-medium text-muted-foreground" aria-live="polite">{rangeLabel}</p>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t("next")}
                    disabled={isCurrentWeek}
                    onClick={() => setWeekStart((start) => addDays(start, 7))}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <ol className="grid grid-cols-7 gap-1 sm:gap-2" aria-label={t("weekOf", { range: rangeLabel })}>
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
    const t = useTranslations()
    const format = useFormatter()
    const date = fromDateKey(dateKey)
    const hasMood = entry !== undefined

    const topLabel = isToday ? t("common.today") : format.date(date, { weekday: "short" })
    const dayNumber = format.date(date, { day: "numeric" })

    // The visible text ("Mon 9" / "Today 15") starts the accessible name, so
    // voice control users can say what they see.
    const values = { label: `${topLabel} ${dayNumber}`, date: format.date(date, FULL_DATE) }
    const accessibleName = future
        ? t("dashboard.weekStrip.dayFuture", values)
        : hasMood
            ? t("dashboard.weekStrip.dayWithMood", { ...values, mood: entry.mood })
            : t("dashboard.weekStrip.dayNoEntry", values)

    return (
        <button
            type="button"
            onClick={() => onSelect(dateKey)}
            disabled={future}
            aria-pressed={selected}
            aria-current={isToday ? "date" : undefined}
            aria-label={accessibleName}
            className={cn(
                "flex w-full flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-accent hover:text-accent-foreground",
                !selected && isToday && "bg-secondary text-secondary-foreground",
                // dimmed, but still readable (3:1, see tests/contrast.test.mjs)
                future && "cursor-not-allowed text-muted-foreground opacity-75 hover:bg-transparent hover:text-muted-foreground"
            )}
        >
            <span className={cn(
                "text-[11px] font-medium uppercase tracking-wide",
                selected ? "text-primary-foreground" : "text-muted-foreground",
                isToday && !selected && "text-secondary-foreground"
            )}>
                {topLabel}
            </span>
            <span className="text-lg font-semibold leading-none tabular-nums">{dayNumber}</span>
            <span
                aria-hidden="true"
                className={cn("h-2 w-2 rounded-full", selected && hasMood && "ring-1 ring-primary-foreground/80")}
                style={{ background: hasMood ? moodColor(entry.mood) : "transparent" }}
            />
        </button>
    )
}
