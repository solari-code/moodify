"use client"

import { useId, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import MoodPicker from "@/components/dashboard/MoodPicker"
import HabitRow from "@/components/dashboard/HabitRow"
import ProgressRing from "@/components/dashboard/ProgressRing"

const HABITS = [
    { name: "Morning walk", streak: 12 },
    { name: "Read 20 pages", streak: 3 },
    { name: "No phone after 10 pm", streak: 0 },
]

// The dashboard's check-in card with the real components, for the landing
// page. Fully clickable, but nothing is saved.
export default function CheckInPreview() {

    const moodLabelId = useId()
    const [mood, setMood] = useState(7)
    const [done, setDone] = useState(["Morning walk", "Read 20 pages"])

    function toggle(name) {
        setDone((current) => current.includes(name) ? current.filter((n) => n !== name) : [...current, name])
    }

    return (
        <Card className="relative w-full shadow-soft-lg">
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0 px-4 sm:px-6">
                <div className="space-y-1.5">
                    <CardTitle as="h2" className="text-2xl">Today&apos;s check-in</CardTitle>
                    <CardDescription>Try it, nothing is saved</CardDescription>
                </div>
                <ProgressRing done={done.length} total={HABITS.length} />
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
                <section className="space-y-3">
                    <h3 id={moodLabelId} className="font-sans text-base font-medium">How are you feeling?</h3>
                    <MoodPicker value={mood} onChange={setMood} labelId={moodLabelId} />
                </section>
                <section className="space-y-3">
                    <h3 className="font-sans text-base font-medium">Habits</h3>
                    <ul className="grid gap-2">
                        {HABITS.map(({ name, streak }) => (
                            <li key={name}>
                                <HabitRow name={name} done={done.includes(name)} streak={streak} onToggle={() => toggle(name)} />
                            </li>
                        ))}
                    </ul>
                </section>
            </CardContent>
        </Card>
    )
}
