import { redirect } from "next/navigation"
import { auth } from "@/../auth"

// For pages and layouts: returns the signed-in user or sends them to the
// landing page, where they can sign in (Auth.js' own sign-in page is only
// available in English).
//
// Next.js renders a layout and its page in parallel, so a redirect in the
// layout alone doesn't stop the page from running. Pages that load user data
// should call this as well.
export async function requireUser() {
    const session = await auth();

    if (!session || !session.user?.id) {
        redirect("/")
    }
    return session.user
}

// For server actions: returns the signed-in user's id or throws.
// (Actions are called from the client, so they can't redirect to sign-in.)
export async function requireUserId() {
    const session = await auth();

    if (!session || !session.user?.id) {
        throw new Error("Not authenticated")
    }
    return session.user.id
}
