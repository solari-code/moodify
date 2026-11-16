"use client"

import { useState } from "react"
import { FlaskConical } from "lucide-react"
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
        <div className="flex flex-col gap-3 rounded-xl border border-peach-strong/40 bg-peach/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-peach-foreground">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                    <span className="font-semibold">Local mode:</span> try the dashboard with a few months of sample data.
                </span>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {message && (
                    <p role={message.type === "error" ? "alert" : "status"} className={message.type === "error" ? "text-destructive" : "text-peach-foreground"}>
                        {message.text}
                    </p>
                )}

                {!confirming ? (
                    <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => { setConfirming(true); setMessage(null) }}>
                        Load demo data
                    </Button>
                ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="text-peach-foreground">This replaces all your local habits and entries.</span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
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
