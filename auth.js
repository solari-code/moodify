import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { getMongoClient } from "@/lib/mongodb"
import { isLocalMode } from "@/lib/mode"

// The user every local-mode login signs in as.
export const DEMO_USER = {
    id: "local-demo-user",
    name: "Demo User",
    email: "demo@moodify.local",
    image: null,
}

// Only used in local mode when AUTH_SECRET is not set. Local mode is for
// development and testing, so a well-known secret is acceptable there.
const LOCAL_MODE_SECRET = "moodify-local-mode-not-a-real-secret"

// Local mode: a "demo" login without password, sessions stored in a JWT cookie.
function localConfig() {
    return {
        providers: [
            Credentials({
                id: "demo",
                name: "Demo user",
                credentials: {},
                authorize: async () => DEMO_USER,
            }),
        ],
        session: { strategy: "jwt" },
        secret: process.env.AUTH_SECRET || LOCAL_MODE_SECRET,
        trustHost: true,
    }
}

// Normal mode: GitHub login, users and sessions stored in MongoDB.
function githubConfig() {
    return {
        providers: [GitHub],
        adapter: MongoDBAdapter(getMongoClient()),
    }
}

// Auth.js' own pages (sign-in, sign-out, error, verify-request) are only
// available in English. Instead, users always land on the translated landing
// page, which has the sign-in button (errors arrive there as ?error=…).
const PAGES = {
    signIn: "/",
    signOut: "/",
    error: "/",
    verifyRequest: "/",
}

// The config is built per request (lazy initialisation), so the mode check
// only runs at request time and `next build` works without any env vars.
export const { handlers, signIn, signOut, auth } = NextAuth(() => ({
    ...(isLocalMode() ? localConfig() : githubConfig()),
    pages: PAGES,
    callbacks: {
        session: async ({ session, user, token }) => {
            if (session?.user) {
                // database sessions (GitHub) provide `user`, JWT sessions (local) provide `token`
                session.user.id = user?.id ?? token?.sub;
            }
            return session;
        }
    }
}))
