"use server"

import { revalidatePath } from "next/cache"
import { getStore } from "@/lib/store"
import { requireUserId } from "@/lib/requireUser"
import { isValidDateKey } from "@/lib/dates"
import { validateEntryInput } from "@/lib/validation"

// One entry per user and day. Days are "YYYY-MM-DD" keys created in the
// browser (see src/lib/dates.js).
//
// Invalid input returns { success: false, error: code } so the UI can show
// the translated message (errors.<code>); missing authentication and storage
// failures throw.

// The dashboard keeps its own state after changes, but the browser also caches
// the page for back/forward navigation. Without this, going back to the
// dashboard would show the data from the last full page load.
function revalidateDashboard() {
    revalidatePath("/dashboard")
}

// All entries of the signed-in user, oldest first.
export async function getEntries() {
    const userId = await requireUserId();
    return getStore().getEntries(userId)
}

// Saves the entry for `date`. If the day already has an entry, it is overwritten.
// input: { date: "YYYY-MM-DD", mood: 0-10, habits: [names of habits done] }
export async function saveEntry(input) {
    const userId = await requireUserId();

    const result = validateEntryInput(input);
    if (!result.ok) {
        return { success: false, error: result.error }
    }

    try {
        const entry = await getStore().saveEntry(userId, result.value);
        revalidateDashboard();
        return { success: true, entry }
    } catch (error) {
        console.error("Error saving entry:", error)
        throw error
    }
}

// Deletes the whole entry for `date`.
export async function deleteEntry(date) {
    const userId = await requireUserId();

    if (!isValidDateKey(date)) {
        return { success: false, error: "invalidDate" }
    }

    try {
        const deleted = await getStore().deleteEntry(userId, date);
        revalidateDashboard();
        return deleted
            ? { success: true }
            // notFound: e.g. already deleted in another tab; the UI can drop it too
            : { success: false, notFound: true, error: "entryNotFound" }
    } catch (error) {
        console.error("Error deleting entry:", error)
        throw error
    }
}
