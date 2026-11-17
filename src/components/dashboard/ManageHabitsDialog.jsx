"use client"

import { useId, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import HabitSuggestions from "@/components/dashboard/HabitSuggestions"
import { HABIT_NAME_MAX_LENGTH } from "@/lib/validation"
import { useTranslations } from "@/i18n/client"
import { errorMessage } from "@/i18n/errors"

// Dialog to add and remove habits. Removing asks for confirmation and keeps
// the habit in past entries (their history stays intact).
//
// habits: [{ name }]
// onAddHabit / onRemoveHabit: call the server, return the action result
// children: the trigger button
export default function ManageHabitsDialog({ habits, onAddHabit, onRemoveHabit, children }) {

    const t = useTranslations()
    const inputId = useId()
    const errorId = useId()
    const [open, setOpen] = useState(false)
    const [newHabit, setNewHabit] = useState("")
    const [adding, setAdding] = useState(false)
    const [error, setError] = useState("") // error code, see errorMessage
    const [confirming, setConfirming] = useState(null) // habit name waiting for "Remove"
    const [removing, setRemoving] = useState(null)

    const habitNames = habits.map((habit) => habit.name)

    function handleOpenChange(next) {
        setOpen(next)
        if (!next) {
            setError("")
            setConfirming(null)
        }
    }

    // Shared by the form and the suggestion chips.
    async function add(value) {
        const name = value.trim()
        if (!name) return
        setError("")
        if (habitNames.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
            setError("habitExists")
            return
        }
        try {
            const result = await onAddHabit(name)
            if (!result.success) {
                setError(result.error)
                return
            }
            setNewHabit("")
        } catch {
            setError("addHabitFailed")
        }
    }

    async function submit(event) {
        event.preventDefault()
        setAdding(true)
        try {
            await add(newHabit)
        } finally {
            setAdding(false)
        }
    }

    async function remove(name) {
        setRemoving(name)
        setError("")
        try {
            const result = await onRemoveHabit(name)
            if (!result.success) setError(result.error)
            setConfirming(null)
        } catch {
            setError("removeHabitFailed")
        } finally {
            setRemoving(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("manageHabits.title")}</DialogTitle>
                    <DialogDescription>{t("manageHabits.description")}</DialogDescription>
                </DialogHeader>

                {habits.length === 0 ? (
                    <p className="rounded-xl bg-muted px-4 py-6 text-center text-sm text-muted-foreground">
                        {t("manageHabits.empty")}
                    </p>
                ) : (
                    <ul className="divide-y rounded-xl border">
                        {habits.map(({ name }) => (
                            <li key={name} className="px-3 py-2">
                                {confirming === name ? (
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm">
                                            {t.rich("manageHabits.confirmRemove", {
                                                name,
                                                b: (chunks) => <span className="font-medium">{chunks}</span>,
                                            })}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setConfirming(null)} disabled={removing !== null}>
                                                {t("common.cancel")}
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => remove(name)} disabled={removing !== null}>
                                                {removing === name ? t("manageHabits.removing") : t("manageHabits.remove")}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="min-w-0 truncate text-sm font-medium">{name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            aria-label={t("manageHabits.removeHabit", { name })}
                                            onClick={() => setConfirming(name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                <form onSubmit={submit} className="space-y-2">
                    <Label htmlFor={inputId}>{t("manageHabits.addLabel")}</Label>
                    <div className="flex gap-2">
                        <Input
                            id={inputId}
                            placeholder={t("manageHabits.placeholder")}
                            value={newHabit}
                            maxLength={HABIT_NAME_MAX_LENGTH}
                            onChange={(event) => { setNewHabit(event.target.value); setError("") }}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? errorId : undefined}
                        />
                        <Button type="submit" disabled={adding || !newHabit.trim()}>
                            <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                            {t("manageHabits.add")}
                        </Button>
                    </div>
                    {error && <p id={errorId} role="alert" className="text-sm text-destructive">{errorMessage(t, error)}</p>}
                </form>

                <HabitSuggestions existing={habitNames} onAdd={add} label={t("manageHabits.ideas")} />
            </DialogContent>
        </Dialog>
    )
}
