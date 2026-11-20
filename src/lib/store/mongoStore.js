import { ObjectId } from "mongodb"
import { getMongoClient } from "@/lib/mongodb"

// Normal-mode storage in MongoDB.
//
// habits:   { userId: ObjectId, habits: [{ name }], createdAt, updatedAt }  (existing layout)
// entries:  { userId: ObjectId, date: "YYYY-MM-DD", mood, habits: [names], createdAt, updatedAt }
// profiles: { userId: ObjectId, displayName, createdAt, updatedAt }  (one per user, only once
//           the user has set a name; the account's name stays in Auth.js' `users`)
//
// A unique index on { userId, date } makes sure there is only one entry per
// user and day, even if two saves for the same day arrive at the same time
// (profiles: a unique index on userId).

const DUPLICATE_KEY_ERROR = 11000

function getDb() {
    return getMongoClient().db("moodify")
}

// Creates the unique index once per server process. If that fails (e.g.
// because of duplicate old data), the error is logged and saving still works;
// the index is tried again on the next call.
function ensureEntryIndexes(db) {
    globalThis._moodifyEntryIndexes ??= db.collection("entries")
        .createIndex({ userId: 1, date: 1 }, { unique: true, name: "userId_date_unique" })
        .catch((error) => {
            globalThis._moodifyEntryIndexes = undefined
            console.error("Moodify: could not create the unique index on entries { userId, date }:", error)
        })
    return globalThis._moodifyEntryIndexes
}

// Same for the profiles: a unique index on userId (one profile per user).
function ensureProfileIndexes(db) {
    globalThis._moodifyProfileIndexes ??= db.collection("profiles")
        .createIndex({ userId: 1 }, { unique: true, name: "userId_unique" })
        .catch((error) => {
            globalThis._moodifyProfileIndexes = undefined
            console.error("Moodify: could not create the unique index on profiles { userId }:", error)
        })
    return globalThis._moodifyProfileIndexes
}

// Plain data for callers (no ObjectId / Date objects).
function toEntry(doc) {
    return {
        date: doc.date,
        mood: doc.mood,
        habits: doc.habits ?? [],
        createdAt: doc.createdAt?.toISOString?.() ?? doc.createdAt ?? null,
        updatedAt: doc.updatedAt?.toISOString?.() ?? doc.updatedAt ?? null,
    }
}

export const mongoStore = {
    // The user's profile: { displayName } (null: use the account's name).
    async getProfile(userId) {
        const db = getDb()
        const doc = await db.collection("profiles").findOne({ userId: new ObjectId(userId) })
        return { displayName: doc?.displayName ?? null }
    },

    // Saves the name the user wants to be called; null removes it.
    // An upsert on userId: at most one profile per user.
    async setDisplayName(userId, displayName) {
        const db = getDb()
        await ensureProfileIndexes(db)
        const now = new Date()
        await db.collection("profiles").updateOne(
            { userId: new ObjectId(userId) },
            displayName === null
                ? { $unset: { displayName: "" }, $set: { updatedAt: now } }
                : { $set: { displayName, updatedAt: now }, $setOnInsert: { createdAt: now } },
            { upsert: displayName !== null }
        )
        return { displayName }
    },

    async getHabits(userId) {
        const db = getDb()
        const doc = await db.collection("habits").findOne({ userId: new ObjectId(userId) })
        // Only return plain data, so the result can be passed to client components.
        return (doc?.habits ?? []).map((habit) => ({ name: habit.name }))
    },

    async addHabit(userId, habit) {
        const db = getDb()
        await db.collection("habits").updateOne(
            { userId: new ObjectId(userId) },
            {
                $push: { habits: { name: habit.name } },
                $setOnInsert: { createdAt: new Date() },
                $set: { updatedAt: new Date() }
            },
            { upsert: true }
        )
    },

    async removeHabit(userId, habitName) {
        const db = getDb()
        await db.collection("habits").updateOne(
            { userId: new ObjectId(userId) },
            {
                $pull: { habits: { name: habitName } },
                $set: { updatedAt: new Date() }
            }
        )
    },

    // All entries of the user, oldest first.
    async getEntries(userId) {
        const db = getDb()
        const docs = await db.collection("entries")
            // only day-key entries; skips documents in any older format
            .find({ userId: new ObjectId(userId), date: { $type: "string" } })
            .sort({ date: 1 })
            .toArray()
        return docs.map(toEntry)
    },

    async getEntry(userId, date) {
        const db = getDb()
        const doc = await db.collection("entries").findOne({ userId: new ObjectId(userId), date })
        return doc ? toEntry(doc) : null
    },

    // Creates the entry for the day or overwrites the existing one
    // (createdAt of an existing entry is kept).
    async saveEntry(userId, { date, mood, habits }) {
        const db = getDb()
        await ensureEntryIndexes(db)

        const collection = db.collection("entries")
        const filter = { userId: new ObjectId(userId), date }
        const now = new Date()
        const update = {
            $set: { mood, habits, updatedAt: now },
            $setOnInsert: { createdAt: now },
        }

        let doc
        try {
            doc = await collection.findOneAndUpdate(filter, update, { upsert: true, returnDocument: "after" })
        } catch (error) {
            // Two saves for a new day at the same time: both tried to insert,
            // the unique index rejected one. The entry exists now, so update it.
            if (error?.code !== DUPLICATE_KEY_ERROR) throw error
            doc = await collection.findOneAndUpdate(filter, update, { returnDocument: "after" })
        }
        return toEntry(doc)
    },

    // Returns true if an entry was deleted, false if there was none.
    async deleteEntry(userId, date) {
        const db = getDb()
        const result = await db.collection("entries").deleteOne({ userId: new ObjectId(userId), date })
        return result.deletedCount === 1
    },
}
