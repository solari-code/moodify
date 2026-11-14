"use server"

import { auth } from "@/../auth"
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function addHabit(habit) {

    const session = await auth();

    if (!session || !session.user?.id) {
        throw new Error("Not authenticated")
    }

    const client = await clientPromise
    const db = client.db("moodify")

    try {
        const result = await db.collection("habits").updateOne(
            { userId: new ObjectId(session.user.id) },
            {
                $push: { habits: habit },
                $setOnInsert: { createdAt: new Date() },
                $set: { updatedAt: new Date() }
            },
            { upsert: true }
        )

        if (result.acknowledged) {
            return { success: true, message: "Habit added successfully" }
        } else {
            throw new Error("Failed to add habit")
        }
    } catch (error) {
        console.error("Error adding habit:", error)
        throw error
    }


}

export async function getHabits() {

    const session = await auth();

    if (!session || !session.user?.id) {
        throw new Error("Not authenticated")
    }

    const client = await clientPromise
    const db = client.db("moodify")

    const habits = await db.collection("habits").findOne({ userId: new ObjectId(session.user.id) })
    return habits || []
}

export async function removeHabit(habitName) {

    const session = await auth();

    if (!session || !session.user?.id) {
        throw new Error("Not authenticated")
    }

    const client = await clientPromise
    const db = client.db("moodify")

    try {
        const result = await db.collection("habits").updateOne(
            { userId: new ObjectId(session.user.id) },
            {
                $pull: { habits: { name: habitName } },
                $set: { updatedAt: new Date() }
            }
        )

        if (result.acknowledged) {
            return { success: true, message: "Habit removed successfully" }
        } else {
            throw new Error("Failed to remove habit")
        }
    } catch (error) {
        console.error("Error removing habit:", error)
        throw error
    }
}
