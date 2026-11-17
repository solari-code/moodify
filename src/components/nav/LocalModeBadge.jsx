import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"
import { getTranslations } from "@/i18n/server"

// Shown in the navigation while the app runs in local mode.
export default async function LocalModeBadge({ className }) {

    const t = await getTranslations("localMode")

    return (
        <span
            title={t("hint")}
            className={cn(
                "inline-flex items-center gap-1 rounded-full bg-peach px-2.5 py-0.5 text-xs font-medium text-peach-foreground",
                className
            )}
        >
            <FlaskConical className="h-3 w-3" aria-hidden="true" />
            {t("badge")}
        </span>
    )
}
