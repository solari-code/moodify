"use client"

import { useMemo, useState } from "react"
import { Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"

import { MOOD_PERIODS, averageMood, habitCompletion, habitStreaks } from "@/lib/stats"
import { moodColor, moodEmoji } from "@/lib/mood"
import { cn } from "@/lib/utils"

// Options of the period switch (the keys of MOOD_PERIODS), with short labels.
const SHORT_LABELS = { week: "7 days", month: "30 days", year: "Year", total: "All" }
const PERIOD_OPTIONS = Object.entries(MOOD_PERIODS).map(([value, period]) => ({
    value,
    label: SHORT_LABELS[value],
    ariaLabel: period.label,
}))

function plural(count, singular, pluralForm = `${singular}s`) {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

function percent(rate) {
    return `${Math.round(rate * 100)} %`
}

// Side card of the dashboard: average mood and habit completion for a
// period, and each habit's streak and completion.
//
// entries:  { "YYYY-MM-DD": entry } (all entries of the user)
// habits:   current habit list [{ name }]
// todayKey: the user's today ("YYYY-MM-DD", from the browser)
export default function Overview({ entries, habits, todayKey }) {

    const [period, setPeriod] = useState("week")
    const days = MOOD_PERIODS[period].days

    const { average, count } = useMemo(
        () => averageMood(entries, { todayKey, days }),
        [entries, todayKey, days]
    )
    const completion = useMemo(
        () => habitCompletion(entries, habits, { todayKey, days }),
        [entries, habits, todayKey, days]
    )
    const streaks = useMemo(() => habitStreaks(entries, habits, todayKey), [entries, habits, todayKey])
    const bestStreak = Math.max(0, ...streaks.map((streak) => streak.streak))

    return (
        <Card>
            <CardHeader className="space-y-4">
                <CardTitle as="h2">Overview</CardTitle>
                <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} ariaLabel="Period" />
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <StatTile label="Average mood" testId="average-mood">
                        {average === null ? (
                            <span className="text-muted-foreground">–</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: moodColor(average) }} aria-hidden="true" />
                                {average.toFixed(1)}
                                <span className="font-emoji text-xl" aria-hidden="true">{moodEmoji(Math.round(average))}</span>
                            </span>
                        )}
                    </StatTile>
                    <StatTile label="Habits done">
                        {completion.rate === null
                            ? <span className="text-muted-foreground">–</span>
                            : percent(completion.rate)}
                    </StatTile>
                </div>
                <p className="-mt-3 text-xs text-muted-foreground">
                    {count === 0
                        ? "No entries in this period"
                        : `Based on ${plural(count, "logged day")}`}
                </p>

                <section className="space-y-3">
                    <h3 className="font-sans text-base font-medium">Habits</h3>
                    {habits.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Add habits to see your streaks</p>
                    ) : (
                        <ul className="space-y-4">
                            {streaks.map(({ name, streak }, index) => {
                                const rate = completion.perHabit[index]?.rate ?? null
                                return (
                                    <li key={name} className="space-y-1.5">
                                        <div className="flex items-center justify-between gap-2 text-sm">
                                            <span className="min-w-0 truncate font-medium">{name}</span>
                                            <span
                                                className={cn(
                                                    "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                                    streak > 0 ? "bg-peach text-peach-foreground" : "bg-muted text-muted-foreground",
                                                    streak > 0 && streak === bestStreak && "ring-1 ring-peach-strong"
                                                )}
                                            >
                                                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                                                {plural(streak, "day")}
                                                <span className="sr-only"> streak</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
                                                role="img"
                                                aria-label={rate === null ? `${name}: no logged days` : `${name}: done on ${percent(rate)} of logged days`}
                                            >
                                                <div
                                                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                                                    style={{ width: rate === null ? 0 : `${rate * 100}%` }}
                                                />
                                            </div>
                                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                                                {rate === null ? "–" : percent(rate)}
                                            </span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>
            </CardContent>
        </Card>
    )
}

function StatTile({ label, testId, children }) {
    return (
        <div className="rounded-xl bg-muted/60 p-3">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-heading text-3xl font-semibold tabular-nums" data-testid={testId}>{children}</p>
        </div>
    )
}
