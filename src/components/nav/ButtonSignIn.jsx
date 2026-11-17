import { Button } from "@/components/ui/button";
import { signInAction } from "@/app/actions/auth";
import { isLocalMode } from "@/lib/mode";
import { getTranslations } from "@/i18n/server";

// Server component: the label depends on the mode, and the form submits
// to a server action (demo login in local mode, GitHub otherwise).
//
// compact: short label for the navigation bar
// children: extra content after the label (e.g. an icon)
export default async function ButtonSignIn({ compact = false, className, children, ...buttonProps }) {

    const t = await getTranslations("signIn");
    const localMode = isLocalMode();
    const label = localMode
        ? t(compact ? "demoCompact" : "demo")
        : t(compact ? "compact" : "github");

    return (
        <form action={signInAction} className={className}>
            <Button type="submit" {...buttonProps}>
                {label}
                {children}
            </Button>
        </form>
    )
}
