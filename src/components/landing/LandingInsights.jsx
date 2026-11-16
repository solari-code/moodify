"use client"

import { useMemo, useState } from "react"
import MoodChart from "@/components/dashboard/MoodChart"
import HabitHeatmap from "@/components/dashboard/HabitHeatmap"
import { createDemoData } from "@/lib/demoData"
import { toDateKey } from "@/lib/dates"
import { useIsClient } from "@/hooks/useIsClient"

// The dashboard's mood chart and habit heatmap with a few months of sample
// data, for the landing page. View-only (no day to open).
//
// Rendered in the browser only, like the dashboard: the dates depend on the
// visitor's today and language, which the server doesn't know.
export default function LandingInsights() {

    const isClient = useIsClient()
    const [todayKey] = useState(() => toDateKey(new Date()))

    const demo = useMemo(() => {
        const { habits, entries } = createDemoData(todayKey)
        return { habits, entries: Object.fromEntries(entries.map((entry) => [entry.date, entry])) }
    }, [todayKey])

    if (!isClient) {
        return (
            <div className="space-y-6" aria-busy="true">
                <div className="h-[26rem] animate-pulse rounded-xl bg-muted" />
                <div className="h-80 animate-pulse rounded-xl bg-muted" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <MoodChart entries={demo.entries} todayKey={todayKey} titleAs="h3" />
            <HabitHeatmap entries={demo.entries} habits={demo.habits} todayKey={todayKey} titleAs="h3" />
        </div>
    )
}
