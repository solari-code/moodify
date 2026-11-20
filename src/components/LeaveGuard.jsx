"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import UnsavedChangesDialog from "@/components/dashboard/UnsavedChangesDialog"

// Asks before the user leaves a page with unsaved changes (the dashboard's
// check-in). Covers:
// - links inside the app (GuardedLink: logo, navigation, footer, user menu)
// - actions that leave the page, e.g. signing out (useLeaveGuard().requestLeave)
// - reloading or closing the tab (the browser's own prompt)
//
// Not covered: the browser's back and forward buttons (Next.js can't cancel
// those navigations reliably).
//
// The provider sits in the root layout, so the navigation and footer (which
// live outside the pages) can ask too. A page reports its unsaved changes
// with useUnsavedChanges().

const LeaveGuardContext = createContext(null)

export function LeaveGuardProvider({ children }) {

    // { dayLabel, focusId } while a page has unsaved changes, otherwise null
    const [guard, setGuard] = useState(null)
    // { proceed, dayLabel, focusId, opener } while the question is shown
    const [pending, setPending] = useState(null)

    // reload or close the tab: the browser asks (its own text, can't be translated)
    useEffect(() => {
        if (!guard) return
        function warn(event) {
            event.preventDefault()
            event.returnValue = "" // older browsers need this to show the prompt
        }
        window.addEventListener("beforeunload", warn)
        return () => window.removeEventListener("beforeunload", warn)
    }, [guard])

    // Runs `proceed` right away, or after the user agreed to discard the changes.
    const requestLeave = useCallback((proceed) => {
        if (!guard) {
            proceed()
            return
        }
        // opener: after "Keep editing", focus goes back to what asked (e.g. the
        // logo); if that's gone (a menu item, a link in the closed mobile menu),
        // to the part of the page with the changes (focusId)
        setPending({ proceed, dayLabel: guard.dayLabel, focusId: guard.focusId, opener: document.activeElement })
    }, [guard])

    function discard() {
        const { proceed } = pending
        setPending(null)
        // the changes are given up: no browser prompt if leaving reloads the page
        setGuard(null)
        proceed()
    }

    const value = useMemo(() => ({
        hasUnsavedChanges: guard !== null,
        leavePending: pending !== null,
        requestLeave,
        setGuard,
    }), [guard, pending, requestLeave])

    return (
        <LeaveGuardContext.Provider value={value}>
            {children}
            <UnsavedChangesDialog
                reason="leave"
                open={pending !== null}
                dayLabel={pending?.dayLabel ?? ""}
                onKeep={() => setPending(null)}
                onDiscard={discard}
                opener={pending?.opener}
                fallbackFocusId={pending?.focusId}
            />
        </LeaveGuardContext.Provider>
    )
}

// { hasUnsavedChanges, leavePending, requestLeave(proceed) }
export function useLeaveGuard() {
    const context = useContext(LeaveGuardContext)
    if (!context) throw new Error("useLeaveGuard needs a <LeaveGuardProvider> (see src/app/layout.js)")
    return context
}

// For pages: reports unsaved changes while `dirty` is true.
// dayLabel: the day with the changes, shown in the question
// focusId:  id of the element with the changes (focusable, e.g. tabIndex -1);
//           gets the focus after "Keep editing" when the element that asked is gone
export function useUnsavedChanges(dirty, { dayLabel, focusId }) {
    const { setGuard } = useLeaveGuard()

    useEffect(() => {
        if (!dirty) return
        setGuard({ dayLabel, focusId })
        return () => setGuard(null)
    }, [dirty, dayLabel, focusId, setGuard])
}

// A Next.js Link that asks first while there are unsaved changes. Links to
// the current page don't ask: the page stays as it is.
export function GuardedLink({ href, onNavigate, ...props }) {
    const router = useRouter()
    const { hasUnsavedChanges, requestLeave } = useLeaveGuard()

    function handleNavigate(event) {
        onNavigate?.(event)
        if (!hasUnsavedChanges) return
        const target = new URL(href, window.location.href)
        if (target.pathname === window.location.pathname) return

        // only the app's navigation is canceled; the click itself goes on
        // (so e.g. the user menu still closes)
        event.preventDefault()
        requestLeave(() => router.push(href))
    }

    return <Link href={href} onNavigate={handleNavigate} {...props} />
}
