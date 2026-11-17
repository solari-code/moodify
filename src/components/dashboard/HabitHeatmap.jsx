"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { habitHeatmap, habitStreak } from "@/lib/stats"
import { addDays, fromDateKey } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { useFormatter, useTranslations } from "@/i18n/client"
import { FULL_DATE } from "@/i18n/formatter"

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

// One row per weekday (weeks start on Monday). Only every other row is
// labeled ("Mon", "Wed", "Fri"), like GitHub, so the labels stay readable.
const ROWS = 7
const LABELED_ROWS = [0, 2, 4]
const A_MONDAY = "2024-01-01" // to get the weekday names in the app language

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

    const t = useTranslations("dashboard.heatmap")
    const format = useFormatter()
    const rowLabels = Array.from({ length: ROWS }, (_, row) => LABELED_ROWS.includes(row)
        ? format.date(fromDateKey(addDays(A_MONDAY, row)), { weekday: "short" })
        : "")

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

    // { date, text } for a day, e.g. "Tuesday, May 5, 2026" / "3 habits done"
    function describe(cell) {
        const date = format.capitalize(format.date(fromDateKey(cell.date), FULL_DATE))
        if (!cell.hasEntry) return { date, text: t("day.noEntry") }
        if (habit) return { date, text: t(cell.done ? "day.habitDone" : "day.habitNotDone", { habit }) }
        if (cell.done === 0) return { date, text: t("day.nothingDone") }
        return { date, text: t("day.habitsDone", { count: cell.done }) }
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
        ? t("noEntries")
        : habit
            ? t("summaryHabit", { habit, count: heatmap.activeDays })
            : t("summaryAll", { active: heatmap.activeDays, logged: heatmap.loggedDays })
    const bold = (chunks) => <span className="font-semibold text-foreground">{chunks}</span>

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                    <CardTitle as={titleAs}>{t("title")}</CardTitle>
                    <CardDescription>{t(onSelectDay ? "descriptionClickable" : "description")}</CardDescription>
                </div>
                <Select value={habit ?? ALL} onValueChange={setFilter}>
                    <SelectTrigger className="w-full rounded-full sm:w-52" aria-label={t("filterLabel")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={ALL}>{t("allHabits")}</SelectItem>
                        {habits.map(({ name }) => (
                            <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground" aria-live="polite">
                    {heatmap.loggedDays === 0 ? (
                        <span>{t("noEntries")}</span>
                    ) : (
                        <>
                            <span>{t.rich(habit ? "habitDays" : "activeDays", { count: heatmap.activeDays, b: bold })}</span>
                            <span>{t.rich("loggedDays", { count: heatmap.loggedDays, b: bold })}</span>
                            {habit ? (
                                <span>{t.rich("currentStreak", { count: streak, b: bold })}</span>
                            ) : (
                                heatmap.max > 0 && <span>{t.rich("bestDay", { count: heatmap.max, b: bold })}</span>
                            )}
                        </>
                    )}
                </div>

                <p className="sr-only">{summary}</p>
                <p className="sr-only">{t("keyboardHint")}</p>

                <div ref={scrollRef} className="-mx-1 overflow-x-auto px-1 pb-2">
                    <div className="relative min-w-[760px]" onMouseLeave={() => setHovered(null)}>
                        <div
                            ref={gridRef}
                            role="group"
                            aria-label={t("gridLabel")}
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
                                        {label ? format.date(fromDateKey(`${label.month}-01`), { month: "short" }) : ""}
                                    </span>
                                )
                            })}

                            {/* one row per weekday */}
                            {rowLabels.map((rowLabel, row) => (
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
                                    {t("empty")}
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
    const t = useTranslations("dashboard.heatmap")

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
                        aria-label={t(isToday ? "cellToday" : "cell", { date, text })}
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
    const t = useTranslations("dashboard")
    const format = useFormatter()
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
                <p className="mt-1 text-muted-foreground">{t("doneHabits", { habits: format.list(names) })}</p>
            )}
        </div>
    )
}

function Legend() {
    const t = useTranslations("dashboard.heatmap.legend")

    return (
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground" aria-hidden="true">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <span className={cn("h-3 w-3 rounded-[3px]", NO_ENTRY_CLASS)} /> {t("noEntry")}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className={cn("h-3 w-3 rounded-[3px]", LEVEL_CLASSES[0])} /> {t("nothingDone")}
                </span>
            </div>
            <div className="flex items-center gap-1.5">
                {t("less")}
                {LEVEL_CLASSES.slice(1).map((className) => (
                    <span key={className} className={cn("h-3 w-3 rounded-[3px]", className)} />
                ))}
                {t("more")}
            </div>
        </div>
    )
}
