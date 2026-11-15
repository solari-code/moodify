"use server"

import { revalidatePath } from "next/cache"
import { isLocalMode } from "@/lib/mode"
import { getStore } from "@/lib/store"
import { requireUserId } from "@/lib/requireUser"
import { isValidDateKey, isFutureDateKey } from "@/lib/dates"
import { createDemoData } from "@/lib/demoData"

// Replaces the signed-in user's habits and entries with demo data.
// Local mode only: checked first, before anything else is done.
//
// todayKey: the user's today ("YYYY-MM-DD" from the browser); the demo
// entries end yesterday, so today stays free to try logging.
export async function loadDemoData(todayKey) {
    if (!isLocalMode()) {
        return { success: false, message: "Demo data is only available in local mode" }
    }

    const userId = await requireUserId();

    if (!isValidDateKey(todayKey) || isFutureDateKey(todayKey)) {
        return { success: false, message: "Invalid date for today" }
    }

    const store = getStore();
    await store.replaceUserData(userId, createDemoData(todayKey));
    revalidatePath("/dashboard");

    const [habits, entries] = await Promise.all([store.getHabits(userId), store.getEntries(userId)]);
    return { success: true, habits, entries }
}
