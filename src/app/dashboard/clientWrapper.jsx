"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useMemo, useState } from 'react'

import Calendar from "@/components/dashboard/Calendar"
import DayTracker from '@/components/dashboard/DayTracker'
import Overview from '@/components/dashboard/Overview'
import DemoDataBar from '@/components/dashboard/DemoDataBar'

import { saveEntry, deleteEntry } from "@/app/actions/entries"
import { addHabit, removeHabit } from "@/app/actions/habits"
import { loadDemoData } from "@/app/actions/demo"
import { toDateKey } from "@/lib/dates"
import { useIsClient } from "@/hooks/useIsClient"

const dayLabelFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })

// Holds the dashboard state: the selected day, all entries (by day) and the
// habit list. Changes go to the server first; the state is updated from the
// server's response.
// localMode: shows the demo data bar
export default function ClientWrapper({ habits: initialHabits, entries: initialEntries, localMode = false }) {

    const isClient = useIsClient();

    // The user's "today" is only known in the browser (timezone). On the server
    // this value is never used, because only a placeholder is rendered there.
    const [today] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(null); // null = today

    const [habits, setHabits] = useState(initialHabits);
    // { "YYYY-MM-DD": entry }
    const [entries, setEntries] = useState(() => Object.fromEntries(initialEntries.map((entry) => [entry.date, entry])));

    // Increased when all data is replaced (demo data), so the day form starts
    // fresh even if the selected day stays the same.
    const [dataVersion, setDataVersion] = useState(0);

    const entryDates = useMemo(() => new Set(Object.keys(entries)), [entries]);

    async function handleSaveEntry(input) {
        const result = await saveEntry(input);
        if (result.success) {
            setEntries((current) => ({ ...current, [result.entry.date]: result.entry }));
        }
        return result
    }

    async function handleDeleteEntry(date) {
        const result = await deleteEntry(date);
        if (result.success || result.notFound) {
            setEntries((current) => {
                const next = { ...current };
                delete next[date];
                return next
            });
        }
        return result
    }

    async function handleAddHabit(name) {
        const result = await addHabit({ name });
        if (result.success) {
            setHabits((current) => [...current, result.habit]);
        }
        return result
    }

    async function handleRemoveHabit(name) {
        const result = await removeHabit(name);
        if (result.success) {
            setHabits((current) => current.filter((habit) => habit.name !== name));
        }
        return result
    }

    async function handleLoadDemoData() {
        const result = await loadDemoData(toDateKey(today));
        if (result.success) {
            setHabits(result.habits);
            setEntries(Object.fromEntries(result.entries.map((entry) => [entry.date, entry])));
            setDataVersion((version) => version + 1);
        }
        return result
    }

    if (!isClient) return <DashboardPlaceholder />

    const date = selectedDate ?? today;
    const dateKey = toDateKey(date);
    const isToday = dateKey === toDateKey(today);

    return (
        <div className="container mx-auto p-4 space-y-6">
            {localMode && <DemoDataBar onLoad={handleLoadDemoData} />}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-[2rem] items-start">
                <Card className=" flex-shrink-0 text-center">
                    <CardHeader >
                        <CardTitle>Select Date</CardTitle>
                    </CardHeader>
                    <CardContent className="cale">
                        <Calendar selected={date} onSelect={setSelectedDate} today={today} entryDates={entryDates} />
                    </CardContent>
                </Card>
                <Card className="flex-1 text-center">
                    <CardHeader >
                        <CardTitle>Log your Day</CardTitle>
                        <CardDescription>
                            {isToday ? "Today, " : ""}{dayLabelFormat.format(date)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DayTracker
                            key={`${dateKey}-${dataVersion}`}
                            dateKey={dateKey}
                            entry={entries[dateKey] ?? null}
                            habits={habits}
                            onSaveEntry={handleSaveEntry}
                            onDeleteEntry={handleDeleteEntry}
                            onAddHabit={handleAddHabit}
                            onRemoveHabit={handleRemoveHabit}
                        />
                    </CardContent>
                </Card>
                <Card className="flex-1 text-center">
                    <CardHeader>
                        <CardTitle>Mood & Habit overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Overview entries={entries} habits={habits} todayKey={toDateKey(today)} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Rendered on the server and during hydration, until the browser's date is known.
function DashboardPlaceholder() {
    return (
        <div className="container mx-auto p-4 space-y-6" aria-busy="true">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-[2rem] items-start">
                {["Select Date", "Log your Day", "Mood & Habit overview"].map((title) => (
                    <Card key={title} className="text-center">
                        <CardHeader>
                            <CardTitle>{title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72 animate-pulse rounded-md bg-muted" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
