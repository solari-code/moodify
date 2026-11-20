"use client"

import { useEffect, useRef } from "react"
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
// reason:    "switchDay" (another day was picked) or "leave" (another page,
//            or signing out; see src/components/LeaveGuard.jsx)
// open:      whether the question is shown
// dayLabel:  the day with the unsaved changes, e.g. "Sunday, November 15, 2026"
// onKeep:    stay (also on Escape / click outside)
// onDiscard: drop the changes and go on
// opener:    the element that had focus when the question came up (a day,
//            a link, a menu item); focus goes back there on close
// fallbackFocusId: id of an element to focus instead when the opener is gone
//            (e.g. a menu item, or a day in the closed calendar)
export default function UnsavedChangesDialog({ reason = "switchDay", open, dayLabel, onKeep, onDiscard, opener, fallbackFocusId }) {

    const t = useTranslations("dashboard.unsaved")

    // The dialog has no trigger button, so Radix wouldn't know where to put
    // focus on close (it would end up on the page body). The props are gone
    // while the dialog animates out, so they are kept here.
    const returnFocus = useRef(null)
    useEffect(() => {
        if (open) returnFocus.current = { opener, fallbackFocusId }
    }, [open, opener, fallbackFocusId])

    function handleCloseAutoFocus(event) {
        const { opener, fallbackFocusId } = returnFocus.current ?? {}
        returnFocus.current = null
        const target = opener?.isConnected && opener !== document.body
            ? opener
            : fallbackFocusId && document.getElementById(fallbackFocusId)
        if (target) {
            event.preventDefault()
            target.focus()
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!next) onKeep() }}>
            <DialogContent role="alertdialog" className="max-w-md" onCloseAutoFocus={handleCloseAutoFocus}>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>{t(reason === "leave" ? "descriptionLeave" : "description", { day: dayLabel })}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={onDiscard}>{t("discard")}</Button>
                    <Button onClick={onKeep} autoFocus>{t("keep")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
