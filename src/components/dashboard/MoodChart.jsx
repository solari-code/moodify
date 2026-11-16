"use client"

import { useMemo, useState } from "react"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { MOOD_CHART_RANGES, averageMood, moodSeries } from "@/lib/stats"
import { moodColor, moodEmoji, moodLabel } from "@/lib/mood"
import { fromDateKey } from "@/lib/dates"

// "the last …" for each range, used in texts and labels
const RANGE_PHRASES = { week: "7 days", month: "30 days", quarter: "90 days", year: "year" }

const RANGE_OPTIONS = Object.entries(MOOD_CHART_RANGES).map(([value, range]) => ({
    value,
    label: range.label,
    ariaLabel: `Last ${RANGE_PHRASES[value]}`,
}))

const CHART_CONFIG = {
    mood: { label: "Daily mood", color: "hsl(var(--muted-foreground) / 0.45)" },
    average: { label: "7-day average", color: "hsl(var(--primary))" },
}

const dayTickFormat = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" })
const monthTickFormat = new Intl.DateTimeFormat(undefined, { month: "short" })
const tooltipDateFormat = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })

// Line chart of the daily mood with its 7-day rolling average. Days without
// an entry are gaps (not 0). Each logged day is a dot in its mood color;
// clicking a day opens it in the check-in.
//
// entries:     { "YYYY-MM-DD": entry }
// todayKey:    the user's today
// titleAs:     heading level of the card title (h2 on the dashboard)
// onSelectDay: called with a day key when a day in the chart is clicked
//              (optional: without it the chart is view-only, e.g. on the landing page)
export default function MoodChart({ entries, todayKey, onSelectDay, titleAs = "h2" }) {

    const [range, setRange] = useState("month")
    const { days } = MOOD_CHART_RANGES[range]
    const phrase = RANGE_PHRASES[range]

    const series = useMemo(() => moodSeries(entries, { todayKey, days }), [entries, todayKey, days])
    const { average, count } = useMemo(() => averageMood(entries, { todayKey, days }), [entries, todayKey, days])

    // Dots get smaller with more days. A year only shows the average: the
    // daily line would be too dense to read (the tooltip still has each day).
    const dotRadius = days <= 30 ? 4 : 2.5
    const showDaily = days <= 90

    function renderDot({ cx, cy, payload, index }) {
        if (payload.mood === null || cx == null || cy == null) return <g key={`dot-${index}`} />
        return (
            <circle
                key={`dot-${index}`}
                cx={cx} cy={cy} r={dotRadius}
                fill={moodColor(payload.mood)}
                stroke="hsl(var(--card))" strokeWidth={1.5}
            />
        )
    }

    function renderActiveDot({ cx, cy, payload }) {
        if (payload.mood === null || cx == null || cy == null) return <g />
        return <circle cx={cx} cy={cy} r={6} fill={moodColor(payload.mood)} stroke="hsl(var(--card))" strokeWidth={2} />
    }

    // A year is labeled by month, with ticks on the 1st of each month;
    // shorter ranges by day, spaced by Recharts.
    const byMonth = days > 90
    const formatTick = (dateKey) => (byMonth ? monthTickFormat : dayTickFormat).format(fromDateKey(dateKey))
    const monthTicks = useMemo(
        () => series.filter((point) => point.date.endsWith("-01")).map((point) => point.date),
        [series]
    )

    const summary = count === 0
        ? `No moods logged in the last ${phrase}.`
        : `Average ${average.toFixed(1)} over the last ${phrase}, ${count} of ${days} days logged.`

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                    <CardTitle as={titleAs}>Mood over time</CardTitle>
                    <CardDescription>
                        {showDaily ? "Your daily mood and its 7-day average." : "Your 7-day average mood over the year."}
                        {onSelectDay && " Click a day to open it."}
                    </CardDescription>
                </div>
                <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} ariaLabel="Chart range" className="self-start" />
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-4" aria-hidden="true">
                        {showDaily && <span className="flex items-center gap-1.5">
                            <span className="flex gap-0.5">
                                {[2, 5, 8].map((mood) => (
                                    <span key={mood} className="h-2 w-2 rounded-full" style={{ background: moodColor(mood) }} />
                                ))}
                            </span>
                            Daily mood
                        </span>}
                        <span className="flex items-center gap-1.5">
                            <span className="h-0.5 w-4 rounded-full bg-primary" />
                            7-day average
                        </span>
                    </div>
                    <p aria-live="polite">
                        {count === 0 ? (
                            "No entries in this range"
                        ) : (
                            <>
                                Average <span className="font-semibold text-foreground">{average.toFixed(1)}</span>
                                {" · "}{count} of {days} days logged
                            </>
                        )}
                    </p>
                </div>

                <div className="relative">
                    <p className="sr-only">{summary}</p>
                    <ChartContainer config={CHART_CONFIG} className="h-56 sm:h-72">
                        <ComposedChart
                            data={series}
                            margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                            onClick={(state) => { if (state?.activeLabel) onSelectDay?.(state.activeLabel) }}
                            className={onSelectDay ? "cursor-pointer" : undefined}
                        >
                            <defs>
                                <linearGradient id="mood-average-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-average)" stopOpacity={0.22} />
                                    <stop offset="100%" stopColor="var(--color-average)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 4" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={byMonth ? 8 : 28}
                                ticks={byMonth ? monthTicks : undefined}
                                tickFormatter={formatTick}
                            />
                            <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tickLine={false} axisLine={false} width={40} />
                            <ChartTooltip
                                cursor={{ strokeDasharray: "3 4" }}
                                content={<MoodTooltip />}
                                isAnimationActive={false}
                            />
                            <Area
                                dataKey="average"
                                name="7-day average"
                                type="monotone"
                                stroke="var(--color-average)"
                                strokeWidth={2.5}
                                fill="url(#mood-average-fill)"
                                connectNulls
                                dot={false}
                                activeDot={false}
                            />
                            {showDaily && (
                                <Line
                                    dataKey="mood"
                                    name="Daily mood"
                                    type="linear"
                                    stroke="var(--color-mood)"
                                    strokeWidth={1.5}
                                    connectNulls={false}
                                    dot={renderDot}
                                    activeDot={renderActiveDot}
                                />
                            )}
                        </ComposedChart>
                    </ChartContainer>

                    {count === 0 && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                            <p className="rounded-full bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-soft">
                                No moods logged in the last {phrase} yet
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function MoodTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const point = payload[0].payload

    const shownHabits = point.habits.slice(0, 3)
    const moreHabits = point.habits.length - shownHabits.length

    return (
        <div className="min-w-44 max-w-60 space-y-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-soft-lg">
            <p className="font-medium">{tooltipDateFormat.format(fromDateKey(point.date))}</p>
            {point.mood === null ? (
                <p className="text-muted-foreground">No entry</p>
            ) : (
                <p className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: moodColor(point.mood) }} />
                    <span className="font-emoji text-sm leading-none">{moodEmoji(point.mood)}</span>
                    <span className="font-semibold">{point.mood}</span>
                    <span className="text-muted-foreground">{moodLabel(point.mood)}</span>
                </p>
            )}
            {point.average !== null && (
                <p className="text-muted-foreground">7-day average: <span className="font-medium text-foreground">{point.average.toFixed(1)}</span></p>
            )}
            {shownHabits.length > 0 && (
                <p className="text-muted-foreground">
                    ✓ {shownHabits.join(", ")}{moreHabits > 0 ? ` +${moreHabits} more` : ""}
                </p>
            )}
        </div>
    )
}
