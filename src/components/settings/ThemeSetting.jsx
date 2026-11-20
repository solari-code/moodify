"use client"

import { useId } from "react"
import { RadioCards } from "@/components/ui/radio-cards"
import { setTheme, useTheme } from "@/components/appearance/appearanceStore"
import { THEMES } from "@/lib/appearance"
import { useTranslations } from "@/i18n/client"

// The dashboard's color theme. Applies right away and is saved in a cookie
// (see src/lib/appearance.js).
//
// initialTheme: the saved theme, read on the server
export default function ThemeSetting({ initialTheme }) {

    const t = useTranslations("settings.appearance")
    const theme = useTheme(initialTheme)
    const labelId = useId()

    const options = THEMES.map((value) => ({
        value,
        label: t(`themes.${value}.label`),
        hint: t(`themes.${value}.hint`),
        visual: <ThemePreview theme={value} />,
    }))

    return (
        <div className="space-y-3">
            <h3 id={labelId} className="font-sans text-sm font-semibold">{t("theme")}</h3>
            <RadioCards options={options} value={theme} onChange={setTheme} labelledBy={labelId} className="sm:grid-cols-2 lg:grid-cols-4" />
        </div>
    )
}

// A few colors of a theme, in the current mode: data-theme on this element
// switches the color tokens inside it to that theme (see globals.css).
function ThemePreview({ theme }) {
    return (
        <span data-theme={theme} aria-hidden="true" className="flex h-10 w-full items-center gap-1.5 rounded-lg border bg-background px-2.5">
            <span className="h-5 w-5 rounded-full bg-primary" />
            <span className="h-5 w-5 rounded-full bg-heatmap-2" />
            <span className="h-5 w-5 rounded-full bg-secondary ring-1 ring-inset ring-border" />
            <span className="ml-auto h-4 w-7 rounded-md bg-card ring-1 ring-inset ring-border" />
        </span>
    )
}
