"use client"

import { useEffect, useMemo, useState } from 'react'

import DashboardHeader from "@/components/dashboard/DashboardHeader"
import WeekStrip from "@/components/dashboard/WeekStrip"
import DayTracker from '@/components/dashboard/DayTracker'
import Overview from '@/components/dashboard/Overview'
import MoodChart from '@/components/dashboard/MoodChart'
import HabitHeatmap from '@/components/dashboard/HabitHeatmap'
import DemoDataBar from '@/components/dashboard/DemoDataBar'
import UnsavedChangesDialog from '@/components/dashboard/UnsavedChangesDialog'

import { saveEntry, deleteEntry } from "@/app/actions/entries"
import { addHabit, removeHabit } from "@/app/actions/habits"
import { loadDemoData } from "@/app/actions/demo"
import { toDateKey, fromDateKey } from "@/lib/dates"
import { habitStreaks } from "@/lib/stats"
import { useIsClient } from "@/hooks/useIsClient"
import { useFormatter, useTranslations } from "@/i18n/client"
import { FULL_DATE } from "@/i18n/formatter"

// Holds the dashboard state: the selected day, all entries (by day) and the
// habit list. Changes go to the server first; the state is updated from the
// server's response.
// userName: shown in the greeting
// localMode: shows the demo data bar
export default function ClientWrapper({ habits: initialHabits, entries: initialEntries, userName = "", localMode = false }) {

    const isClient = useIsClient();
    const t = useTranslations("dashboard");
    const format = useFormatter();

    // The user's "today" is only known in the browser (timezone). On the server
    // this value is never used, because only a placeholder is rendered there.
    const [today] = useState(() => new Date());
    const [selectedKey, setSelectedKey] = useState(null); // "YYYY-MM-DD", null = today

    const [habits, setHabits] = useState(initialHabits);
    // { "YYYY-MM-DD": entry }
    const [entries, setEntries] = useState(() => Object.fromEntries(initialEntries.map((entry) => [entry.date, entry])));

    // Increased when all data is replaced (demo data), so the day form starts
    // fresh even if the selected day stays the same.
    const [dataVersion, setDataVersion] = useState(0);

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

    // The check-in has unsaved changes: switching days asks first
    // (pendingKey = the day the user wanted to go to), and the browser warns
    // before reloading or closing the tab.
    const [trackerDirty, setTrackerDirty] = useState(false);
    const [pendingKey, setPendingKey] = useState(null);

    useEffect(() => {
        if (!trackerDirty) return
        function warn(event) {
            event.preventDefault();
            event.returnValue = ""; // older browsers need this to show the prompt
        }
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [trackerDirty]);

    // current streak per habit, for the habit rows of the check-in
    const streaks = useMemo(() => Object.fromEntries(
        habitStreaks(entries, habits, toDateKey(today)).map(({ name, streak }) => [name, streak])
    ), [entries, habits, today]);

    if (!isClient) return <DashboardPlaceholder />

    const todayKey = toDateKey(today);
    const dateKey = selectedKey ?? todayKey;
    const isToday = dateKey === todayKey;
    const dayLabel = format.date(fromDateKey(dateKey), FULL_DATE);

    // All day changes (week strip, calendar, "Back to today") go through here.
    function selectDay(key) {
        if (key === dateKey) return
        if (trackerDirty) {
            setPendingKey(key);
            return
        }
        setSelectedKey(key);
    }

    // From the charts: select the day and bring the check-in into view.
    function openDay(key) {
        selectDay(key);
        if (!trackerDirty) {
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            document.getElementById("check-in")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
    }

    function discardAndSwitch() {
        setSelectedKey(pendingKey);
        setPendingKey(null);
    }

    return (
        <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8">
            {localMode && <DemoDataBar onLoad={handleLoadDemoData} />}

            <DashboardHeader
                userName={userName}
                today={today}
                todayKey={todayKey}
                selectedKey={dateKey}
                entries={entries}
                onSelect={selectDay}
            />
            <WeekStrip selectedKey={dateKey} todayKey={todayKey} entries={entries} onSelect={selectDay} />

            <div className="grid items-start gap-6 lg:grid-cols-3">
                {/* main column: the day's check-in */}
                <DayTracker
                    key={`${dateKey}-${dataVersion}`}
                    dateKey={dateKey}
                    isToday={isToday}
                    dateLabel={isToday ? t("todayLabel", { date: dayLabel }) : format.capitalize(dayLabel)}
                    entry={entries[dateKey] ?? null}
                    habits={habits}
                    streaks={streaks}
                    onSaveEntry={handleSaveEntry}
                    onDeleteEntry={handleDeleteEntry}
                    onAddHabit={handleAddHabit}
                    onRemoveHabit={handleRemoveHabit}
                    onDirtyChange={setTrackerDirty}
                />

                {/* side column: statistics */}
                <Overview entries={entries} habits={habits} todayKey={todayKey} />
            </div>

            <MoodChart entries={entries} todayKey={todayKey} onSelectDay={openDay} />
            <HabitHeatmap
                entries={entries}
                habits={habits}
                todayKey={todayKey}
                selectedKey={dateKey}
                onSelectDay={openDay}
            />

            <UnsavedChangesDialog
                open={pendingKey !== null}
                dayLabel={dayLabel}
                onKeep={() => setPendingKey(null)}
                onDiscard={discardAndSwitch}
            />
        </div>
    )
}

// Rendered on the server and during hydration, until the browser's date is
// known. Same layout as the dashboard, so nothing jumps when it appears.
function DashboardPlaceholder() {
    const t = useTranslations("dashboard");

    return (
        <div className="container mx-auto max-w-6xl space-y-6 px-4 py-8" aria-busy="true" aria-label={t("loading")}>
            <div className="space-y-3">
                <div className="h-4 w-40 animate-pulse rounded-full bg-muted" />
                <div className="h-9 w-72 max-w-full animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-64 max-w-full animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-[116px] animate-pulse rounded-xl bg-muted" />
            <div className="grid items-start gap-6 lg:grid-cols-3">
                <div className="h-96 animate-pulse rounded-xl bg-muted lg:col-span-2" />
                <div className="h-72 animate-pulse rounded-xl bg-muted" />
            </div>
            <div className="h-96 animate-pulse rounded-xl bg-muted" />
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
    )
}
