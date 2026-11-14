"use client"

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useState } from 'react'

import Calendar from "@/components/dashboard/Calendar"
import DayTracker from '@/components/dashboard/DayTracker'
import Overview from '@/components/dashboard/Overview'

export default function ClientWrapper({ habits }) {

    let [date, setDate] = useState(new Date());
    console.log({ date })


    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-[2rem] items-start">
                <Card className=" flex-shrink-0 text-center">
                    <CardHeader >
                        <CardTitle>Select Date</CardTitle>
                    </CardHeader>
                    <CardContent className="cale">
                        <Calendar setDate={setDate} date={date} />
                    </CardContent>
                </Card>
                <Card className="flex-1 text-center">
                    <CardHeader >
                        <CardTitle>Log your Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DayTracker habits={habits} />
                    </CardContent>
                </Card>
                <Card className="flex-1 text-center">
                    <CardHeader>
                        <CardTitle>Mood & Habbit overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Overview />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}