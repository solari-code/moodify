"use client"

import { useMemo, useState } from "react"
import { Flame } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"

import { MOOD_PERIODS, averageMood, habitCompletion, habitStreaks } from "@/lib/stats"
import { moodColor, moodEmoji } from "@/lib/mood"
import { cn } from "@/lib/utils"
import { useFormatter, useTranslations } from "@/i18n/client"

// Side card of the dashboard: average mood and habit completion for a
// period, and each habit's streak and completion.
//
// entries:  { "YYYY-MM-DD": entry } (all entries of the user)
// habits:   current habit list [{ name }]
// todayKey: the user's today ("YYYY-MM-DD", from the browser)
export default function Overview({ entries, habits, todayKey }) {

    const t = useTranslations("dashboard.overview")
    const format = useFormatter()
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

    // The period switch: short visible names ("7 days"); screen readers get the
    // long name ("Last 7 days"), which contains the short one, so voice control
    // users can say what they see.
    const periodOptions = Object.keys(MOOD_PERIODS).map((value) => ({
        value,
        label: t(`periods.${value}.short`),
        ariaLabel: t(`periods.${value}.long`),
    }))

    return (
        <Card>
            <CardHeader className="space-y-4">
                <CardTitle as="h2">{t("title")}</CardTitle>
                <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} ariaLabel={t("periodLabel")} />
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <StatTile label={t("averageMood")} testId="average-mood">
                        {average === null ? (
                            <span className="text-muted-foreground">–</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: moodColor(average) }} aria-hidden="true" />
                                {format.decimal(average)}
                                <span className="font-emoji text-xl" aria-hidden="true">{moodEmoji(Math.round(average))}</span>
                            </span>
                        )}
                    </StatTile>
                    <StatTile label={t("habitsDone")}>
                        {completion.rate === null
                            ? <span className="text-muted-foreground">–</span>
                            : format.percent(completion.rate)}
                    </StatTile>
                </div>
                <p className="-mt-3 text-xs text-muted-foreground">
                    {count === 0 ? t("noEntries") : t("basedOn", { count })}
                </p>

                <section className="space-y-3">
                    <h3 className="font-sans text-base font-medium">{t("habits")}</h3>
                    {habits.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t("noHabits")}</p>
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
                                                {/* visible "3 days", screen readers "3 days streak" */}
                                                {t.rich("streak", {
                                                    count: streak,
                                                    hidden: (chunks) => <span className="sr-only">{chunks}</span>,
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
                                                role="img"
                                                aria-label={rate === null
                                                    ? t("completionNone", { name })
                                                    : t("completion", { name, percent: format.percent(rate) })}
                                            >
                                                <div
                                                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                                                    style={{ width: rate === null ? 0 : `${rate * 100}%` }}
                                                />
                                            </div>
                                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                                                {rate === null ? "–" : format.percent(rate)}
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
