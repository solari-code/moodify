"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Flame } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

import { addHabit as addHabitToDB, removeHabit as removeHabitFromDB } from "@/app/actions/habits"


export default function DayTracker({ habits: habitsFromDB }) {

    let [mood, setMood] = useState(() => {
        let localStorageMood = window.localStorage.getItem('mood');
        return localStorageMood ? JSON.parse(localStorageMood) : 0
    })
    let [moodSelected, setMoodSelected] = useState(() => {
        if (localStorage.getItem('mood')) return true
        return false
    });
    let [moodValueChanged, setMoodValueChanged] = useState(false);
    let [habits, setHabits] = useState(habitsFromDB)
    let [newHabit, setNewHabit] = useState("")
    let [tooltipOpen, setTooltipOpen] = useState(false)
    let [tooltipError, setTooltipError] = useState("");

    function handleTooltipError(error) {
        setTooltipError(error);
        setTooltipOpen(true);
        setTimeout(removeTooltipError, 3000);
    }
    function removeTooltipError() {
        setTooltipOpen(false);
        setTooltipError("");
    }

    function addHabit(habit) {
        if (!habit) return
        if (habits.some(el => el.name?.toLowerCase().trim() == habit?.toLowerCase().trim()) || !habit) {
            handleTooltipError("This habit already exists :)")
            return
        }

        addHabitToDB({ name: habit });
        setHabits([...habits, { name: habit, checked: false }]);
        setNewHabit("")
    }
    function toggleHabit(index) {
        let habitsClone = [...habits];
        habitsClone[index].checked = !habitsClone[index].checked
        setHabits(habitsClone)
    }

    function removeHabit(index, habitName) {
        removeHabitFromDB(habitName);
        let habitsClone = [...habits].filter((el, ind) => ind != index)
        setHabits(habitsClone)
    }

    function addEntry() {
        localStorage.setItem('mood', mood);
        setMoodValueChanged(false);
    }


    useEffect(() => {
        localStorage.setItem('habits', JSON.stringify(habits))
    }, [habits])


    let moodEmoji;
    switch (mood) {
        case 0:
            moodEmoji = '😭'; // Very bad / Extremely sad
            break;
        case 1:
            moodEmoji = '😢'; // Bad / Very sad
            break;
        case 2:
            moodEmoji = '😩'; // Sad
            break;
        case 3:
            moodEmoji = '😞'; // Neutral / Just okay
            break;
        case 4:
            moodEmoji = '😐'; // Slightly happy
            break;
        case 5:
            moodEmoji = '🙂'; // Happy
            break;
        case 6:
            moodEmoji = '😊'; // Quite happy
            break;
        case 7:
            moodEmoji = '😄'; // Happy
            break;
        case 8:
            moodEmoji = '🤗'; // Very happy
            break;
        case 9:
            moodEmoji = '🥰'; // Super happy
            break;
        case 10:
            moodEmoji = '😍'; // Extremely happy
            break;
        default:
            moodEmoji = '🤷‍♂️'; // Unknown mood
    }

    return (
        <>
            <div className="space-y-4">
                <Label size="m" htmlFor="mood-slider">How are you?</Label>
                <Slider
                    id="mood-slider"
                    min={0}
                    max={10}
                    step={1}
                    value={[mood]}
                    onValueChange={(value) => {
                        if (!moodSelected) { setMoodSelected(true) }
                        setMoodValueChanged(true);
                        setMood(value[0])
                    }}
                />
                <div className="text-center font-semibold">{
                    !moodSelected ? "🌞" :
                        mood + " " + moodEmoji
                }</div>
            </div>
            <Separator className="my-5" />
            <div className="space-y-2">
                <Label size="m">Habits</Label>
                {habits.map((habit, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`habit-${index}`}
                                checked={habit.checked}
                                onCheckedChange={() => toggleHabit(index)}
                            />
                            <Label htmlFor={`habit-${index}`}>{habit.name}</Label>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeHabit(index, habit.name)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <div className="flex items-center space-x-2">

                    <TooltipProvider disableHoverableContent>
                        <Tooltip open={tooltipOpen}>
                            <TooltipTrigger asChild>
                                <Input
                                    placeholder="Add new habit"
                                    value={newHabit}
                                    onChange={(e) => setNewHabit(e.target.value)}
                                />
                            </TooltipTrigger>

                            <TooltipContent>
                                <p>{tooltipError}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button
                        onClick={() => { addHabit(newHabit) }}
                        size="icon"
                        className="min-w-[40px]">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                {
                    !moodSelected ?
                        <Button disabled className="w-full disabled">Select your mood</Button> :
                        moodValueChanged ?
                            <Button className="w-full" onClick={addEntry}>Save Entry</Button> :
                            <Button disabled className="w-full disabled">Entry saved</Button>

                }

            </div>

        </>
    )
}

