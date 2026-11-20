"use client"

import { useOptimistic, useTransition } from "react"
import { ChevronDown, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LANGUAGES, getLanguage } from "@/i18n/config"
import { useLocale, useTranslations } from "@/i18n/client"
import { setLocale } from "@/app/actions/locale"
import { cn } from "@/lib/utils"

// Lets the user pick the app language from a menu. The choice is saved in a
// cookie (see setLocale) and the page comes back from the server in the new
// language; nothing else on the page is reset.
//
// Each language is shown in its own language ("Deutsch", "Español"), marked
// with `lang`, so screen readers pronounce it correctly. The menu scrolls
// when there are more languages than fit on the screen.
//
// variant: "compact" (small button, desktop navigation), "block" (labelled,
//          full-width button, mobile navigation) or "field" (outlined button
//          without its own label, e.g. in the settings under a "Language" title)
export default function LanguageSwitcher({ variant = "compact", className }) {

    const locale = useLocale()
    const t = useTranslations("languageSwitcher")
    const [pending, startTransition] = useTransition()
    // shows the picked language right away, until the page has switched
    const [shownLocale, setShownLocale] = useOptimistic(locale)
    const current = getLanguage(shownLocale)
    const block = variant === "block"
    const field = variant === "field"
    // outlined button that opens a menu of its width
    const wide = block || field

    function change(next) {
        if (next === shownLocale) return
        startTransition(async () => {
            setShownLocale(next)
            await setLocale(next)
        })
    }

    const menu = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={wide ? "outline" : "ghost"}
                    size={wide ? "default" : "sm"}
                    aria-busy={pending || undefined}
                    className={wide
                        ? cn("w-full justify-start gap-2", field && className)
                        : cn("gap-2 text-muted-foreground hover:text-accent-foreground", className)}
                >
                    <Globe className={cn("h-4 w-4", pending && "animate-pulse")} aria-hidden="true" />
                    {/* accessible name "Language: Deutsch", visible "Deutsch" */}
                    {t.rich("current", {
                        hidden: (chunks) => <span className="sr-only">{chunks}</span>,
                        language: <span lang={current.code}>{current.name}</span>,
                    })}
                    {wide && <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={wide ? "start" : "end"}
                className={cn(
                    "max-h-[min(20rem,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto",
                    wide ? "w-[var(--radix-dropdown-menu-trigger-width)]" : "min-w-[10rem]"
                )}
            >
                {!wide && <>
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{t("label")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                </>}
                <DropdownMenuRadioGroup value={shownLocale} onValueChange={change}>
                    {LANGUAGES.map(({ code, name }) => (
                        <DropdownMenuRadioItem key={code} value={code} lang={code} disabled={pending} className={wide ? "py-2.5" : undefined}>
                            {name}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )

    if (!block) return menu // compact and field: the button alone

    // visible label above the button (decorative for screen readers: the
    // button's own name already says "Language")
    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-sm font-medium text-muted-foreground" aria-hidden="true">{t("label")}</p>
            {menu}
        </div>
    )
}
