"use client"

import { useEffect, useId, useState } from "react"
import { Settings2, CircleCheck, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import MoodPicker from "@/components/dashboard/MoodPicker"
import ProgressRing from "@/components/dashboard/ProgressRing"
import ManageHabitsDialog from "@/components/dashboard/ManageHabitsDialog"
import HabitSuggestions from "@/components/dashboard/HabitSuggestions"
import HabitRow from "@/components/dashboard/HabitRow"
import { cn } from "@/lib/utils"
import { useFormatter, useTranslations } from "@/i18n/client"
import { errorMessage } from "@/i18n/errors"

function sameHabits(a, b) {
    return a.length === b.length && a.every((name) => b.includes(name))
}

// The check-in card for one day: mood, habits and saving. The dashboard
// gives it a `key` per day, so switching days starts with a fresh form
// filled from that day's entry.
//
// Mood is required for an entry; habits are optional. Nothing is saved until
// the user presses Save (one entry per day, saving again overwrites it).
//
// entry:     the saved entry of the day or null
// habits:    the user's current habit list [{ name }]
// streaks:   { [habit name]: current streak in days }
// isToday / dateLabel: for the card header
// on*:       callbacks that call the server and update the dashboard state;
//            they return the server action's result
// onDirtyChange: called with true/false when unsaved changes appear/disappear
export default function DayTracker({
    entry, habits, streaks = {}, dateKey, isToday, dateLabel,
    onSaveEntry, onDeleteEntry, onAddHabit, onRemoveHabit, onDirtyChange,
}) {

    const t = useTranslations()
    const format = useFormatter()
    const moodLabelId = useId()
    const habitsLabelId = useId()

    // null = no mood chosen yet
    const [mood, setMood] = useState(entry?.mood ?? null)
    const [doneHabits, setDoneHabits] = useState(() => entry?.habits ?? [])
    const [pending, setPending] = useState(null) // "save" | "delete" | null
    const [error, setError] = useState("") // error code, see errorMessage
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const habitNames = habits.map((habit) => habit.name)

    // Habits of the saved entry that were deleted from the habit list since.
    // They aren't shown as rows, but are saved back unchanged, so the day keeps its history.
    const hiddenHabits = (entry?.habits ?? []).filter((name) => !habitNames.includes(name))

    // What "Save" would store: the visible habits switched on + the hidden ones.
    const visibleDone = habitNames.filter((name) => doneHabits.includes(name))
    const habitsToSave = [...visibleDone, ...hiddenHabits]

    // Differs from what is stored (for a new day: anything was filled in).
    const hasChanges = entry
        ? mood !== entry.mood || !sameHabits(habitsToSave, entry.habits)
        : mood !== null || visibleDone.length > 0

    // Tell the dashboard, so it can ask before switching days. Reset when
    // this day's form goes away.
    useEffect(() => {
        onDirtyChange?.(hasChanges)
        return () => onDirtyChange?.(false)
    }, [hasChanges, onDirtyChange])

    function toggleHabit(name) {
        setConfirmingDelete(false)
        setDoneHabits((current) => current.includes(name)
            ? current.filter((done) => done !== name)
            : [...current, name])
    }

    function chooseMood(value) {
        setConfirmingDelete(false)
        setMood(value)
    }

    function discardChanges() {
        setMood(entry?.mood ?? null)
        setDoneHabits(entry?.habits ?? [])
        setError("")
    }

    // Suggestion chips in the empty state; errors are shown below the card content.
    async function addSuggestedHabit(name) {
        setError("")
        try {
            const result = await onAddHabit(name)
            if (!result.success) setError(result.error)
        } catch {
            setError("addHabitFailed")
        }
    }

    async function saveEntry() {
        setPending("save")
        setError("")
        try {
            const result = await onSaveEntry({ date: dateKey, mood, habits: habitsToSave })
            if (!result.success) setError(result.error)
        } catch {
            setError("saveFailed")
        } finally {
            setPending(null)
        }
    }

    async function deleteEntry() {
        setPending("delete")
        setError("")
        try {
            const result = await onDeleteEntry(dateKey)
            if (result.success || result.notFound) {
                // the day is empty now: start with an empty form
                setMood(null)
                setDoneHabits([])
                setConfirmingDelete(false)
            } else {
                setError(result.error)
            }
        } catch {
            setError("deleteFailed")
        } finally {
            setPending(null)
        }
    }

    const manageButton = (
        <ManageHabitsDialog habits={habits} onAddHabit={onAddHabit} onRemoveHabit={onRemoveHabit}>
            <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("checkIn.manageHabits")}
            </Button>
        </ManageHabitsDialog>
    )

    return (
        <Card id="check-in" className="scroll-mt-24 lg:col-span-2">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-4 sm:px-6">
                <div className="space-y-1.5">
                    <CardTitle as="h2" className="text-2xl">{t(isToday ? "checkIn.titleToday" : "checkIn.title")}</CardTitle>
                    <CardDescription>{dateLabel}</CardDescription>
                </div>
                {habits.length > 0 && <ProgressRing done={visibleDone.length} total={habits.length} />}
            </CardHeader>

            <CardContent className="space-y-8 px-4 sm:px-6">
                {/* MOOD */}
                <section className="space-y-3">
                    <h3 id={moodLabelId} className="font-sans text-base font-medium">
                        {t(isToday ? "checkIn.moodQuestionToday" : "checkIn.moodQuestion")}
                    </h3>
                    <MoodPicker
                        value={mood}
                        onChange={chooseMood}
                        labelId={moodLabelId}
                        emptyText={t(isToday ? "checkIn.moodEmptyToday" : "checkIn.moodEmpty")}
                    />
                </section>

                {/* HABITS */}
                <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 id={habitsLabelId} className="font-sans text-base font-medium">{t("checkIn.habits")}</h3>
                        {habits.length > 0 && manageButton}
                    </div>

                    {habits.length === 0 ? (
                        <div className="space-y-4 rounded-xl border border-dashed bg-muted/40 p-5 text-center">
                            <div className="space-y-1">
                                <p className="font-medium">{t("checkIn.emptyTitle")}</p>
                                <p className="text-sm text-muted-foreground">{t("checkIn.emptyText")}</p>
                            </div>
                            <HabitSuggestions existing={habitNames} onAdd={addSuggestedHabit} className="[&_ul]:justify-center" />
                            {manageButton}
                        </div>
                    ) : (
                        <ul aria-labelledby={habitsLabelId} className="grid gap-2 sm:grid-cols-2">
                            {habits.map(({ name }) => (
                                <li key={name}>
                                    <HabitRow
                                        name={name}
                                        done={doneHabits.includes(name)}
                                        streak={streaks[name] ?? 0}
                                        onToggle={() => toggleHabit(name)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}

                    {hiddenHabits.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {t("checkIn.hiddenHabits", { habits: format.list(hiddenHabits), count: hiddenHabits.length })}
                        </p>
                    )}
                </section>

                {error && <p role="alert" className="text-sm text-destructive">{errorMessage(t, error)}</p>}

                <SaveBar
                    entry={entry}
                    mood={mood}
                    hasChanges={hasChanges}
                    pending={pending}
                    confirmingDelete={confirmingDelete}
                    onSave={saveEntry}
                    onDiscard={discardChanges}
                    onAskDelete={() => setConfirmingDelete(true)}
                    onCancelDelete={() => setConfirmingDelete(false)}
                    onDelete={deleteEntry}
                />
            </CardContent>
        </Card>
    )
}

// Footer of the check-in: what the state is and what can be done.
// Sticks to the bottom of the screen while there are unsaved changes.
function SaveBar({ entry, mood, hasChanges, pending, confirmingDelete, onSave, onDiscard, onAskDelete, onCancelDelete, onDelete }) {

    const t = useTranslations()
    const busy = pending !== null

    if (confirmingDelete) {
        return (
            <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm">{t("checkIn.save.confirmDelete")}</p>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={onCancelDelete} disabled={busy}>{t("common.cancel")}</Button>
                    <Button variant="destructive" size="sm" onClick={onDelete} disabled={busy}>
                        {t(pending === "delete" ? "checkIn.save.deleting" : "checkIn.save.deleteEntry")}
                    </Button>
                </div>
            </div>
        )
    }

    let status
    if (pending === "save") status = "saving"
    else if (mood === null) status = "chooseMood"
    else if (!entry) status = "notSaved"
    else if (hasChanges) status = "unsaved"
    else status = "saved"

    const saved = entry && !hasChanges && !busy

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between",
                hasChanges
                    ? "sticky bottom-4 z-10 border-primary/30 bg-card/95 shadow-soft-lg backdrop-blur"
                    : "bg-muted/40"
            )}
        >
            <p role="status" className={cn("flex items-center gap-2 text-sm", saved ? "text-primary" : "text-muted-foreground")}>
                {saved && <CircleCheck className="h-4 w-4" aria-hidden="true" />}
                {hasChanges && !busy && <span className="h-2 w-2 rounded-full bg-peach-strong" aria-hidden="true" />}
                {t(`checkIn.save.${status}`)}
            </p>

            <div className="flex flex-wrap gap-2 sm:justify-end">
                {hasChanges && (
                    <Button variant="ghost" size="sm" onClick={onDiscard} disabled={busy}>{t("checkIn.save.discard")}</Button>
                )}
                {saved && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={onAskDelete}
                    >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        {t("checkIn.save.deleteEntry")}
                    </Button>
                )}
                {!saved && (
                    <Button size="sm" className="min-w-28" onClick={onSave} disabled={busy || mood === null || !hasChanges}>
                        {t(pending === "save" ? "checkIn.save.saving" : entry ? "checkIn.save.update" : "checkIn.save.saveEntry")}
                    </Button>
                )}
            </div>
        </div>
    )
}
