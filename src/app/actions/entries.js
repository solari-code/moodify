"use server"

import { auth } from "@/../auth"
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { formatDateToUTC } from "@/lib/utils"


export async function getEntry({ date }) {

    const session = await auth();

    if (!session || !session.user?.id) {
        throw new Error("Not authenticated")
    }

    let dateFormatted = formatDateToUTC(date);

    const client = await clientPromise
    const db = client.db("moodify")

    const entry = await db.collection("entries").findOne({ userId: new ObjectId(session.user.id), date: dateFormatted })
    return entry || {}
}

export async function addEntry({ date, mood, habits = [] }) {

    const session = await auth();

    if (!session || !session.user?.id) {
        throw new Error("Not authenticated")
    }

    let dateFormatted = formatDateToUTC(date);

    const client = await clientPromise
    const db = client.db("moodify")

    const entry = { mood, date, habits }

    try {
        const result = await db.collection("entries").updateOne(
            { userId: new ObjectId(session.user.id), date: dateFormatted },
            {
                $push: entry,
                $setOnInsert: { createdAt: new Date(), userId: session.user.id },
                $set: { updatedAt: new Date() }
            },
            { upsert: true }
        )

        if (result.acknowledged) {
            return { success: true, message: "Entry added successfully" }
        } else {
            throw new Error("Failed to add entry")
        }
    } catch (error) {
        console.error("Error adding entry:", error)
        throw error
    }

}
