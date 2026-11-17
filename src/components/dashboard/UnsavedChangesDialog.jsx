"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/i18n/client"

// Asks before leaving a day whose check-in has unsaved changes.
//
// open:      whether the question is shown
// dayLabel:  the day with the unsaved changes, e.g. "Sunday, November 15, 2026"
// onKeep:    stay on the day (also on Escape / click outside)
// onDiscard: drop the changes and go to the other day
export default function UnsavedChangesDialog({ open, dayLabel, onKeep, onDiscard }) {

    const t = useTranslations("dashboard.unsaved")

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) onKeep() }}>
            <DialogContent role="alertdialog" className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t("description", { day: dayLabel })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={onDiscard}>{t("discard")}</Button>
                    <Button onClick={onKeep} autoFocus>{t("keep")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
