"use server"

import { signIn, signOut } from "@/../auth"
import { isLocalMode } from "@/lib/mode"

// Local mode: demo login without account. Normal mode: GitHub login.
// Both lead to the dashboard afterwards.
export async function signInAction() {
    await signIn(isLocalMode() ? "demo" : "github", { redirectTo: "/dashboard" })
}

// Signs out and returns to the landing page.
export async function signOutAction() {
    await signOut({ redirectTo: "/" })
}
