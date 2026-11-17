"use server"

import { revalidatePath } from "next/cache"
import { getStore } from "@/lib/store"
import { requireUserId } from "@/lib/requireUser"
import { normalizeHabitName } from "@/lib/validation"

// Invalid input returns { success: false, error: code } (see entries.js).

export async function addHabit(habit) {

    const userId = await requireUserId();
    const { name, error } = normalizeHabitName(habit?.name);

    if (error) {
        return { success: false, error }
    }

    try {
        const store = getStore();
        const habits = await store.getHabits(userId);

        if (habits.some((h) => h.name.toLowerCase() === name.toLowerCase())) {
            return { success: false, error: "habitExists" }
        }

        await store.addHabit(userId, { name });
        // see revalidateDashboard in entries.js
        revalidatePath("/dashboard");
        // the stored habit (name trimmed), so the client shows exactly what was saved
        return { success: true, habit: { name } }
    } catch (error) {
        console.error("Error adding habit:", error)
        throw error
    }
}

// Always returns an array (empty for new users).
export async function getHabits() {

    const userId = await requireUserId();
    return getStore().getHabits(userId)
}

export async function removeHabit(habitName) {

    const userId = await requireUserId();

    try {
        await getStore().removeHabit(userId, habitName);
        revalidatePath("/dashboard");
        return { success: true }
    } catch (error) {
        console.error("Error removing habit:", error)
        throw error
    }
}
