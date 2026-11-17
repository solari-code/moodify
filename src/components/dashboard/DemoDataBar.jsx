"use client"

import { useState } from "react"
import { FlaskConical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/i18n/client"
import { errorMessage } from "@/i18n/errors"

// Only shown in local mode: fills the dashboard with demo data for testing.
// onLoad: calls the server and updates the dashboard; returns the action result.
export default function DemoDataBar({ onLoad }) {

    const t = useTranslations()
    let [confirming, setConfirming] = useState(false)
    let [pending, setPending] = useState(false)
    // { type: "success", habits, entries } | { type: "error", error: code } (see errorMessage)
    // (kept as data, not text, so it follows a language switch)
    let [message, setMessage] = useState(null)

    async function load() {
        setPending(true)
        setMessage(null)
        try {
            const result = await onLoad()
            if (result.success) {
                setMessage({ type: "success", habits: result.habits.length, entries: result.entries.length })
                setConfirming(false)
            } else {
                setMessage({ type: "error", error: result.error })
            }
        } catch {
            setMessage({ type: "error", error: "loadDemoFailed" })
        } finally {
            setPending(false)
        }
    }

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-peach-strong/40 bg-peach/50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-peach-foreground">
                <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                    {t.rich("dashboard.demoData.intro", { b: (chunks) => <span className="font-semibold">{chunks}</span> })}
                </span>
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {message && (
                    <p role={message.type === "error" ? "alert" : "status"} className={message.type === "error" ? "text-destructive" : "text-peach-foreground"}>
                        {message.type === "success"
                            ? t("dashboard.demoData.loaded", { habits: message.habits, entries: message.entries })
                            : errorMessage(t, message.error)}
                    </p>
                )}

                {!confirming ? (
                    <Button variant="outline" size="sm" className="self-start sm:self-auto" onClick={() => { setConfirming(true); setMessage(null) }}>
                        {t("dashboard.demoData.load")}
                    </Button>
                ) : (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="text-peach-foreground">{t("dashboard.demoData.confirm")}</span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
                                {t("common.cancel")}
                            </Button>
                            <Button size="sm" onClick={load} disabled={pending}>
                                {pending ? t("dashboard.demoData.loading") : t("dashboard.demoData.replace")}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
