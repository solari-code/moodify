"use server"

import { auth } from "@/../auth"
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'

export async function addMoodEntry(data) {

    const session = await auth();

    if (!session || !session.user?.id) {
        throw new Error("Not authenticated")
    }

    const client = await clientPromise
    const db = client.db("moodify")

    let date = data.date;
    let year = date.getFullYear();
    let month = (date.getMonth() + 1).padStart(2, 0);
    let day = date.getDate().padStart(2, 0);

    const entry = {
        userId: new ObjectId(session.user.id),
        date: new Date(date),
        mood: mood,
        habits: habits.filter(h => h.completed).map(h => h.name),
        createdAt: new Date(),
        updatedAt: new Date()
    }


}