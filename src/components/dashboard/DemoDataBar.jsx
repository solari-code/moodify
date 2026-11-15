"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

// Only shown in local mode: fills the dashboard with demo data for testing.
// onLoad: calls the server and updates the dashboard; returns the action result.
export default function DemoDataBar({ onLoad }) {

    let [confirming, setConfirming] = useState(false)
    let [pending, setPending] = useState(false)
    let [message, setMessage] = useState(null) // { type: "success" | "error", text }

    async function load() {
        setPending(true)
        setMessage(null)
        try {
            const result = await onLoad()
            if (result.success) {
                setMessage({ type: "success", text: `Demo data loaded: ${result.habits.length} habits, ${result.entries.length} entries` })
                setConfirming(false)
            } else {
                setMessage({ type: "error", text: result.message })
            }
        } catch {
            setMessage({ type: "error", text: "Could not load the demo data. Please try again." })
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-between gap-3 rounded-md border border-dashed p-3 text-sm sm:flex-row">
            <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Local mode:</span> try the dashboard with a few months of sample data.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
                {message && (
                    <p role={message.type === "error" ? "alert" : "status"} className={message.type === "error" ? "text-destructive" : "text-muted-foreground"}>
                        {message.text}
                    </p>
                )}

                {!confirming ? (
                    <Button variant="outline" size="sm" onClick={() => { setConfirming(true); setMessage(null) }}>
                        Load demo data
                    </Button>
                ) : (
                    <div className="flex flex-col items-center gap-2 sm:flex-row">
                        <span>This replaces all your local habits and entries.</span>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={load} disabled={pending}>
                                {pending ? "Loading…" : "Replace with demo data"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
