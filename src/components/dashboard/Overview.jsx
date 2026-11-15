"use client"

import { useMemo, useState } from "react"
import { Flame } from "lucide-react"
import { Label } from "../ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"

import { MOOD_PERIODS, averageMood, habitStreaks } from "@/lib/stats"

function plural(count, singular, pluralForm = `${singular}s`) {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

// entries:  { "YYYY-MM-DD": entry } (all entries of the user)
// habits:   current habit list [{ name }]
// todayKey: the user's today ("YYYY-MM-DD", from the browser)
export default function Overview({ entries, habits, todayKey }) {

    let [timeRange, setTimeRange] = useState("week");

    const { average, count } = useMemo(
        () => averageMood(entries, { todayKey, days: MOOD_PERIODS[timeRange].days }),
        [entries, todayKey, timeRange]
    );
    const streaks = useMemo(() => habitStreaks(entries, habits, todayKey), [entries, habits, todayKey]);

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                <Label size="m" htmlFor="average-mood-period">Average Mood</Label>
                <Select
                    value={timeRange}
                    onValueChange={setTimeRange}
                >
                    <SelectTrigger id="average-mood-period">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(MOOD_PERIODS).map(([value, period]) => (
                            <SelectItem key={value} value={value}>{period.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="mt-2 text-2xl font-bold text-center" data-testid="average-mood">
                    {average === null ? "–" : average.toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">
                    {count === 0 ? "No entries in this period" : `Based on ${plural(count, "entry", "entries")}`}
                </p>
            </div>
            <Separator />
            <div>
                <Label size="m">Habit Streaks</Label>

                <div className="space-y-2 mt-2">
                    {streaks.length === 0 && (
                        <p className="text-sm text-muted-foreground">Add habits to see your streaks</p>
                    )}
                    {streaks.map((streak) => (
                        <div key={streak.name} className="flex items-center justify-between">
                            <span>{streak.name}</span>
                            <Badge variant="secondary" className="flex items-center space-x-1">
                                <Flame className={`h-4 w-4 ${streak.streak > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
                                <span>{plural(streak.streak, "day")}</span>
                            </Badge>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}
