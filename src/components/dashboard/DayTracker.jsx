"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Plus, X } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

import { moodEmoji } from "@/lib/mood"

// Keys that change the slider. Pressing one while no mood is chosen yet
// chooses the current position (so 0 can be picked without moving away first).
const SLIDER_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"]

function sameHabits(a, b) {
    return a.length === b.length && a.every((name) => b.includes(name))
}

// The form for one day. The dashboard gives it a `key` per day, so switching
// days starts with a fresh form filled from that day's entry.
//
// entry:  the saved entry of the day or null
// habits: the user's current habit list [{ name }]
// on*:    callbacks that call the server and update the dashboard state;
//         they return the server action's result
export default function DayTracker({ entry, habits, onSaveEntry, onDeleteEntry, onAddHabit, onRemoveHabit, dateKey }) {

    // null = no mood chosen yet
    let [mood, setMood] = useState(entry?.mood ?? null)
    let [doneHabits, setDoneHabits] = useState(() => entry?.habits ?? [])
    let [pending, setPending] = useState(null) // "save" | "delete" | null
    let [error, setError] = useState("")
    let [confirmingDelete, setConfirmingDelete] = useState(false)

    let [newHabit, setNewHabit] = useState("")
    let [tooltipOpen, setTooltipOpen] = useState(false)
    let [tooltipError, setTooltipError] = useState("");

    const habitNames = habits.map((habit) => habit.name)

    // Habits of the saved entry that were deleted from the habit list since.
    // They aren't shown, but are saved back unchanged, so the day keeps its history.
    const hiddenHabits = (entry?.habits ?? []).filter((name) => !habitNames.includes(name))

    // What "Save" would store: the visible habits switched on + the hidden ones.
    const habitsToSave = [...habitNames.filter((name) => doneHabits.includes(name)), ...hiddenHabits]

    const hasChanges = !entry || mood !== entry.mood || !sameHabits(habitsToSave, entry.habits)

    function handleTooltipError(message) {
        setTooltipError(message);
        setTooltipOpen(true);
        setTimeout(removeTooltipError, 3000);
    }
    function removeTooltipError() {
        setTooltipOpen(false);
        setTooltipError("");
    }

    function chooseMoodIfNone() {
        if (mood === null) setMood(0)
    }

    function toggleHabit(name) {
        setDoneHabits((current) => current.includes(name)
            ? current.filter((done) => done !== name)
            : [...current, name])
    }

    async function addHabit(habit) {
        const name = habit.trim()
        if (!name) return
        if (habitNames.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
            handleTooltipError("This habit already exists :)")
            return
        }

        try {
            const result = await onAddHabit(name)
            if (!result.success) {
                handleTooltipError(result.message)
                return
            }
            setNewHabit("")
        } catch {
            handleTooltipError("Could not add the habit. Please try again.")
        }
    }

    async function removeHabit(name) {
        try {
            await onRemoveHabit(name)
        } catch {
            handleTooltipError("Could not remove the habit. Please try again.")
        }
    }

    async function saveEntry() {
        setPending("save")
        setError("")
        try {
            const result = await onSaveEntry({ date: dateKey, mood, habits: habitsToSave })
            if (!result.success) setError(result.message)
        } catch {
            setError("Could not save the entry. Please try again.")
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
                setError(result.message)
            }
        } catch {
            setError("Could not delete the entry. Please try again.")
        } finally {
            setPending(null)
        }
    }

    let saveButton;
    if (pending === "save") {
        saveButton = <Button disabled className="w-full">Saving…</Button>
    } else if (mood === null) {
        saveButton = <Button disabled className="w-full">Select your mood</Button>
    } else if (!entry) {
        saveButton = <Button className="w-full" onClick={saveEntry} disabled={pending !== null}>Save entry</Button>
    } else if (hasChanges) {
        saveButton = <Button className="w-full" onClick={saveEntry} disabled={pending !== null}>Update entry</Button>
    } else {
        saveButton = <Button disabled className="w-full">Entry saved</Button>
    }

    return (
        <>
            <div className="space-y-4">
                <Label size="m" htmlFor="mood-slider">How are you?</Label>
                <Slider
                    id="mood-slider"
                    min={0}
                    max={10}
                    step={1}
                    value={[mood ?? 0]}
                    onValueChange={(value) => setMood(value[0])}
                    onPointerDown={chooseMoodIfNone}
                    onKeyDown={(event) => { if (SLIDER_KEYS.includes(event.key)) chooseMoodIfNone() }}
                />
                <div className="text-center font-semibold">{
                    mood === null ? "🌞" : mood + " " + moodEmoji(mood)
                }</div>
            </div>
            <Separator className="my-5" />
            <div className="space-y-2">
                <Label size="m">Habits</Label>
                {habits.map((habit, index) => (
                    <div key={habit.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`habit-${index}`}
                                checked={doneHabits.includes(habit.name)}
                                onCheckedChange={() => toggleHabit(habit.name)}
                            />
                            <Label htmlFor={`habit-${index}`}>{habit.name}</Label>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove habit ${habit.name}`}
                            onClick={() => removeHabit(habit.name)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <div className="flex items-center space-x-2">

                    <TooltipProvider disableHoverableContent>
                        <Tooltip open={tooltipOpen}>
                            <TooltipTrigger asChild>
                                <Input
                                    placeholder="Add new habit"
                                    value={newHabit}
                                    onChange={(e) => setNewHabit(e.target.value)}
                                />
                            </TooltipTrigger>

                            <TooltipContent>
                                <p>{tooltipError}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        onClick={() => { addHabit(newHabit) }}
                        size="icon"
                        aria-label="Add habit"
                        className="min-w-[40px]">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {saveButton}

                {entry && !confirmingDelete && (
                    <Button
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => setConfirmingDelete(true)}
                        disabled={pending !== null}
                    >
                        Delete entry
                    </Button>
                )}
                {entry && confirmingDelete && (
                    <div className="space-y-2 rounded-md border border-destructive/50 p-3">
                        <p className="text-sm">Delete the whole entry for this day?</p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setConfirmingDelete(false)}
                                disabled={pending !== null}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={deleteEntry}
                                disabled={pending !== null}
                            >
                                {pending === "delete" ? "Deleting…" : "Delete"}
                            </Button>
                        </div>
                    </div>
                )}

                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            </div>

        </>
    )
}
