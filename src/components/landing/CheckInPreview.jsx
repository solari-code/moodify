"use client"

import { useId, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import MoodPicker from "@/components/dashboard/MoodPicker"
import HabitRow from "@/components/dashboard/HabitRow"
import ProgressRing from "@/components/dashboard/ProgressRing"
import { useTranslations } from "@/i18n/client"

// Sample habits: the key of the translated name (sampleHabits.<key>) and a
// streak. Morning walk's streak is also shown next to the card (see page.js).
const HABITS = [
    { key: "morningWalk", streak: 12 },
    { key: "read20Pages", streak: 3 },
    { key: "noPhoneAfter10pm", streak: 0 },
]

// The dashboard's check-in card with the real components, for the landing
// page. Fully clickable, but nothing is saved.
export default function CheckInPreview() {

    const t = useTranslations()
    const moodLabelId = useId()
    const [mood, setMood] = useState(7)
    // keys, not names, so ticked habits stay ticked when the language changes
    const [done, setDone] = useState(["morningWalk", "read20Pages"])

    function toggle(key) {
        setDone((current) => current.includes(key) ? current.filter((k) => k !== key) : [...current, key])
    }

    return (
        <Card className="relative w-full shadow-soft-lg">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-4 sm:px-6">
                <div className="space-y-1.5">
                    <CardTitle as="h2" className="text-2xl">{t("checkIn.titleToday")}</CardTitle>
                    <CardDescription>{t("landing.preview.description")}</CardDescription>
                </div>
                <ProgressRing done={done.length} total={HABITS.length} />
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
                <section className="space-y-3">
                    <h3 id={moodLabelId} className="font-sans text-base font-medium">{t("checkIn.moodQuestionToday")}</h3>
                    <MoodPicker value={mood} onChange={setMood} labelId={moodLabelId} />
                </section>
                <section className="space-y-3">
                    <h3 className="font-sans text-base font-medium">{t("checkIn.habits")}</h3>
                    <ul className="grid gap-2">
                        {HABITS.map(({ key, streak }) => (
                            <li key={key}>
                                <HabitRow name={t(`sampleHabits.${key}`)} done={done.includes(key)} streak={streak} onToggle={() => toggle(key)} />
                            </li>
                        ))}
                    </ul>
                </section>
            </CardContent>
        </Card>
    )
}
