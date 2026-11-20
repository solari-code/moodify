"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateDisplayName } from "@/app/actions/profile"
import { DISPLAY_NAME_MAX_LENGTH, normalizeDisplayName } from "@/lib/validation"
import { useTranslations } from "@/i18n/client"
import { errorMessage } from "@/i18n/errors"

// The name Moodify uses for the user (greeting, user menu, avatar). Empty
// means: use the account's name (shown as the placeholder).
//
// displayName: the saved name (null: none set)
// accountName: the account's name (GitHub or the demo user; may be null)
export default function DisplayNameForm({ displayName, accountName }) {

    const t = useTranslations()
    const inputId = useId()
    const hintId = useId()
    const errorId = useId()

    const [saved, setSaved] = useState(displayName ?? "")
    const [value, setValue] = useState(displayName ?? "")
    const [pending, setPending] = useState(false)
    const [error, setError] = useState("") // error code, see errorMessage
    const [justSaved, setJustSaved] = useState(false)

    // what would be stored: trimmed, inner spaces collapsed
    const normalized = normalizeDisplayName(value)
    const changed = normalized.error !== undefined || (normalized.name ?? "") !== saved

    async function submit(event) {
        event.preventDefault()
        if (!changed || pending) return
        if (normalized.error) {
            setError(normalized.error)
            return
        }
        setPending(true)
        setError("")
        try {
            const result = await updateDisplayName(value)
            if (!result.success) {
                setError(result.error)
                return
            }
            setSaved(result.displayName ?? "")
            setValue(result.displayName ?? "")
            setJustSaved(true)
        } catch {
            setError("saveNameFailed")
        } finally {
            setPending(false)
        }
    }

    return (
        <form onSubmit={submit} className="space-y-2">
            <Label htmlFor={inputId}>{t("settings.profile.nameLabel")}</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                    id={inputId}
                    value={value}
                    placeholder={accountName ?? ""}
                    maxLength={DISPLAY_NAME_MAX_LENGTH}
                    autoComplete="nickname"
                    onChange={(event) => { setValue(event.target.value); setError(""); setJustSaved(false) }}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${errorId} ${hintId}` : hintId}
                    className="sm:max-w-sm"
                />
                <Button type="submit" disabled={!changed || pending} className="sm:w-auto">
                    {t(pending ? "settings.profile.saving" : "settings.profile.save")}
                </Button>
            </div>
            {error && <p id={errorId} role="alert" className="text-sm text-destructive">{errorMessage(t, error)}</p>}
            <p id={hintId} className="text-sm text-muted-foreground">
                {accountName
                    ? t("settings.profile.hint", { accountName })
                    : t("settings.profile.hintNoAccountName")}
            </p>
            <p role="status" className="text-sm font-medium text-primary">
                {justSaved && t("settings.profile.saved")}
            </p>
        </form>
    )
}
