import { cache } from "react"
import { auth } from "@/../auth"
import { getStore } from "@/lib/store"

// The signed-in user as the app shows them, or null when signed out.
//
//   { id, email, image,
//     name,        the name to show: the one set in the profile settings,
//                  otherwise the account's name (may be null)
//     displayName, the name set in the profile settings (null: none)
//     accountName  the name from the account (GitHub, or the demo user) }
//
// Everything that shows the user's name uses this (navigation, user menu,
// avatar, greeting, settings), so all show the same name. Cached per
// request: the session and the profile are only read once.
//
// Server-only: must not be imported from client components.
export const getCurrentUser = cache(async () => {
    const session = await auth()
    const user = session?.user
    if (!user?.id) return null

    const { displayName } = await getStore().getProfile(user.id)
    const accountName = user.name ?? null
    return {
        id: user.id,
        email: user.email ?? null,
        image: user.image ?? null,
        name: displayName ?? accountName,
        displayName,
        accountName,
    }
})
