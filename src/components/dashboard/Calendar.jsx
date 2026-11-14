"use client"

import { Calendar } from "@/components/ui/calendar"

export default function Component({ setDate, date }) {

    return (
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border calendar-component"
            disabled={{ after: new Date() }}
            required
        />
    )

}