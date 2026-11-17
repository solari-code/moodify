import Link from "next/link"
import { CircleAlert, X } from "lucide-react"
import { getTranslations } from "@/i18n/server"
import { authErrorKey } from "@/lib/authErrors"

// Shown on the landing page when Auth.js sent the user back with ?error=…
// (instead of its own English error page, see `pages` in auth.js). The sign-in
// button is right below, so trying again is one click.
//
// Closing links to "/" without the parameter: the notice goes away and the
// URL is clean (works without JavaScript).
//
// error: the error type from the URL, e.g. "OAuthCallbackError"
export default async function SignInErrorNotice({ error }) {

    const t = await getTranslations()

    return (
        <div className="container relative mx-auto max-w-6xl px-4 pt-6">
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-card p-4 text-sm shadow-soft">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                <div className="flex-1 space-y-0.5">
                    <p className="font-semibold">{t("authErrors.title")}</p>
                    <p className="text-muted-foreground">{t(`authErrors.${authErrorKey(error)}`)}</p>
                </div>
                <Link
                    href="/"
                    scroll={false}
                    aria-label={t("common.close")}
                    className="-m-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </Link>
            </div>
        </div>
    )
}
