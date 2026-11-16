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

// Asks before leaving a day whose check-in has unsaved changes.
//
// open:      whether the question is shown
// dayLabel:  the day with the unsaved changes, e.g. "Sunday, 15 November"
// onKeep:    stay on the day (also on Escape / click outside)
// onDiscard: drop the changes and go to the other day
export default function UnsavedChangesDialog({ open, dayLabel, onKeep, onDiscard }) {
    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) onKeep() }}>
            <DialogContent role="alertdialog" className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Discard unsaved changes?</DialogTitle>
                    <DialogDescription>
                        Your check-in for {dayLabel} isn&apos;t saved yet. If you switch days now, these changes are lost.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={onDiscard}>Discard changes</Button>
                    <Button onClick={onKeep} autoFocus>Keep editing</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
