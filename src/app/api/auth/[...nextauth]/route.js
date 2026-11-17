import { NextResponse } from "next/server"
import { handlers } from "@/../auth"

// Auth.js' own (English-only) pages are replaced by the landing page (see
// `pages` in auth.js). A few failed GET requests still get a plain English
// error text instead of a page, e.g. an unknown /api/auth/… URL, or the
// GitHub callback when the server is misconfigured. A browser only gets
// there by following a link or a redirect, so it is sent to the landing page
// too. Successful responses (session, CSRF token, redirects) and POST
// requests are passed on unchanged.
export async function GET(request) {
    const response = await handlers.GET(request)
    if (response.status < 400) return response

    const url = new URL("/", request.url)
    if (response.status >= 500) url.searchParams.set("error", "Configuration")
    return NextResponse.redirect(url)
}

export const { POST } = handlers
