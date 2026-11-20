"use client"

import { useMemo, useState } from "react"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { MOOD_CHART_RANGES, averageMood, moodSeries } from "@/lib/stats"
import { moodColor, moodEmoji } from "@/lib/mood"
import { useFormatter, useTranslations } from "@/i18n/client"
import { fromDateKey } from "@/lib/dates"

// Habits listed in the tooltip before "and 2 more".
const TOOLTIP_HABITS = 3

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

    const t = useTranslations("dashboard.moodChart")
    const format = useFormatter()
    const [range, setRange] = useState("month")
    const { days } = MOOD_CHART_RANGES[range]

    // Short visible names ("30 days"); screen readers get the long name
    // ("Last 30 days"), which contains the short one (for voice control).
    const rangeOptions = Object.keys(MOOD_CHART_RANGES).map((value) => ({
        value,
        label: t(`ranges.${value}.short`),
        ariaLabel: t(`ranges.${value}.long`),
    }))

    const chartConfig = {
        // daily line: --mood-line (3:1 on the card, see globals.css)
        mood: { label: t("dailyMood"), color: "hsl(var(--mood-line))" },
        average: { label: t("average"), color: "hsl(var(--primary))" },
    }

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
    const formatTick = (dateKey) => format.date(fromDateKey(dateKey), byMonth ? { month: "short" } : { day: "numeric", month: "short" })
    const monthTicks = useMemo(
        () => series.filter((point) => point.date.endsWith("-01")).map((point) => point.date),
        [series]
    )

    const rangeName = t(`ranges.${range}.long`)
    const summary = count === 0
        ? t("summaryEmpty", { range: rangeName })
        : t("summary", { range: rangeName, average: format.decimal(average), count, days })

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5">
                    <CardTitle as={titleAs}>{t("title")}</CardTitle>
                    <CardDescription>
                        {t(`${showDaily ? "description" : "descriptionYear"}${onSelectDay ? "Clickable" : ""}`)}
                    </CardDescription>
                </div>
                <SegmentedControl options={rangeOptions} value={range} onChange={setRange} ariaLabel={t("rangeLabel")} className="shrink-0 self-start" />
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
                            {t("dailyMood")}
                        </span>}
                        <span className="flex items-center gap-1.5">
                            <span className="h-0.5 w-4 rounded-full bg-primary" />
                            {t("average")}
                        </span>
                    </div>
                    <p aria-live="polite">
                        {count === 0 ? t("noEntries") : t.rich("stats", {
                            average: format.decimal(average),
                            count,
                            days,
                            b: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
                        })}
                    </p>
                </div>

                <div className="relative">
                    <p className="sr-only">{summary}</p>
                    <ChartContainer config={chartConfig} className="h-56 sm:h-72">
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
                            <YAxis domain={[0, 10]} ticks={[0, 5, 10]} tickFormatter={(value) => format.number(value)} tickLine={false} axisLine={false} width={40} />
                            <ChartTooltip
                                cursor={{ strokeDasharray: "3 4" }}
                                content={<MoodTooltip />}
                                isAnimationActive={false}
                            />
                            <Area
                                dataKey="average"
                                name={t("average")}
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
                                    name={t("dailyMood")}
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
                                {t("empty")}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function MoodTooltip({ active, payload }) {
    const t = useTranslations()
    const format = useFormatter()
    if (!active || !payload?.length) return null
    const point = payload[0].payload

    // "Walk, Read, Meditate, and 2 more"
    const listed = point.habits.slice(0, TOOLTIP_HABITS)
    const more = point.habits.length - listed.length
    const habitList = format.list(more > 0 ? [...listed, t("dashboard.moodChart.tooltip.more", { count: more })] : listed)

    return (
        <div className="min-w-44 max-w-60 space-y-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-soft-lg">
            <p className="font-medium">
                {format.capitalize(format.date(fromDateKey(point.date), { weekday: "short", day: "numeric", month: "short", year: "numeric" }))}
            </p>
            {point.mood === null ? (
                <p className="text-muted-foreground">{t("dashboard.moodChart.tooltip.noEntry")}</p>
            ) : (
                <p className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: moodColor(point.mood) }} />
                    <span className="font-emoji text-sm leading-none">{moodEmoji(point.mood)}</span>
                    <span className="font-semibold">{format.number(point.mood)}</span>
                    <span className="text-muted-foreground">{t(`moodLabels.${point.mood}`)}</span>
                </p>
            )}
            {point.average !== null && (
                <p className="text-muted-foreground">
                    {t.rich("dashboard.moodChart.tooltip.average", {
                        average: format.decimal(point.average),
                        b: (chunks) => <span className="font-medium text-foreground">{chunks}</span>,
                    })}
                </p>
            )}
            {listed.length > 0 && (
                <p className="text-muted-foreground">{t("dashboard.doneHabits", { habits: habitList })}</p>
            )}
        </div>
    )
}
