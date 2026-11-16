"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { habitHeatmap, habitStreak } from "@/lib/stats"
import { addDays, fromDateKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

const WEEKS = 53
const ALL = "__all__" // Select value for "All habits" (Radix needs a non-empty value)

// Cell colors. No entry and "logged, nothing done" are different on purpose:
// the first is an unknown day, the second a day the user checked in.
const NO_ENTRY_CLASS = "bg-muted"
const LEVEL_CLASSES = [
    "bg-muted ring-1 ring-inset ring-primary/35", // 0: logged, no habit done
    "bg-primary/25",
    "bg-primary/45",
    "bg-primary/70",
    "bg-primary",
]

// Weekday labels for the rows (weeks start on Monday); only every other one
// is shown, like GitHub, so they stay readable.
const ROW_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""]

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "short" })
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })

function plural(count, singular, pluralForm = `${singular}s`) {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

// GitHub-style heatmap of the last 53 weeks: one square per day, darker the
// more habits were done (relative to the busiest day, see habitHeatmap).
// Can be filtered to one habit. Clicking a day opens it in the check-in.
//
// entries:     { "YYYY-MM-DD": entry }
// habits:      current habit list [{ name }] (for the filter)
// todayKey / selectedKey: "YYYY-MM-DD"
// onSelectDay: called with a day key (optional: without it days only show their tooltip)
// titleAs:     heading level of the card title (h2 on the dashboard)
export default function HabitHeatmap({ entries, habits, todayKey, selectedKey, onSelectDay, titleAs = "h2" }) {

    const [filter, setFilter] = useState(ALL)
    // a removed habit can't stay selected
    const habit = filter !== ALL && habits.some((h) => h.name === filter) ? filter : null

    const heatmap = useMemo(
        () => habitHeatmap(entries, { todayKey, habit, weeks: WEEKS }),
        [entries, todayKey, habit]
    )
    const firstDay = heatmap.weeks[0][0].date
    const streak = useMemo(() => (habit ? habitStreak(entries, habit, todayKey) : null), [entries, habit, todayKey])

    // Keyboard: the grid is one tab stop; arrow keys move between days.
    const [focusedKey, setFocusedKey] = useState(todayKey)
    const [hovered, setHovered] = useState(null) // { cell, week, row } for the tooltip
    const gridRef = useRef(null)
    const scrollRef = useRef(null)

    // On small screens the grid scrolls sideways: start at today (the right end).
    useEffect(() => {
        const scroller = scrollRef.current
        if (scroller) scroller.scrollLeft = scroller.scrollWidth
    }, [])

    // { date, text } for a day, e.g. "Tuesday, 5 May 2026" / "3 habits done"
    function describe(cell) {
        const date = dayFormat.format(fromDateKey(cell.date))
        if (!cell.hasEntry) return { date, text: "No entry" }
        if (habit) return { date, text: `${habit} ${cell.done ? "done" : "not done"}` }
        if (cell.done === 0) return { date, text: "Logged, no habits done" }
        return { date, text: `${plural(cell.done, "habit")} done` }
    }

    function handleKeyDown(event) {
        const step = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1 }[event.key]
        if (!step) return
        event.preventDefault()
        let next = addDays(focusedKey, step)
        if (next > todayKey) next = todayKey
        if (next < firstDay) next = firstDay
        setFocusedKey(next)
        gridRef.current?.querySelector(`[data-date="${next}"]`)?.focus()
    }

    const summary = heatmap.loggedDays === 0
        ? "No entries in the last 12 months yet."
        : habit
            ? `${habit}: done on ${plural(heatmap.activeDays, "day")} in the last 12 months.`
            : `${plural(heatmap.activeDays, "day")} with habits done, ${plural(heatmap.loggedDays, "day")} logged in the last 12 months.`

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                    <CardTitle as={titleAs}>Habit activity</CardTitle>
                    <CardDescription>
                        Each square is a day: the darker, the more habits you did.
                        {onSelectDay && " Click a day to open it."}
                    </CardDescription>
                </div>
                <Select value={habit ?? ALL} onValueChange={setFilter}>
                    <SelectTrigger className="w-full rounded-full sm:w-52" aria-label="Show habit">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>All habits</SelectItem>
                        {habits.map(({ name }) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground" aria-live="polite">
                    {heatmap.loggedDays === 0 ? (
                        <span>No entries in the last 12 months yet</span>
                    ) : (
                        <>
                            <span>
                                <span className="font-semibold text-foreground">{heatmap.activeDays}</span>
                                {habit ? ` ${heatmap.activeDays === 1 ? "day" : "days"} done` : ` active ${heatmap.activeDays === 1 ? "day" : "days"}`}
                            </span>
                            <span>
                                <span className="font-semibold text-foreground">{heatmap.loggedDays}</span>
                                {` ${heatmap.loggedDays === 1 ? "day" : "days"} logged`}
                            </span>
                            {habit ? (
                                <span>Current streak <span className="font-semibold text-foreground">{plural(streak, "day")}</span></span>
                            ) : (
                                heatmap.max > 0 && <span>Best day <span className="font-semibold text-foreground">{plural(heatmap.max, "habit")}</span></span>
                            )}
                        </>
                    )}
                </div>

                <p className="sr-only">{summary} Use the arrow keys to move between days.</p>

                <div ref={scrollRef} className="-mx-1 overflow-x-auto px-1 pb-2">
                    <div className="relative min-w-[760px]" onMouseLeave={() => setHovered(null)}>
                        <div
                            ref={gridRef}
                            role="group"
                            aria-label="Habit activity, last 12 months"
                            onKeyDown={handleKeyDown}
                            className="grid gap-[3px]"
                            style={{ gridTemplateColumns: `1.75rem repeat(${WEEKS}, minmax(0, 1fr))` }}
                        >
                            {/* month labels */}
                            <span aria-hidden="true" />
                            {heatmap.weeks.map((_, week) => {
                                const label = heatmap.monthLabels.find((l) => l.week === week)
                                return (
                                    <span key={week} aria-hidden="true" className="h-4 overflow-visible whitespace-nowrap text-[11px] leading-4 text-muted-foreground">
                                        {label ? monthFormat.format(fromDateKey(`${label.month}-01`)) : ""}
                                    </span>
                                )
                            })}

                            {/* one row per weekday */}
                            {ROW_LABELS.map((rowLabel, row) => (
                                <Row
                                    key={row}
                                    row={row}
                                    rowLabel={rowLabel}
                                    heatmap={heatmap}
                                    todayKey={todayKey}
                                    selectedKey={selectedKey}
                                    focusedKey={focusedKey}
                                    describe={describe}
                                    onFocusDay={(cell, week) => { setFocusedKey(cell.date); setHovered({ cell, week, row }) }}
                                    onHoverDay={(cell, week) => setHovered({ cell, week, row })}
                                    onBlurDay={() => setHovered(null)}
                                    onSelectDay={onSelectDay}
                                />
                            ))}
                        </div>

                        {hovered && <HeatmapTooltip hovered={hovered} entries={entries} habit={habit} describe={describe} />}

                        {heatmap.loggedDays === 0 && (
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <p className="rounded-full bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-soft">
                                    Log a few days to see your habit activity
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <Legend />
            </CardContent>
        </Card>
    )
}

function Row({ row, rowLabel, heatmap, todayKey, selectedKey, focusedKey, describe, onFocusDay, onHoverDay, onBlurDay, onSelectDay }) {
    return (
        <>
            <span aria-hidden="true" className="pr-1 text-[11px] leading-none text-muted-foreground self-center">{rowLabel}</span>
            {heatmap.weeks.map((week, weekIndex) => {
                const cell = week[row]
                if (cell.future) return <span key={cell.date} aria-hidden="true" className="aspect-square" />

                const isToday = cell.date === todayKey
                const isSelected = cell.date === selectedKey
                const { date, text } = describe(cell)
                return (
                    <button
                        key={cell.date}
                        type="button"
                        data-date={cell.date}
                        tabIndex={cell.date === focusedKey ? 0 : -1}
                        aria-label={`${date}${isToday ? ", today" : ""}: ${text}`}
                        aria-pressed={onSelectDay ? isSelected : undefined}
                        onClick={() => onSelectDay?.(cell.date)}
                        onMouseEnter={() => onHoverDay(cell, weekIndex)}
                        onFocus={() => onFocusDay(cell, weekIndex)}
                        onBlur={onBlurDay}
                        className={cn(
                            "aspect-square w-full rounded-[3px] transition-transform hover:scale-125 focus-visible:scale-125",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            cell.level === null ? NO_ENTRY_CLASS : LEVEL_CLASSES[cell.level],
                            isToday && "ring-1 ring-foreground/50",
                            isSelected && "ring-2 ring-foreground/60"
                        )}
                    />
                )
            })}
        </>
    )
}

// Floating label above the hovered / focused day.
function HeatmapTooltip({ hovered, entries, habit, describe }) {
    const { cell, week, row } = hovered
    const names = entries[cell.date]?.habits ?? []
    const { date, text } = describe(cell)

    // position: above the cell; aligned to the side near the edges
    const left = `calc(1.75rem + (100% - 1.75rem) * ${(week + 0.5) / WEEKS})`
    const top = `calc(1rem + 3px + ${row} * ((100% - 1rem - 3px) / 7))`
    const align = week < 6 ? "0%" : week > WEEKS - 7 ? "-100%" : "-50%"

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute z-10 w-max max-w-64 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-soft-lg"
            style={{ left, top: `calc(${top} - 6px)`, transform: `translate(${align}, -100%)` }}
        >
            <p className="font-medium">{date}</p>
            <p className="text-muted-foreground">{text}</p>
            {!habit && names.length > 0 && (
                <p className="mt-1 text-muted-foreground">✓ {names.join(", ")}</p>
            )}
        </div>
    )
}

function Legend() {
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground" aria-hidden="true">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <span className={cn("h-3 w-3 rounded-[3px]", NO_ENTRY_CLASS)} /> No entry
                </span>
                <span className="flex items-center gap-1.5">
                    <span className={cn("h-3 w-3 rounded-[3px]", LEVEL_CLASSES[0])} /> Logged, no habits
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                Less
                {LEVEL_CLASSES.slice(1).map((className) => (
                    <span key={className} className={cn("h-3 w-3 rounded-[3px]", className)} />
                ))}
                More
            </div>
        </div>
    )
}
