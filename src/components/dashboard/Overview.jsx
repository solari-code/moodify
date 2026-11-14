"use client"

import { useState } from "react"
import { Label } from "../ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"


export default function Overview() {

    let [timeRange, setTimeRange] = useState("week");


    return (
        <div className="space-y-4">
            <div className="space-y-4">
                <Label size="m" htmlFor="average-mood-period">Average Mood</Label>
                <Select
                    value={timeRange}
                    onValueChange={setTimeRange}
                >
                    <SelectTrigger id="average-mood-period">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="week">Last Week</SelectItem>
                        <SelectItem value="month">Last Month</SelectItem>
                        <SelectItem value="year">Last Year</SelectItem>
                        <SelectItem value="total">Total</SelectItem>
                    </SelectContent>
                </Select>
                <div className="mt-2 text-2xl font-bold text-center">
                    {/* {mockAverageMoods[averageMoodPeriod as keyof typeof mockAverageMoods].toFixed(1)} */}
                    7.5
                </div>
            </div>
            <Separator />
            <div>
                <Label size="m">Habit Streaks</Label>

                <div className="space-y-2 mt-2">
                    {/* {mockStreaks.map((streak, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <span>{streak.habit}</span>
                            <Badge variant="secondary" className="flex items-center space-x-1">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span>{streak.streak} days</span>
                            </Badge>
                        </div>
                    ))} */}
                </div>

            </div>
        </div>
    )
}