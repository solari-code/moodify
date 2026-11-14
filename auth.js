import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import client from "@/lib/mongodb"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [GitHub],
    adapter: MongoDBAdapter(client),
    callbacks: {
        session: async ({ session, user }) => {
            if (session?.user) {
                session.user.id = user.id;
            }
            return session;
        }
    }
})