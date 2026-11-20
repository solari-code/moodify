"use server"

import { revalidatePath } from "next/cache"
import { getStore } from "@/lib/store"
import { requireUserId } from "@/lib/requireUser"
import { normalizeDisplayName } from "@/lib/validation"

// Sets the name the user wants to be called in the app (profile settings).
// An empty value removes it, so the account's name is used again.
//
// Returns { success: true, displayName } (the stored name, trimmed; null
// when removed) or { success: false, error: code } for invalid input (the UI
// shows errors.<code>); missing authentication and storage failures throw.
export async function updateDisplayName(value) {
    const userId = await requireUserId();

    const { name, error } = normalizeDisplayName(value);
    if (error) {
        return { success: false, error }
    }

    try {
        await getStore().setDisplayName(userId, name);
        // the name is shown on every page (navigation, greeting)
        revalidatePath("/", "layout");
        return { success: true, displayName: name }
    } catch (error) {
        console.error("Error saving the display name:", error)
        throw error
    }
}
