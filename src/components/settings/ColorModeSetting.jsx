"use client"

import { useId } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { RadioCards } from "@/components/ui/radio-cards"
import { setColorMode, useColorMode } from "@/components/appearance/appearanceStore"
import { COLOR_MODES } from "@/lib/appearance"
import { useTranslations } from "@/i18n/client"

const ICONS = { light: Sun, dark: Moon, system: Monitor }

// Light, dark or the device's setting. Applies right away and is saved in a
// cookie (see src/lib/appearance.js).
//
// initialMode: the saved mode, read on the server
export default function ColorModeSetting({ initialMode }) {

    const t = useTranslations("settings.appearance")
    const mode = useColorMode(initialMode)
    const labelId = useId()

    const options = COLOR_MODES.map((value) => ({
        value,
        icon: ICONS[value],
        label: t(`modes.${value}.label`),
        hint: t(`modes.${value}.hint`),
    }))

    return (
        <div className="space-y-3">
            <h3 id={labelId} className="font-sans text-sm font-semibold">{t("colorMode")}</h3>
            <RadioCards options={options} value={mode} onChange={setColorMode} labelledBy={labelId} />
        </div>
    )
}
